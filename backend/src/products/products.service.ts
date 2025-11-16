import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Product, ProductStatus, ProductSeason } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { Category } from '../categories/entities/category.entity';
import { EcoImpact } from '../eco-impacts/entities/eco-impact.entity';
import { ProductCondition } from '../product-conditions/entities/product-condition.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';
import { PaginatedResult } from '../common/dto/pagination.dto';
import * as dayjs from 'dayjs';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(ProductVariant)
    private variantRepository: Repository<ProductVariant>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(EcoImpact)
    private ecoImpactRepository: Repository<EcoImpact>,
    @InjectRepository(ProductCondition)
    private productConditionRepository: Repository<ProductCondition>,
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
  ) {}

  async create(createProductDto: CreateProductDto, userId?: string): Promise<Product | undefined> {
    try {
      // Generate slug if not provided
    if (!createProductDto.slug) {
      createProductDto.slug = this.generateSlug(createProductDto.name);
    }

    // Check if slug already exists and auto-generate unique slug
    createProductDto.slug = await this.ensureUniqueSlug(createProductDto.slug);

    // Ensure at least one variant is marked as default
    const hasDefault = createProductDto.variants.some((v) => v.isDefault);
    if (!hasDefault && createProductDto.variants.length > 0) {
      createProductDto.variants[0].isDefault = true;
    }

    // Create product with variants
    const { variants, categoryIds, ecoImpactId, productConditionId, ...productData } = createProductDto;
    const product = this.productRepository.create({
      ...productData,
      createdById: userId, // Set creator
    });

    // Handle categories if provided
    if (categoryIds && categoryIds.length > 0) {
      const categories = await this.categoryRepository.find({
        where: { id: In(categoryIds) },
      });

      if (categories.length !== categoryIds.length) {
        throw new BadRequestException('One or more categories not found');
      }

      product.categories = categories;
    }

    // Handle eco impact if provided
    if (ecoImpactId) {
      const ecoImpact = await this.ecoImpactRepository.findOne({
        where: { id: ecoImpactId },
      });

      if (!ecoImpact) {
        throw new BadRequestException('Eco impact not found');
      }

      product.ecoImpactId = ecoImpactId;
    }

    // Handle product condition if provided
    if (productConditionId) {
      const productCondition = await this.productConditionRepository.findOne({
        where: { id: productConditionId },
      });

      if (!productCondition) {
        throw new BadRequestException('Product condition not found');
      }

      product.productConditionId = productConditionId;
    }

    // Save product first
    const savedProduct = await this.productRepository.save(product);

    // Create variants
    const variantEntities = variants.map((variantDto) => {
      const variant = this.variantRepository.create({
        ...variantDto,
        productId: savedProduct.id,
      });
      return variant;
    });

    await this.variantRepository.save(variantEntities);

    // Return product with variants
    return await this.findOne(savedProduct.id);
    } catch (error) {
      this.logger.error('Error creating product', error);
    }
  }

  async findAll(filters?: {
    categoryIds?: string[];
    status?: ProductStatus;
    isFeatured?: boolean;
    search?: string;
    variantAttributes?: Record<string, string[]>; // e.g., { "color": ["Red", "Blue"], "size": ["M"] }
    page?: number;
    limit?: number;
    userId?: string; // Filter by creator
    userRole?: string; // User role to determine if can see all
    // New filters for menu navigation
    departmentTags?: string[]; // e.g., ['women', 'premium']
    categoryTags?: string[]; // e.g., ['dresses', 'tops']
    styleTags?: string[]; // e.g., ['belts', 'hats']
    colorNames?: string[]; // e.g., ['red', 'blue']
    charsPattern?: string; // e.g., 'solid', 'striped'
    condition?: string; // e.g., 'q1_nwt' (new with tags)
    listedDays?: number; // e.g., 7 (products listed in last 7 days)
    priceMin?: number;
    priceMax?: number;
    luxeBrand?: boolean;
    curationId?: string;
    sort?: string; // e.g., 'price_low_high', 'newest'
  }): Promise<PaginatedResult<Product>> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const query = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.variants', 'variants')
      .leftJoinAndSelect('product.categories', 'categories')
      .leftJoinAndSelect('product.createdBy', 'createdBy')
      .leftJoinAndSelect('product.ecoImpact', 'ecoImpact');

    // Filter by creator: Only SUPERADMIN can see all products
    if (filters?.userId && filters?.userRole !== 'SUPERADMIN') {
      query.andWhere('product.createdById = :userId', { userId: filters.userId });
    }

    if (filters?.categoryIds?.length) {
      query.andWhere('categories.id IN (:...categoryIds)', {
        categoryIds: filters.categoryIds,
      });
    }

    if (filters?.status) {
      query.andWhere('product.status = :status', { status: filters.status });
    }

    // if (filters?.isFeatured !== undefined) {
    //   query.andWhere('product.isFeatured = :isFeatured', {
    //     isFeatured: filters.isFeatured,
    //   });
    // }

    if (filters?.search) {
      query.andWhere(
        '(product.name ILIKE :search OR product.description ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    // Filter by variant attributes
    // Product must have at least one variant matching ALL selected attribute filters
    if (filters?.variantAttributes && Object.keys(filters.variantAttributes).length > 0) {
      // For each attribute key (e.g., "color", "size"), check if variant has any of the selected values
      const attributeConditions: string[] = [];
      const attributeParams: Record<string, any> = {};

      let paramIndex = 0;
      for (const [attrKey, attrValues] of Object.entries(filters.variantAttributes)) {
        if (attrValues && attrValues.length > 0) {
          const paramKey = `attrKey${paramIndex}`;
          const paramValues = `attrValues${paramIndex}`;

          // Check if variant.attributes->>attrKey is in attrValues
          attributeConditions.push(
            `EXISTS (
              SELECT 1 FROM product_variants pv
              WHERE pv.product_id = product.id
              AND pv.attributes->>:${paramKey} IN (:...${paramValues})
              AND pv.is_active = true
            )`
          );

          attributeParams[paramKey] = attrKey;
          attributeParams[paramValues] = attrValues;
          paramIndex++;
        }
      }

      if (attributeConditions.length > 0) {
        // Product must match ALL attribute filters (AND logic)
        query.andWhere(`(${attributeConditions.join(' AND ')})`, attributeParams);
      }
    }

    // New filters for menu navigation
    if (filters?.departmentTags?.length) {
      query.andWhere('product.department_tags && :departmentTags', {
        departmentTags: filters.departmentTags,
      });
    }

    if (filters?.categoryTags?.length) {
      query.andWhere('product.category_tags && :categoryTags', {
        categoryTags: filters.categoryTags,
      });
    }

    if (filters?.styleTags?.length) {
      query.andWhere('product.style_tags && :styleTags', {
        styleTags: filters.styleTags,
      });
    }

    if (filters?.colorNames?.length) {
      query.andWhere('product.color_names && :colorNames', {
        colorNames: filters.colorNames,
      });
    }

    if (filters?.charsPattern) {
      query.andWhere('product.chars_pattern = :charsPattern', {
        charsPattern: filters.charsPattern,
      });
    }

    if (filters?.condition) {
      // Map condition to productCondition value
      query.andWhere('productCondition.value = :condition', {
        condition: filters.condition,
      });
    }

    if (filters?.listedDays) {
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - filters.listedDays);
      query.andWhere('product.created_at >= :daysAgo', { daysAgo });
    }

    if (filters?.priceMin !== undefined || filters?.priceMax !== undefined) {
      if (filters.priceMin !== undefined && filters.priceMax !== undefined) {
        query.andWhere('product.price BETWEEN :priceMin AND :priceMax', {
          priceMin: filters.priceMin,
          priceMax: filters.priceMax,
        });
      } else if (filters.priceMin !== undefined) {
        query.andWhere('product.price >= :priceMin', {
          priceMin: filters.priceMin,
        });
      } else if (filters.priceMax !== undefined) {
        query.andWhere('product.price <= :priceMax', {
          priceMax: filters.priceMax,
        });
      }
    }

    if (filters?.luxeBrand !== undefined) {
      query.andWhere('product.luxe_brand = :luxeBrand', {
        luxeBrand: filters.luxeBrand,
      });
    }

    if (filters?.curationId) {
      query.andWhere('product.curation_id = :curationId', {
        curationId: filters.curationId,
      });
    }

    // Sorting
    if (filters?.sort) {
      switch (filters.sort) {
        case 'price_low_high':
          query.orderBy('product.price', 'ASC');
          break;
        case 'price_high_low':
          query.orderBy('product.price', 'DESC');
          break;
        case 'newest':
          query.orderBy('product.createdAt', 'DESC');
          break;
        case 'oldest':
          query.orderBy('product.createdAt', 'ASC');
          break;
        default:
          query.orderBy('product.createdAt', 'DESC');
      }
    } else {
      query.orderBy('product.createdAt', 'DESC');
    }

    // Get total count
    const total = await query.getCount();

    // Apply pagination
    query.skip(skip).take(limit);

    // Get data
    const data = await query.getMany();

    // Calculate pagination meta
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Get available variant filters grouped by attribute name
   * Returns all unique attribute keys and their possible values
   */
  async getVariantFilters(filters?: {
    categoryIds?: string[];
    status?: ProductStatus;
  }): Promise<{
    attributes: Record<string, { name: string; values: string[]; count: number }>;
  }> {
    const query = this.variantRepository
      .createQueryBuilder('variant')
      .innerJoin('variant.product', 'product')
      .where('variant.isActive = :isActive', { isActive: true })
      .andWhere('variant.attributes IS NOT NULL');

    // Apply same filters as product list
    if (filters?.categoryIds?.length) {
      query
        .innerJoin('product.categories', 'category')
        .andWhere('category.id IN (:...categoryIds)', {
          categoryIds: filters.categoryIds,
        });
    }

    if (filters?.status) {
      query.andWhere('product.status = :status', { status: filters.status });
    }

    // Get all variants with their attributes
    const variants = await query.select(['variant.attributes']).getMany();

    // Group attributes by key and collect unique values
    const attributesMap = new Map<string, Set<string>>();

    for (const variant of variants) {
      if (variant.attributes && typeof variant.attributes === 'object') {
        for (const [key, value] of Object.entries(variant.attributes)) {
          if (value && typeof value === 'string') {
            if (!attributesMap.has(key)) {
              attributesMap.set(key, new Set());
            }
            attributesMap.get(key)!.add(value);
          }
        }
      }
    }

    // Convert to response format
    const attributes: Record<string, { name: string; values: string[]; count: number }> = {};

    for (const [key, valuesSet] of attributesMap.entries()) {
      const values = Array.from(valuesSet).sort();
      attributes[key] = {
        name: key,
        values,
        count: values.length,
      };
    }

    return { attributes };
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['variants', 'categories', 'ecoImpact', 'productCondition'],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async findBySlug(slug: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { slug },
      relations: ['variants', 'categories', 'ecoImpact', 'productCondition'],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Increment views
    product.views += 1;
    await this.productRepository.save(product);

    return product;
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);

    // Check if slug is being updated and ensure it's unique
    if (updateProductDto.slug && updateProductDto.slug !== product.slug) {
      updateProductDto.slug = await this.ensureUniqueSlug(updateProductDto.slug, id);
    }

    // Handle categories update
    if (updateProductDto.categoryIds !== undefined) {
      if (updateProductDto.categoryIds.length > 0) {
        const categories = await this.categoryRepository.find({
          where: { id: In(updateProductDto.categoryIds) },
        });

        if (categories.length !== updateProductDto.categoryIds.length) {
          throw new BadRequestException('One or more categories not found');
        }

        product.categories = categories;
      } else {
        product.categories = [];
      }
    }

    // Handle eco impact update
    if (updateProductDto.ecoImpactId !== undefined) {
      if (updateProductDto.ecoImpactId) {
        const ecoImpact = await this.ecoImpactRepository.findOne({
          where: { id: updateProductDto.ecoImpactId },
        });

        if (!ecoImpact) {
          throw new BadRequestException('Eco impact not found');
        }

        product.ecoImpactId = updateProductDto.ecoImpactId;
      } else {
        product.ecoImpactId = null;
      }
    }

    // Handle product condition update
    if (updateProductDto.productConditionId !== undefined) {
      if (updateProductDto.productConditionId) {
        const productCondition = await this.productConditionRepository.findOne({
          where: { id: updateProductDto.productConditionId },
        });

        if (!productCondition) {
          throw new BadRequestException('Product condition not found');
        }

        product.productConditionId = updateProductDto.productConditionId;
      } else {
        product.productConditionId = null;
      }
    }

    // Update product first (without variants)
    const { variants, categoryIds, ecoImpactId, productConditionId, ...productData } = updateProductDto;
    Object.assign(product, productData);
    await this.productRepository.save(product);

    // Handle variants update
    if (updateProductDto.variants) {
      // Ensure at least one variant is marked as default
      const hasDefault = updateProductDto.variants.some((v) => v.isDefault);
      if (!hasDefault && updateProductDto.variants.length > 0) {
        updateProductDto.variants[0].isDefault = true;
      }

      // Get existing variants
      const existingVariants = await this.variantRepository.find({
        where: { productId: id },
      });

      // Collect IDs from request
      const requestVariantIds = updateProductDto.variants
        .filter((v) => v.id)
        .map((v) => v.id);

      // Delete variants that are not in the request
      const variantsToDelete = existingVariants.filter(
        (v) => !requestVariantIds.includes(v.id),
      );
      if (variantsToDelete.length > 0) {
        await this.variantRepository.remove(variantsToDelete);
      }

      // Update or create variants
      for (const variantDto of updateProductDto.variants) {
        if (variantDto.id) {
          // Update existing variant
          const existingVariant = existingVariants.find(
            (v) => v.id === variantDto.id,
          );
          if (existingVariant) {
            // Update existing variant
            Object.assign(existingVariant, {
              sku: variantDto.sku,
              name: variantDto.name,
              attributes: variantDto.attributes,
              price: variantDto.price,
              compareAtPrice: variantDto.compareAtPrice,
              costPrice: variantDto.costPrice,
              stock: variantDto.stock,
              lowStockThreshold: variantDto.lowStockThreshold,
              imageUrl: variantDto.imageUrl,
              weight: variantDto.weight,
              isDefault: variantDto.isDefault,
              isActive: variantDto.isActive,
            });
            await this.variantRepository.save(existingVariant);
          } else {
            // ID provided but doesn't exist - create new with new ID
            const { id: _id, ...variantData } = variantDto;
            const newVariant = this.variantRepository.create({
              ...variantData,
              productId: id,
            });
            await this.variantRepository.save(newVariant);
          }
        } else {
          // No ID - create new variant
          const { id: _id, ...variantData } = variantDto;
          const newVariant = this.variantRepository.create({
            ...variantData,
            productId: id,
          });
          await this.variantRepository.save(newVariant);
        }
      }
    }

    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    await this.productRepository.remove(product);
  }

  async updateVariant(
    productId: string,
    variantId: string,
    updateVariantDto: UpdateProductVariantDto,
  ): Promise<ProductVariant> {
    const variant = await this.variantRepository.findOne({
      where: { id: variantId, productId },
    });

    if (!variant) {
      throw new NotFoundException('Variant not found');
    }

    Object.assign(variant, updateVariantDto);
    return await this.variantRepository.save(variant);
  }

  async removeVariant(productId: string, variantId: string): Promise<void> {
    const product = await this.findOne(productId);

    if (product.variants.length <= 1) {
      throw new BadRequestException('Product must have at least one variant');
    }

    const variant = await this.variantRepository.findOne({
      where: { id: variantId, productId },
    });

    if (!variant) {
      throw new NotFoundException('Variant not found');
    }

    await this.variantRepository.remove(variant);

    // If removed variant was default, set first remaining variant as default
    if (variant.isDefault) {
      const remainingVariants = await this.variantRepository.find({
        where: { productId },
      });

      if (remainingVariants.length > 0) {
        remainingVariants[0].isDefault = true;
        await this.variantRepository.save(remainingVariants[0]);
      }
    }
  }

  /**
   * Find related products from same seller
   * Priority: Same category > Same seller
   * Returns up to `limit` products (default: 8, max: 20)
   */
  async findRelatedProducts(productId: string, limit: number = 8): Promise<Product[]> {
    // Validate limit
    const maxLimit = Math.min(Math.max(limit, 1), 20);

    // Get the current product with categories and creator
    const currentProduct = await this.productRepository.findOne({
      where: { id: productId },
      relations: ['categories', 'createdBy'],
    });

    if (!currentProduct) {
      throw new NotFoundException('Product not found');
    }

    const categoryIds = currentProduct.categories?.map(cat => cat.id) || [];
    const creatorId = currentProduct.createdById;

    // Build query for related products
    const query = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.variants', 'variants')
      .leftJoinAndSelect('product.categories', 'categories')
      .leftJoinAndSelect('product.createdBy', 'createdBy')
      .where('product.id != :productId', { productId })
      .andWhere('product.status = :status', { status: ProductStatus.ACTIVE });

    // Priority 1: Same category AND same seller
    if (categoryIds.length > 0 && creatorId) {
      const sameCategoryAndSeller = await query
        .clone()
        .andWhere('categories.id IN (:...categoryIds)', { categoryIds })
        .andWhere('product.createdById = :creatorId', { creatorId })
        .orderBy('product.createdAt', 'DESC')
        .limit(maxLimit)
        .getMany();

      if (sameCategoryAndSeller.length >= maxLimit) {
        return sameCategoryAndSeller;
      }

      // Priority 2: Same category (different seller)
      const sameCategory = await query
        .clone()
        .andWhere('categories.id IN (:...categoryIds)', { categoryIds })
        .andWhere('product.createdById != :creatorId', { creatorId })
        .orderBy('product.createdAt', 'DESC')
        .limit(maxLimit - sameCategoryAndSeller.length)
        .getMany();

      const combined = [...sameCategoryAndSeller, ...sameCategory];
      if (combined.length >= maxLimit) {
        return combined;
      }

      // Priority 3: Same seller (different category)
      const sameSeller = await query
        .clone()
        .andWhere('product.createdById = :creatorId', { creatorId })
        .andWhere(
          categoryIds.length > 0
            ? 'categories.id NOT IN (:...categoryIds)'
            : '1=1',
          categoryIds.length > 0 ? { categoryIds } : {},
        )
        .orderBy('product.createdAt', 'DESC')
        .limit(maxLimit - combined.length)
        .getMany();

      return [...combined, ...sameSeller];
    }

    // Fallback: If no category or creator, just return recent products
    return await query
      .orderBy('product.createdAt', 'DESC')
      .limit(maxLimit)
      .getMany();
  }

  async findByCategories(categoryIds: string[], filters?: {
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<Product>> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const query = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.variants', 'variants')
      .leftJoinAndSelect('product.categories', 'categories');

    if (categoryIds?.length) {
      query.andWhere('categories.id IN (:...categoryIds)', {
        categoryIds,
      });
    }

    query.orderBy('product.createdAt', 'DESC');

    // Get total count
    const total = await query.getCount();

    // Apply pagination
    query.skip(skip).take(limit);

    // Get data
    const data = await query.getMany();

    // Calculate pagination meta
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Search products by keyword
   * Searches in product name, description, and tags
   */
  async searchProducts(query: string, filters?: {
    status?: ProductStatus;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<Product>> {
    if (!query || query.trim().length === 0) {
      return {
        data: [],
        meta: {
          total: 0,
          page: 1,
          limit: filters?.limit || 24,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      };
    }

    const page = filters?.page || 1;
    const limit = filters?.limit || 24;
    const skip = (page - 1) * limit;

    const searchTerm = `%${query.trim()}%`;

    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.variants', 'variants')
      .leftJoinAndSelect('product.categories', 'categories')
      .leftJoinAndSelect('product.ecoImpact', 'ecoImpact')
      .leftJoinAndSelect('product.productCondition', 'productCondition')
      .where(
        '(product.name ILIKE :search OR product.description ILIKE :search OR product.content ILIKE :search)',
        { search: searchTerm },
      );

    // Filter by status (default to ACTIVE for public)
    const status = filters?.status || ProductStatus.ACTIVE;
    queryBuilder.andWhere('product.status = :status', { status });

    // Order by newest first
    queryBuilder.orderBy('product.createdAt', 'DESC');

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    queryBuilder.skip(skip).take(limit);

    // Get data
    const data = await queryBuilder.getMany();

    // Calculate pagination meta
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Find products by nested category slugs (supports 1, 2, or 3 levels)
   * - Level 1 only (slug1): get all products from slug1 and its descendants
   * - Level 1 & 2 (slug1/slug2): get all products from slug2 and its descendants
   * - Level 1 & 2 & 3 (slug1/slug2/slug3): get products from slug3 and its descendants
   */
  async findByNestedCategorySlugs(
    slug1: string,
    slug2?: string,
    slug3?: string,
    filters?: {
      status?: ProductStatus;
      page?: number;
      limit?: number;
    },
  ): Promise<PaginatedResult<Product>> {
    // Find the target category based on the slug hierarchy
    let targetCategory: Category | null = null;

    // First, find level 1 category
    const level1Category = await this.categoryRepository.findOne({
      where: { slug: slug1, isActive: true },
      relations: ['children'],
    });

    if (!level1Category) {
      throw new NotFoundException(`Category with slug "${slug1}" not found`);
    }

    // If only slug1 provided, use level1
    if (!slug2) {
      targetCategory = level1Category;
    } else {
      // Find level 2 category as child of level 1
      const level2Category = await this.categoryRepository.findOne({
        where: {
          slug: slug2,
          parentId: level1Category.id,
          isActive: true,
        },
        relations: ['children'],
      });

      if (!level2Category) {
        throw new NotFoundException(
          `Category with slug "${slug1}/${slug2}" not found`,
        );
      }

      // If only slug1 and slug2 provided, use level2
      if (!slug3) {
        targetCategory = level2Category;
      } else {
        // Find level 3 category as child of level 2
        const level3Category = await this.categoryRepository.findOne({
          where: {
            slug: slug3,
            parentId: level2Category.id,
            isActive: true,
          },
          relations: ['children'],
        });

        if (!level3Category) {
          throw new NotFoundException(
            `Category with slug "${slug1}/${slug2}/${slug3}" not found`,
          );
        }

        targetCategory = level3Category;
      }
    }

    // Collect all category IDs to search (include descendants)
    const categoryIds: string[] = [targetCategory.id];

    // If category has children, recursively get all descendant IDs
    if (targetCategory.children && targetCategory.children.length > 0) {
      const descendantIds = await this.getAllDescendantCategoryIds(
        targetCategory.id,
      );
      categoryIds.push(...descendantIds);
    }

    // Build query
    const page = filters?.page || 1;
    const limit = filters?.limit || 12;
    const skip = (page - 1) * limit;

    const query = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.variants', 'variants')
      .leftJoinAndSelect('product.categories', 'categories')
      .leftJoinAndSelect('product.ecoImpact', 'ecoImpact')
      .leftJoinAndSelect('product.productCondition', 'productCondition')
      .where('categories.id IN (:...categoryIds)', { categoryIds });

    // Filter by status (default to ACTIVE for public)
    const status = filters?.status || ProductStatus.ACTIVE;
    query.andWhere('product.status = :status', { status });

    query.orderBy('product.createdAt', 'DESC');

    // Get total count
    const total = await query.getCount();

    // Apply pagination
    query.skip(skip).take(limit);

    // Get data
    const data = await query.getMany();

    // Calculate pagination meta
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Find products by category slug
   * - If parent category: get all products from all descendant categories
   * - If child category: get products only from that category
   */
  async findByCategorySlug(slug: string, filters?: {
    status?: ProductStatus;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<Product>> {
    // Find category by slug
    const category = await this.categoryRepository.findOne({
      where: { slug, isActive: true },
      relations: ['children'],
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Collect all category IDs to search
    const categoryIds: string[] = [category.id];

    // If category has children, recursively get all descendant IDs
    if (category.children && category.children.length > 0) {
      const descendantIds = await this.getAllDescendantCategoryIds(category.id);
      categoryIds.push(...descendantIds);
    }

    // Build query
    const page = filters?.page || 1;
    const limit = filters?.limit || 12;
    const skip = (page - 1) * limit;

    const query = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.variants', 'variants')
      .leftJoinAndSelect('product.categories', 'categories')
      .leftJoinAndSelect('product.ecoImpact', 'ecoImpact')
      .leftJoinAndSelect('product.productCondition', 'productCondition')
      .where('categories.id IN (:...categoryIds)', { categoryIds });

    // Filter by status (default to ACTIVE for public)
    const status = filters?.status || ProductStatus.ACTIVE;
    query.andWhere('product.status = :status', { status });

    query.orderBy('product.createdAt', 'DESC');

    // Get total count
    const total = await query.getCount();

    // Apply pagination
    query.skip(skip).take(limit);

    // Get data
    const data = await query.getMany();

    // Calculate pagination meta
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Recursively get all descendant category IDs
   */
  private async getAllDescendantCategoryIds(categoryId: string): Promise<string[]> {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId, isActive: true },
      relations: ['children'],
    });

    if (!category || !category.children || category.children.length === 0) {
      return [];
    }

    const descendantIds: string[] = [];

    for (const child of category.children) {
      if (child.isActive) {
        descendantIds.push(child.id);
        // Recursively get children's descendants
        const childDescendants = await this.getAllDescendantCategoryIds(child.id);
        descendantIds.push(...childDescendants);
      }
    }

    return descendantIds;
  }

  /**
   * Determine current season based on month
   * Spring: March (3), April (4), May (5)
   * Summer: June (6), July (7), August (8)
   * Fall: September (9), October (10), November (11)
   * Winter: December (12), January (1), February (2)
   */
  private getCurrentSeason(): ProductSeason {
    const currentMonth = dayjs().month() + 1; // month() returns 0-11, so add 1 to get 1-12

    if (currentMonth >= 3 && currentMonth <= 5) {
      return ProductSeason.SPRING;
    } else if (currentMonth >= 6 && currentMonth <= 8) {
      return ProductSeason.SUMMER;
    } else if (currentMonth >= 9 && currentMonth <= 11) {
      return ProductSeason.FALL;
    } else {
      return ProductSeason.WINTER;
    }
  }

  async findSeasonOutfits(filters?: {
    status?: ProductStatus;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<Product>> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 16;
    const skip = (page - 1) * limit;

    // Determine current season
    const currentSeason = this.getCurrentSeason();

    const query = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.variants', 'variants')
      .leftJoinAndSelect('product.categories', 'categories')
      .leftJoinAndSelect('product.ecoImpact', 'ecoImpact')
      .leftJoinAndSelect('product.productCondition', 'productCondition')
      .where(
        '(product.season = :currentSeason OR product.season = :allSeason OR product.season IS NULL)',
        {
          currentSeason,
          allSeason: ProductSeason.ALL_SEASON
        }
      );

    // Filter by status (default to ACTIVE for public)
    const status = filters?.status || ProductStatus.ACTIVE;
    query.andWhere('product.status = :status', { status });

    query.orderBy('product.createdAt', 'DESC');

    // Get total count
    const total = await query.getCount();

    // Apply pagination
    query.skip(skip).take(limit);

    // Get data
    const data = await query.getMany();

    // Calculate pagination meta
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Get products sorted by favorites count (likes)
   * Sort from small to large (ascending order)
   */
  async findByLikesCount(filters?: {
    status?: ProductStatus;
    page?: number;
    limit?: number;
    sortOrder?: 'ASC' | 'DESC'; // ASC: small to large, DESC: large to small
    categoryIds?: string[];
  }): Promise<PaginatedResult<Product>> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 12;
    const skip = (page - 1) * limit;
    const sortOrder = filters?.sortOrder || 'ASC';

    const query = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.variants', 'variants')
      .leftJoinAndSelect('product.categories', 'categories')
      .leftJoinAndSelect('product.ecoImpact', 'ecoImpact')
      .leftJoinAndSelect('product.productCondition', 'productCondition')
      .leftJoin('favorite_products', 'favorites', 'favorites.product_id = product.id')
      .groupBy('product.id')
      .addSelect('COUNT(favorites.id)', 'likesCount');

    // Filter by categories if provided
    if (filters?.categoryIds?.length) {
      query.andWhere('categories.id IN (:...categoryIds)', {
        categoryIds: filters.categoryIds,
      });
    }

    // Filter by status (default to ACTIVE for public)
    const status = filters?.status || ProductStatus.ACTIVE;
    query.andWhere('product.status = :status', { status });

    // Sort by likes count
    query.orderBy('likesCount', sortOrder);

    // Get total count
    const total = await query.getCount();

    // Apply pagination
    query.skip(skip).take(limit);

    // Get data
    const rawData = await query.getRawAndEntities();
    
    // Merge the likes count with product data
    const data = rawData.entities.map((product, index) => {
      const likesCount = rawData.raw[index].likesCount;
      return {
        ...product,
        likesCount: parseInt(likesCount, 10),
      };
    });

    // Calculate pagination meta
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Find new products (imported within last 15 days)
   * Where: currentDate - importDate <= 15 days
   */
  async findNewProducts(filters?: {
    status?: ProductStatus;
    page?: number;
    limit?: number;
    categoryIds?: string[];
  }): Promise<PaginatedResult<Product>> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 12;
    const skip = (page - 1) * limit;

    // Calculate the date 15 days ago
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);

    const query = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.variants', 'variants')
      .leftJoinAndSelect('product.categories', 'categories')
      .leftJoinAndSelect('product.ecoImpact', 'ecoImpact')
      .leftJoinAndSelect('product.productCondition', 'productCondition')
      .where('product.importDate IS NOT NULL')
      .andWhere('CAST(product.importDate AS DATE) >= :fifteenDaysAgo', {
        fifteenDaysAgo: fifteenDaysAgo.toISOString().split('T')[0],
      });

    // Filter by categories if provided
    if (filters?.categoryIds?.length) {
      query.andWhere('categories.id IN (:...categoryIds)', {
        categoryIds: filters.categoryIds,
      });
    }

    // Filter by status (default to ACTIVE for public)
    const status = filters?.status || ProductStatus.ACTIVE;
    query.andWhere('product.status = :status', { status });

    // Sort by importDate DESC (newest first)
    query.orderBy('product.importDate', 'DESC');

    // Get total count
    const total = await query.getCount();

    // Apply pagination
    query.skip(skip).take(limit);

    // Get data
    const data = await query.getMany();

    // Calculate pagination meta
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Find discounted products (compareAtPrice > price)
   */
  async findDiscountedProducts(filters?: {
    status?: ProductStatus;
    page?: number;
    limit?: number;
    categoryIds?: string[];
  }): Promise<PaginatedResult<Product>> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 12;
    const skip = (page - 1) * limit;

    const query = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.variants', 'variants')
      .leftJoinAndSelect('product.categories', 'categories')
      .leftJoinAndSelect('product.ecoImpact', 'ecoImpact')
      .leftJoinAndSelect('product.productCondition', 'productCondition')
      .where(
        'EXISTS (SELECT 1 FROM product_variants pv WHERE pv.product_id = product.id AND pv.compare_at_price > pv.price AND pv.compare_at_price IS NOT NULL AND pv.is_active = true)'
      );

    // Filter by categories if provided
    if (filters?.categoryIds?.length) {
      query.andWhere('categories.id IN (:...categoryIds)', {
        categoryIds: filters.categoryIds,
      });
    }

    // Filter by status (default to ACTIVE for public)
    const status = filters?.status || ProductStatus.ACTIVE;
    query.andWhere('product.status = :status', { status });

    // Sort by createdAt DESC (newest first)
    query.orderBy('product.createdAt', 'DESC');

    // Get total count
    const total = await query.getCount();

    // Apply pagination
    query.skip(skip).take(limit);

    // Get data
    const data = await query.getMany();

    // Calculate pagination meta
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Ensure slug is unique by appending a number if necessary
   * e.g., "product-name" -> "product-name-2" -> "product-name-3"
   */
  private async ensureUniqueSlug(baseSlug: string, excludeId?: string): Promise<string> {
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const query = this.productRepository.createQueryBuilder('product')
        .where('product.slug = :slug', { slug });

      if (excludeId) {
        query.andWhere('product.id != :excludeId', { excludeId });
      }

      const existing = await query.getOne();

      if (!existing) {
        return slug;
      }

      counter++;
      slug = `${baseSlug}-${counter}`;
    }
  }
}

