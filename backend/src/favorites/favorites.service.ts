import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FavoriteProduct } from './entities/favorite.entity';
import { Product } from '../products/entities/product.entity';
import { AddFavoriteDto } from './dto/add-favorite.dto';
import { PaginatedResult } from '../common/dto/pagination.dto';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(FavoriteProduct)
    private favoriteRepository: Repository<FavoriteProduct>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  /**
   * Add a product to user's favorites
   */
  async addFavorite(clientUserId: string, productId: string): Promise<FavoriteProduct> {
    // Check if product exists
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Check if already favorited
    const existingFavorite = await this.favoriteRepository.findOne({
      where: {
        clientUserId,
        productId: productId,
      },
    });

    if (existingFavorite) {
      throw new ConflictException('Product is already in favorites');
    }

    // Create favorite
    const favorite = this.favoriteRepository.create({
      clientUserId,
      productId: productId,
    });

    return await this.favoriteRepository.save(favorite);
  }

  /**
   * Remove a product from user's favorites
   */
  async removeFavorite(clientUserId: string, productId: string): Promise<void> {
    const favorite = await this.favoriteRepository.findOne({
      where: {
        clientUserId,
        productId,
      },
    });

    if (!favorite) {
      throw new NotFoundException('Favorite not found');
    }

    await this.favoriteRepository.remove(favorite);
  }

  /**
   * Get all favorite products for a user with pagination
   */
  async getFavorites(
    clientUserId: string,
    filters?: {
      page?: number;
      limit?: number;
    },
  ): Promise<PaginatedResult<Product>> {
    const page = filters?.page || 1;
    const limit = filters?.limit || 12;
    const skip = (page - 1) * limit;

    // Get favorite product IDs
    const query = this.favoriteRepository
      .createQueryBuilder('favorite')
      .where('favorite.clientUserId = :clientUserId', { clientUserId })
      .orderBy('favorite.createdAt', 'DESC');

    // Get total count
    const total = await query.getCount();

    // Get favorites with pagination
    const favorites = await query.skip(skip).take(limit).getMany();

    // Get product details
    const productIds = favorites.map((f) => f.productId);
    
    let products: Product[] = [];
    if (productIds.length > 0) {
      products = await this.productRepository
        .createQueryBuilder('product')
        .leftJoinAndSelect('product.variants', 'variants')
        .leftJoinAndSelect('product.categories', 'categories')
        .leftJoinAndSelect('product.ecoImpact', 'ecoImpact')
        .leftJoinAndSelect('product.productCondition', 'productCondition')
        .where('product.id IN (:...productIds)', { productIds })
        .getMany();

      // Sort products by the order of favorites
      const productMap = new Map(products.map((p) => [p.id, p]));
      products = productIds.map((id) => productMap.get(id)).filter(Boolean) as Product[];
    }

    // Calculate pagination meta
    const totalPages = Math.ceil(total / limit);

    return {
      data: products,
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
   * Check if a product is favorited by user
   */
  async isFavorited(clientUserId: string, productId: string): Promise<boolean> {
    const favorite = await this.favoriteRepository.findOne({
      where: {
        clientUserId,
        productId,
      },
    });

    return !!favorite;
  }

  /**
   * Get favorite product IDs for a user (useful for checking multiple products at once)
   */
  async getFavoriteProductIds(clientUserId: string): Promise<string[]> {
    const favorites = await this.favoriteRepository.find({
      where: { clientUserId },
      select: ['productId'],
    });

    return favorites.map((f) => f.productId);
  }

  /**
   * Get total count of favorites for a user
   */
  async getFavoritesCount(clientUserId: string): Promise<number> {
    return await this.favoriteRepository.count({
      where: { clientUserId },
    });
  }
}

