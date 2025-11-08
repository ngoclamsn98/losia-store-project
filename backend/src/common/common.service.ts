import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EcoImpact } from '../eco-impacts/entities/eco-impact.entity';
import { ProductCondition } from '../product-conditions/entities/product-condition.entity';
import { Category } from '../categories/entities/category.entity';
import { ProductStatus, ProductSeason } from '../products/entities/product.entity';
import { UserRole, Gender } from '../users/entities/user.entity';

export interface OptionResponse {
  label: string;
  value: string | number;
  data?: any;
}

@Injectable()
export class CommonService {
  // Whitelist of allowed tables for security
  private readonly ALLOWED_TABLES = [
    'eco_impacts',
    'product_conditions',
    'categories',
  ];

  // Table configuration mapping
  private readonly TABLE_CONFIG = {
    eco_impacts: {
      labelField: 'productGroup',
      valueField: 'id',
      additionalFields: ['glassesOfWater', 'hoursOfLighting', 'kmsOfDriving'],
    },
    product_conditions: {
      labelField: 'label',
      valueField: 'id',
      additionalFields: ['value', 'description'],
    },
    categories: {
      labelField: 'name',
      valueField: 'id',
      additionalFields: ['slug', 'description', 'imageUrl', 'parentId'],
    },
  };

  constructor(
    @InjectRepository(EcoImpact)
    private ecoImpactRepository: Repository<EcoImpact>,
    @InjectRepository(ProductCondition)
    private productConditionRepository: Repository<ProductCondition>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async getOptions(
    table: string,
    customLabelField?: string,
    customValueField?: string,
  ): Promise<OptionResponse[]> {
    // Validate table name
    if (!this.ALLOWED_TABLES.includes(table)) {
      throw new BadRequestException(
        `Invalid table. Allowed tables: ${this.ALLOWED_TABLES.join(', ')}`,
      );
    }

    // Get table configuration
    const config = this.TABLE_CONFIG[table];
    const labelField = customLabelField || config.labelField;
    const valueField = customValueField || config.valueField;

    let data: any[];

    // Fetch data based on table
    switch (table) {
      case 'eco_impacts':
        data = await this.ecoImpactRepository.find({
          order: { productGroup: 'ASC' },
        });
        break;

      case 'product_conditions':
        data = await this.productConditionRepository.find({
          order: { label: 'ASC' },
        });
        break;

      case 'categories':
        data = await this.categoryRepository.find({
          where: { isActive: true },
          order: { order: 'ASC', name: 'ASC' },
        });
        break;

      default:
        throw new BadRequestException('Table not supported');
    }

    // Transform data to option format
    return data.map((item) => {
      const option: OptionResponse = {
        label: item[labelField] || 'N/A',
        value: item[valueField],
      };

      // Include additional fields if configured
      if (config.additionalFields && config.additionalFields.length > 0) {
        option.data = {};
        config.additionalFields.forEach((field: string) => {
          if (item[field] !== undefined) {
            option.data[field] = item[field];
          }
        });
      }

      return option;
    });
  }

  async getEnums(enumName: string): Promise<OptionResponse[]> {
    const normalizedEnumName = enumName.toLowerCase().replace(/_/g, '');

    let enumValues: any;
    let labels: Record<string, string> = {};

    switch (normalizedEnumName) {
      case 'productstatus':
        enumValues = ProductStatus;
        labels = {
          DRAFT: 'Draft',
          ACTIVE: 'Active',
          INACTIVE: 'Inactive',
          OUT_OF_STOCK: 'Out of Stock',
        };
        break;

      case 'productseason':
        enumValues = ProductSeason;
        labels = {
          SPRING: 'Spring',
          SUMMER: 'Summer',
          FALL: 'Fall',
          WINTER: 'Winter',
          ALL_SEASON: 'All Season',
        };
        break;

      case 'userrole':
        enumValues = UserRole;
        labels = {
          SUPERADMIN: 'Super Admin',
          ADMIN: 'Admin',
          MANAGER: 'Manager',
          STAFF: 'Staff',
          USER: 'User',
        };
        break;

      case 'gender':
        enumValues = Gender;
        labels = {
          MALE: 'Male',
          FEMALE: 'Female',
          OTHER: 'Other',
        };
        break;

      default:
        throw new BadRequestException(
          'Invalid enum. Allowed enums: product_status, product_season, user_role, gender',
        );
    }

    // Convert enum to options array
    return Object.keys(enumValues)
      .filter((key) => isNaN(Number(key))) // Filter out numeric keys for string enums
      .map((key) => ({
        label: labels[key] || key,
        value: enumValues[key],
      }));
  }

  /**
   * Get hierarchical categories (with parent-child relationship)
   */
  async getCategoriesHierarchy(): Promise<any[]> {
    const categories = await this.categoryRepository.find({
      where: { isActive: true },
      order: { order: 'ASC', name: 'ASC' },
    });

    // Build hierarchy
    const categoryMap = new Map<string, any>();
    const rootCategories: any[] = [];

    // First pass: create map
    categories.forEach((cat) => {
      categoryMap.set(cat.id, { ...cat, children: [] });
    });

    // Second pass: build hierarchy
    categories.forEach((cat) => {
      const categoryNode = categoryMap.get(cat.id);
      if (cat.parentId) {
        const parent = categoryMap.get(cat.parentId);
        if (parent) {
          parent.children.push(categoryNode);
        } else {
          rootCategories.push(categoryNode);
        }
      } else {
        rootCategories.push(categoryNode);
      }
    });

    return rootCategories;
  }
}

