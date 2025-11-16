import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { FavoritesService } from './favorites.service';
import { AddFavoriteDto } from './dto/add-favorite.dto';
import { ClientJwtAuthGuard } from '../client-users/guards/client-jwt-auth.guard';

@ApiTags('favorites')
@Controller('favorites')
@UseGuards(ClientJwtAuthGuard)
@ApiBearerAuth()
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all favorite products' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 12)' })
  @ApiResponse({ status: 200, description: 'Favorite products retrieved successfully' })
  getFavorites(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.favoritesService.getFavorites(req.user.id, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 12,
    });
  }

  @Get('check/:productId')
  @ApiOperation({ summary: 'Check if product is favorited' })
  @ApiParam({ name: 'productId', description: 'Product ID to check' })
  @ApiResponse({ status: 200, description: 'Returns whether product is favorited' })
  async isFavorited(@Request() req, @Param('productId') productId: string) {
    const isFavorited = await this.favoritesService.isFavorited(req.user.id, productId);
    return { productId, isFavorited };
  }

  @Get('product-ids')
  @ApiOperation({ summary: 'Get all favorite product IDs' })
  @ApiResponse({ status: 200, description: 'Favorite product IDs retrieved successfully' })
  async getFavoriteProductIds(@Request() req) {
    const productIds = await this.favoritesService.getFavoriteProductIds(req.user.id);
    return { productIds };
  }

  @Get('count')
  @ApiOperation({ summary: 'Get total count of favorites' })
  @ApiResponse({ status: 200, description: 'Favorites count retrieved successfully' })
  async getFavoritesCount(@Request() req) {
    const count = await this.favoritesService.getFavoritesCount(req.user.id);
    return { count };
  }

  @Post(':productId')
  @ApiOperation({ summary: 'Add product to favorites' })
  @ApiResponse({ status: 201, description: 'Product added to favorites successfully' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  @ApiResponse({ status: 409, description: 'Product is already in favorites' })
  addFavorite(@Request() req, @Param('productId') productId: string) {
    return this.favoritesService.addFavorite(req.user.id, productId);
  }

  @Delete(':productId')
  @ApiOperation({ summary: 'Remove product from favorites' })
  @ApiParam({ name: 'productId', description: 'Product ID to remove from favorites' })
  @ApiResponse({ status: 200, description: 'Product removed from favorites successfully' })
  @ApiResponse({ status: 404, description: 'Favorite not found' })
  async removeFavorite(@Request() req, @Param('productId') productId: string) {
    await this.favoritesService.removeFavorite(req.user.id, productId);
    return { message: 'Product removed from favorites successfully' };
  }

  
}

