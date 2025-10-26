import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Category } from './entities/category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { PaginatedResult } from '../common/dto/pagination.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    // Generate slug if not provided
    if (!createCategoryDto.slug) {
      createCategoryDto.slug = this.generateSlug(createCategoryDto.name);
    }

    // Check if slug already exists
    const existingCategory = await this.categoryRepository.findOne({
      where: { slug: createCategoryDto.slug },
    });

    if (existingCategory) {
      throw new BadRequestException('Category with this slug already exists');
    }

    // Validate parent category exists if parentId is provided
    if (createCategoryDto.parentId) {
      const parentCategory = await this.categoryRepository.findOne({
        where: { id: createCategoryDto.parentId },
      });

      if (!parentCategory) {
        throw new NotFoundException('Parent category not found');
      }
    }

    const category = this.categoryRepository.create(createCategoryDto);
    return await this.categoryRepository.save(category);
  }

  async findAll(filters?: {
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<PaginatedResult<Category>> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const query = this.categoryRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.parent', 'parent')
      .leftJoinAndSelect('category.children', 'children');

    if (filters?.isActive !== undefined) {
      query.andWhere('category.isActive = :isActive', { isActive: filters.isActive });
    }

    if (filters?.search) {
      query.andWhere(
        '(LOWER(category.name) LIKE LOWER(:search) OR LOWER(category.description) LIKE LOWER(:search))',
        { search: `%${filters.search}%` },
      );
    }

    query.orderBy('category.order', 'ASC').addOrderBy('category.name', 'ASC');

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

  async findOne(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['parent', 'children'],
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id);

    // Check if slug is being updated and if it already exists
    if (updateCategoryDto.slug && updateCategoryDto.slug !== category.slug) {
      const existingCategory = await this.categoryRepository.findOne({
        where: { slug: updateCategoryDto.slug },
      });

      if (existingCategory) {
        throw new BadRequestException('Category with this slug already exists');
      }
    }

    // Validate parent category exists if parentId is being updated
    if (updateCategoryDto.parentId) {
      // Prevent setting itself as parent
      if (updateCategoryDto.parentId === id) {
        throw new BadRequestException('Category cannot be its own parent');
      }

      const parentCategory = await this.categoryRepository.findOne({
        where: { id: updateCategoryDto.parentId },
      });

      if (!parentCategory) {
        throw new NotFoundException('Parent category not found');
      }

      // Prevent circular reference
      const isCircular = await this.checkCircularReference(id, updateCategoryDto.parentId);
      if (isCircular) {
        throw new BadRequestException('Circular reference detected');
      }
    }

    Object.assign(category, updateCategoryDto);
    return await this.categoryRepository.save(category);
  }

  async remove(id: string): Promise<void> {
    const category = await this.findOne(id);

    // Check if category has children
    if (category.children && category.children.length > 0) {
      throw new BadRequestException('Cannot delete category with children');
    }

    await this.categoryRepository.remove(category);
  }

  async getMegaMenu(): Promise<Category[]> {
    // Get all root categories (categories without parent)
    const rootCategories = await this.categoryRepository.find({
      where: { parentId: IsNull(), isActive: true },
      relations: ['children'],
      order: { order: 'ASC', name: 'ASC' },
    });

    // Recursively load children
    for (const category of rootCategories) {
      await this.loadChildren(category);
    }

    return rootCategories;
  }

  private async loadChildren(category: Category): Promise<void> {
    if (category.children && category.children.length > 0) {
      // Filter active children
      category.children = category.children.filter((child) => child.isActive);

      // Sort children
      category.children.sort((a, b) => {
        if (a.order !== b.order) {
          return a.order - b.order;
        }
        return a.name.localeCompare(b.name);
      });

      // Recursively load children's children
      for (const child of category.children) {
        const childWithChildren = await this.categoryRepository.findOne({
          where: { id: child.id },
          relations: ['children'],
        });

        if (childWithChildren) {
          child.children = childWithChildren.children;
          await this.loadChildren(child);
        }
      }
    }
  }

  private async checkCircularReference(categoryId: string, parentId: string): Promise<boolean> {
    let currentParentId: string | null | undefined = parentId;

    while (currentParentId) {
      if (currentParentId === categoryId) {
        return true;
      }

      const parent = await this.categoryRepository.findOne({
        where: { id: currentParentId },
      });

      currentParentId = parent?.parentId || null;
    }

    return false;
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
}

