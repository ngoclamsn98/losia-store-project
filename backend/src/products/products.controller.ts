import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MinLevel } from '../common/decorators/min-level.decorator';
import { USER_LEVELS } from '../common/constants/user-levels.constant';
import { ProductStatus } from './entities/product.entity';
import { CurrentUser, CurrentUserData } from '../auth/decorators/current-user.decorator';

@ApiTags('products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @MinLevel(USER_LEVELS.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create a new product with variants (Admin only)' })
  @ApiResponse({ status: 201, description: 'Product successfully created' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error or slug already exists' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient level' })
  create(
    @Body() createProductDto: CreateProductDto,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.productsService.create(createProductDto, user.id);
  }

  @Get('by-categories')
  @UseGuards(JwtAuthGuard)
  @MinLevel(USER_LEVELS.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all products for admin (filtered by creator for non-superadmin)' })
  @ApiQuery({ name: 'categoryIds', required: false, isArray: true, type: String, description: 'Filter by category IDs (can pass multiple)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10, max: 100)' })
  @ApiResponse({ status: 200, description: 'Returns paginated list of products' })
  findByCategories(
    @Query('categoryIds') categoryIds?: string | string[],
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @CurrentUser() user?: CurrentUserData,
  ) {
    // Normalize categoryIds to array
    const categoryIdsArray = categoryIds
      ? (Array.isArray(categoryIds) ? categoryIds : [categoryIds])
      : [];
    return this.productsService.findByCategories(categoryIdsArray, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard)
  @MinLevel(USER_LEVELS.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all products for admin (filtered by creator for non-superadmin)' })
  @ApiQuery({ name: 'categoryIds', required: false, isArray: true, type: String, description: 'Filter by category IDs (can pass multiple)' })
  @ApiQuery({ name: 'status', required: false, enum: ProductStatus, description: 'Filter by product status' })
  @ApiQuery({ name: 'isFeatured', required: false, type: Boolean, description: 'Filter featured products' })
  @ApiQuery({ name: 'search', required: false, description: 'Search in product name and description' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10, max: 100)' })
  @ApiResponse({ status: 200, description: 'Returns paginated list of products' })
  findAllAdmin(
    @Query('categoryIds') categoryIds?: string | string[],
    @Query('status') status?: ProductStatus,
    @Query('isFeatured') isFeatured?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @CurrentUser() user?: CurrentUserData,
  ) {
    // Normalize categoryIds to array
    const categoryIdsArray = categoryIds
      ? (Array.isArray(categoryIds) ? categoryIds : [categoryIds])
      : undefined;

    return this.productsService.findAll({
      categoryIds: categoryIdsArray,
      status,
      isFeatured: isFeatured === 'true',
      search,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      userId: user?.id,
      userRole: user?.role,
    });
  }

  @Get('filters/variants')
  @ApiOperation({ summary: 'Get available variant filters (public)' })
  @ApiQuery({ name: 'categoryIds', required: false, isArray: true, type: String, description: 'Filter by category IDs' })
  @ApiQuery({ name: 'status', required: false, enum: ProductStatus, description: 'Filter by product status' })
  @ApiResponse({ status: 200, description: 'Returns grouped variant attributes for filtering' })
  getVariantFilters(
    @Query('categoryIds') categoryIds?: string | string[],
    @Query('status') status?: ProductStatus,
  ) {
    const categoryIdsArray = categoryIds
      ? (Array.isArray(categoryIds) ? categoryIds : [categoryIds])
      : undefined;

    return this.productsService.getVariantFilters({
      categoryIds: categoryIdsArray,
      status,
    });
  }

  @Get()
  @ApiOperation({ summary: 'Get all products (public - no auth required)' })
  @ApiQuery({ name: 'categoryIds', required: false, isArray: true, type: String, description: 'Filter by category IDs (can pass multiple)' })
  @ApiQuery({ name: 'status', required: false, enum: ProductStatus, description: 'Filter by product status' })
  @ApiQuery({ name: 'isFeatured', required: false, type: Boolean, description: 'Filter featured products' })
  @ApiQuery({ name: 'search', required: false, description: 'Search in product name and description' })
  @ApiQuery({ name: 'variantAttributes', required: false, description: 'Filter by variant attributes (format: color:Red,size:M)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10, max: 100)' })
  @ApiResponse({ status: 200, description: 'Returns paginated list of products' })
  findAll(
    @Query('categoryIds') categoryIds?: string | string[],
    @Query('status') status?: ProductStatus,
    @Query('isFeatured') isFeatured?: string,
    @Query('search') search?: string,
    @Query('variantAttributes') variantAttributes?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    // Normalize categoryIds to array
    const categoryIdsArray = categoryIds
      ? (Array.isArray(categoryIds) ? categoryIds : [categoryIds])
      : undefined;

    // Parse variant attributes filter
    // Format: "color:Red,size:M" or "color:Red|Blue,size:M"
    let parsedVariantAttributes: Record<string, string[]> | undefined;
    if (variantAttributes) {
      parsedVariantAttributes = {};
      const pairs = variantAttributes.split(',');
      for (const pair of pairs) {
        const [key, values] = pair.split(':');
        if (key && values) {
          parsedVariantAttributes[key.trim()] = values.split('|').map(v => v.trim());
        }
      }
    }

    return this.productsService.findAll({
      categoryIds: categoryIdsArray,
      status,
      isFeatured: isFeatured === 'true',
      search,
      variantAttributes: parsedVariantAttributes,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('season-outfits')
  @ApiOperation({ summary: 'Get season outfit products (featured products for homepage)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of products to return (default: 16)' })
  @ApiResponse({ status: 200, description: 'Returns list of featured products for season outfits' })
  getSeasonOutfits(@Query('limit') limit?: string) {
    return this.productsService.findAll({
      status: ProductStatus.ACTIVE,
      limit: limit ? parseInt(limit, 10) : 16,
      page: 1,
    });
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get product by slug (increments view count)' })
  @ApiResponse({ status: 200, description: 'Returns product details' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  @Get(':id/related')
  @ApiOperation({ summary: 'Get related products from same seller (public)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of products to return (default: 8, max: 20)' })
  @ApiResponse({ status: 200, description: 'Returns related products from same seller' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  findRelatedProducts(
    @Param('id') id: string,
    @Query('limit') limit?: string,
  ) {
    return this.productsService.findRelatedProducts(id, limit ? parseInt(limit, 10) : 8);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiResponse({ status: 200, description: 'Returns product details with variants' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @MinLevel(USER_LEVELS.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update product (Admin only)' })
  @ApiResponse({ status: 200, description: 'Product successfully updated' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error or slug already exists' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient level' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @MinLevel(USER_LEVELS.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete product (Admin only)' })
  @ApiResponse({ status: 200, description: 'Product successfully deleted' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient level' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }

  @Patch(':productId/variants/:variantId')
  @UseGuards(JwtAuthGuard)
  @MinLevel(USER_LEVELS.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Update product variant (Admin only)' })
  @ApiResponse({ status: 200, description: 'Variant successfully updated' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient level' })
  @ApiResponse({ status: 404, description: 'Variant not found' })
  updateVariant(
    @Param('productId') productId: string,
    @Param('variantId') variantId: string,
    @Body() updateVariantDto: UpdateProductVariantDto,
  ) {
    return this.productsService.updateVariant(productId, variantId, updateVariantDto);
  }

  @Delete(':productId/variants/:variantId')
  @UseGuards(JwtAuthGuard)
  @MinLevel(USER_LEVELS.ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Delete product variant (Admin only)' })
  @ApiResponse({ status: 200, description: 'Variant successfully deleted' })
  @ApiResponse({ status: 400, description: 'Cannot delete last variant' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient level' })
  @ApiResponse({ status: 404, description: 'Variant not found' })
  removeVariant(
    @Param('productId') productId: string,
    @Param('variantId') variantId: string,
  ) {
    return this.productsService.removeVariant(productId, variantId);
  }
}

