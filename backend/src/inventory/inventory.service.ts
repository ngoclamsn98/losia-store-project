import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { Product } from '../products/entities/product.entity';
import { UpdateStockDto } from './dto/update-stock.dto';
import { AdjustStockDto, StockAdjustmentType } from './dto/adjust-stock.dto';

@Injectable()
export class InventoryService {
  constructor(
    @InjectRepository(ProductVariant)
    private readonly variantRepository: Repository<ProductVariant>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  // Get all inventory with filters and pagination
  async findAll(filters?: {
    search?: string;
    productId?: string;
    lowStock?: boolean;
    outOfStock?: boolean;
    page?: number;
    limit?: number;
  }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    const query = this.variantRepository
      .createQueryBuilder('variant')
      .leftJoinAndSelect('variant.product', 'product')
      .select([
        'variant.id',
        'variant.productId',
        'variant.sku',
        'variant.name',
        'variant.attributes',
        'variant.price',
        'variant.stock',
        'variant.lowStockThreshold',
        'variant.imageUrl',
        'variant.isActive',
        'variant.updatedAt',
        'product.id',
        'product.name',
        'product.slug',
        'product.thumbnailUrl',
        'product.status',
      ]);

    // Search filter
    if (filters?.search) {
      query.andWhere(
        '(variant.sku ILIKE :search OR variant.name ILIKE :search OR product.name ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    // Product filter
    if (filters?.productId) {
      query.andWhere('variant.productId = :productId', {
        productId: filters.productId,
      });
    }

    // Low stock filter
    if (filters?.lowStock) {
      query.andWhere('variant.stock > 0 AND variant.stock <= variant.lowStockThreshold');
    }

    // Out of stock filter
    if (filters?.outOfStock) {
      query.andWhere('variant.stock = 0');
    }

    // Get total count
    const total = await query.getCount();

    // Get paginated results
    const variants = await query
      .orderBy('variant.updatedAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getMany();

    // Calculate stock statistics
    const stats = await this.getStockStatistics();

    return {
      data: variants,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPreviousPage: page > 1,
      },
      stats,
    };
  }

  // Get stock statistics
  async getStockStatistics() {
    const totalVariants = await this.variantRepository.count();
    
    const lowStockCount = await this.variantRepository
      .createQueryBuilder('variant')
      .where('variant.stock > 0 AND variant.stock <= variant.lowStockThreshold')
      .getCount();

    const outOfStockCount = await this.variantRepository
      .createQueryBuilder('variant')
      .where('variant.stock = 0')
      .getCount();

    const totalStockValue = await this.variantRepository
      .createQueryBuilder('variant')
      .select('SUM(variant.stock * variant.price)', 'total')
      .getRawOne();

    return {
      totalVariants,
      lowStockCount,
      outOfStockCount,
      inStockCount: totalVariants - outOfStockCount,
      totalStockValue: Number(totalStockValue?.total || 0),
    };
  }

  // Get inventory by variant ID
  async findOne(id: string) {
    const variant = await this.variantRepository.findOne({
      where: { id },
      relations: ['product'],
    });

    if (!variant) {
      throw new NotFoundException(`Product variant with ID ${id} not found`);
    }

    return variant;
  }

  // Update stock directly
  async updateStock(id: string, updateStockDto: UpdateStockDto) {
    const variant = await this.findOne(id);

    variant.stock = updateStockDto.stock;
    
    if (updateStockDto.lowStockThreshold !== undefined) {
      variant.lowStockThreshold = updateStockDto.lowStockThreshold;
    }

    await this.variantRepository.save(variant);

    return variant;
  }

  // Adjust stock (add, subtract, or set)
  async adjustStock(id: string, adjustStockDto: AdjustStockDto) {
    const variant = await this.findOne(id);

    let newStock = variant.stock;

    switch (adjustStockDto.type) {
      case StockAdjustmentType.ADD:
        newStock += adjustStockDto.quantity;
        break;
      case StockAdjustmentType.SUBTRACT:
        newStock -= adjustStockDto.quantity;
        if (newStock < 0) {
          throw new BadRequestException('Stock cannot be negative');
        }
        break;
      case StockAdjustmentType.SET:
        newStock = adjustStockDto.quantity;
        if (newStock < 0) {
          throw new BadRequestException('Stock cannot be negative');
        }
        break;
    }

    variant.stock = newStock;
    await this.variantRepository.save(variant);

    return variant;
  }

  // Bulk update stock
  async bulkUpdateStock(updates: Array<{ variantId: string; stock: number }>) {
    const results: Array<{
      success: boolean;
      variantId: string;
      variant?: ProductVariant;
      error?: string;
    }> = [];

    for (const update of updates) {
      try {
        const variant = await this.updateStock(update.variantId, {
          stock: update.stock,
        });
        results.push({ success: true, variantId: update.variantId, variant });
      } catch (error) {
        results.push({
          success: false,
          variantId: update.variantId,
          error: error.message,
        });
      }
    }

    return results;
  }
}

