import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Product, ProductStatus } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { Category } from '../categories/entities/category.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';
import { PaginatedResult } from '../common/dto/pagination.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
    @InjectRepository(ProductVariant)
    private variantRepository: Repository<ProductVariant>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
  ) {}

  async create(createProductDto: CreateProductDto, userId?: string): Promise<Product> {
    // Generate slug if not provided
    if (!createProductDto.slug) {
      createProductDto.slug = this.generateSlug(createProductDto.name);
    }

    // Check if slug already exists
    const existingProduct = await this.productRepository.findOne({
      where: { slug: createProductDto.slug },
    });

    if (existingProduct) {
      throw new BadRequestException('Product with this slug already exists');
    }

    // Ensure at least one variant is marked as default
    const hasDefault = createProductDto.variants.some((v) => v.isDefault);
    if (!hasDefault && createProductDto.variants.length > 0) {
      createProductDto.variants[0].isDefault = true;
    }

    // Create product with variants
    const { variants, categoryIds, ...productData } = createProductDto;
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
  }

  async findAll(filters?: {
    categoryIds?: string[];
    status?: ProductStatus;
    isFeatured?: boolean;
    search?: string;
    page?: number;
    limit?: number;
    userId?: string; // Filter by creator
    userRole?: string; // User role to determine if can see all
  }): Promise<PaginatedResult<Product>> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const query = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.variants', 'variants')
      .leftJoinAndSelect('product.categories', 'categories')
      .leftJoinAndSelect('product.createdBy', 'createdBy');

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

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['variants', 'categories'],
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async findBySlug(slug: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { slug },
      relations: ['variants', 'categories'],
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

    // Check if slug is being updated and if it already exists
    if (updateProductDto.slug && updateProductDto.slug !== product.slug) {
      const existingProduct = await this.productRepository.findOne({
        where: { slug: updateProductDto.slug },
      });

      if (existingProduct) {
        throw new BadRequestException('Product with this slug already exists');
      }
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

    // Handle variants update
    if (updateProductDto.variants) {
      // Remove old variants
      await this.variantRepository.delete({ productId: id });

      // Ensure at least one variant is marked as default
      const hasDefault = updateProductDto.variants.some((v) => v.isDefault);
      if (!hasDefault && updateProductDto.variants.length > 0) {
        updateProductDto.variants[0].isDefault = true;
      }

      // Create new variants
      const variantEntities = updateProductDto.variants.map((variantDto) => {
        const variant = this.variantRepository.create({
          ...variantDto,
          productId: id,
        });
        return variant;
      });

      await this.variantRepository.save(variantEntities);
    }

    // Update product
    const { variants, categoryIds, ...productData } = updateProductDto;
    Object.assign(product, productData);
    await this.productRepository.save(product);

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

