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
  @ApiQuery({ name: 'department_tags', required: false, description: 'Filter by department tags (comma-separated: women,premium)' })
  @ApiQuery({ name: 'category_tags', required: false, description: 'Filter by category tags (comma-separated: dresses,tops)' })
  @ApiQuery({ name: 'style_tags', required: false, description: 'Filter by style tags (comma-separated: belts,hats)' })
  @ApiQuery({ name: 'color_names', required: false, description: 'Filter by color names (comma-separated: red,blue)' })
  @ApiQuery({ name: 'chars_pattern', required: false, description: 'Filter by pattern (solid, striped, etc.)' })
  @ApiQuery({ name: 'condition', required: false, description: 'Filter by condition (e.g., q1_nwt for new with tags)' })
  @ApiQuery({ name: 'listed_days', required: false, type: Number, description: 'Filter products listed in last N days' })
  @ApiQuery({ name: 'price', required: false, description: 'Filter by price range (format: min,max or just max)' })
  @ApiQuery({ name: 'luxe_brand', required: false, type: Boolean, description: 'Filter luxury brands' })
  @ApiQuery({ name: 'curation_id', required: false, description: 'Filter by curation ID' })
  @ApiQuery({ name: 'sort', required: false, description: 'Sort by: price_low_high, price_high_low, newest, oldest' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10, max: 100)' })
  @ApiResponse({ status: 200, description: 'Returns paginated list of products' })
  findAll(
    @Query('categoryIds') categoryIds?: string | string[],
    @Query('status') status?: ProductStatus,
    @Query('isFeatured') isFeatured?: string,
    @Query('search') search?: string,
    @Query('variantAttributes') variantAttributes?: string,
    @Query('department_tags') departmentTags?: string,
    @Query('category_tags') categoryTags?: string,
    @Query('style_tags') styleTags?: string,
    @Query('color_names') colorNames?: string,
    @Query('chars_pattern') charsPattern?: string,
    @Query('condition') condition?: string,
    @Query('listed_days') listedDays?: string,
    @Query('price') price?: string,
    @Query('luxe_brand') luxeBrand?: string,
    @Query('curation_id') curationId?: string,
    @Query('sort') sort?: string,
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

    // Parse price range (format: "0,25" or "25")
    let priceMin: number | undefined;
    let priceMax: number | undefined;
    if (price) {
      const priceParts = price.split(',');
      if (priceParts.length === 2) {
        priceMin = parseFloat(priceParts[0]);
        priceMax = parseFloat(priceParts[1]);
      } else if (priceParts.length === 1) {
        priceMax = parseFloat(priceParts[0]);
      }
    }

    return this.productsService.findAll({
      categoryIds: categoryIdsArray,
      status,
      isFeatured: isFeatured === 'true',
      search,
      variantAttributes: parsedVariantAttributes,
      departmentTags: departmentTags ? departmentTags.split(',').map(t => t.trim()) : undefined,
      categoryTags: categoryTags ? categoryTags.split(',').map(t => t.trim()) : undefined,
      styleTags: styleTags ? styleTags.split(',').map(t => t.trim()) : undefined,
      colorNames: colorNames ? colorNames.split(',').map(t => t.trim()) : undefined,
      charsPattern,
      condition,
      listedDays: listedDays ? parseInt(listedDays, 10) : undefined,
      priceMin,
      priceMax,
      luxeBrand: luxeBrand === 'true',
      curationId,
      sort,
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
    });
  }

  @Get('season-outfits')
  @ApiOperation({ summary: 'Get season outfit products (featured products for homepage)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of products to return (default: 16)' })
  @ApiResponse({ status: 200, description: 'Returns list of featured products for season outfits' })
  getSeasonOutfits(@Query('limit') limit?: string) {
    return this.productsService.findSeasonOutfits({
      status: ProductStatus.ACTIVE,
      limit: limit ? parseInt(limit, 10) : 16,
      page: 1,
    });
  }

  @Get('discounted')
  @ApiOperation({ summary: 'Get discounted products (compareAtPrice > price) (public)' })
  @ApiQuery({ name: 'categoryIds', required: false, isArray: true, type: String, description: 'Filter by category IDs (optional, can pass multiple)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 12)' })
  @ApiResponse({ status: 200, description: 'Returns paginated list of discounted products' })
  getDiscountedProducts(
    @Query('categoryIds') categoryIds?: string | string[],
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    // Normalize categoryIds to array
    const categoryIdsArray = categoryIds
      ? (Array.isArray(categoryIds) ? categoryIds : [categoryIds])
      : undefined;

    return this.productsService.findDiscountedProducts({
      status: ProductStatus.ACTIVE,
      categoryIds: categoryIdsArray,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 12,
    });
  }

  @Get('new-arrivals')
  @ApiOperation({ summary: 'Get new products (imported within last 15 days) (public)' })
  @ApiQuery({ name: 'categoryIds', required: false, isArray: true, type: String, description: 'Filter by category IDs (optional, can pass multiple)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 12)' })
  @ApiResponse({ status: 200, description: 'Returns paginated list of newly arrived products' })
  getNewArrivals(
    @Query('categoryIds') categoryIds?: string | string[],
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    // Normalize categoryIds to array
    const categoryIdsArray = categoryIds
      ? (Array.isArray(categoryIds) ? categoryIds : [categoryIds])
      : undefined;

    return this.productsService.findNewProducts({
      status: ProductStatus.ACTIVE,
      categoryIds: categoryIdsArray,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 12,
    });
  }

  @Get('by-likes')
  @ApiOperation({ summary: 'Get products sorted by likes/favorites count (public)' })
  @ApiQuery({ name: 'categoryIds', required: false, isArray: true, type: String, description: 'Filter by category IDs (optional, can pass multiple)' })
  @ApiQuery({ name: 'sort', required: false, enum: ['ASC', 'DESC'], description: 'Sort order: ASC (small to large) or DESC (large to small) (default: ASC)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 12)' })
  @ApiResponse({ status: 200, description: 'Returns paginated list of products sorted by likes count' })
  getProductsByLikes(
    @Query('categoryIds') categoryIds?: string | string[],
    @Query('sort') sort?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    // Normalize categoryIds to array
    const categoryIdsArray = categoryIds
      ? (Array.isArray(categoryIds) ? categoryIds : [categoryIds])
      : undefined;

    const sortOrder = (sort?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC') as 'ASC' | 'DESC';
    return this.productsService.findByLikesCount({
      status: ProductStatus.ACTIVE,
      categoryIds: categoryIdsArray,
      sortOrder,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 12,
    });
  }

  @Get('search')
  @ApiOperation({ summary: 'Search products by keyword (public)' })
  @ApiQuery({ name: 'q', required: true, type: String, description: 'Search keyword' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 24)' })
  @ApiQuery({ name: 'status', required: false, enum: ProductStatus, description: 'Filter by product status (default: ACTIVE)' })
  @ApiResponse({ status: 200, description: 'Returns paginated search results' })
  searchProducts(
    @Query('q') query: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: ProductStatus,
  ) {
    return this.productsService.searchProducts(query, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      status,
    });
  }

  @Get('categories/:slug1/:slug2/:slug3')
  @ApiOperation({ summary: 'Get products by nested category slugs (level 1, 2, 3)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 12)' })
  @ApiQuery({ name: 'status', required: false, enum: ProductStatus, description: 'Filter by product status (default: ACTIVE)' })
  @ApiResponse({ status: 200, description: 'Returns paginated list of products for the category' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  findByNestedCategorySlugs(
    @Param('slug1') slug1: string,
    @Param('slug2') slug2?: string,
    @Param('slug3') slug3?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: ProductStatus,
  ) {
    return this.productsService.findByNestedCategorySlugs(slug1, slug2, slug3, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      status,
    });
  }

  @Get('categories/:slug1/:slug2')
  @ApiOperation({ summary: 'Get products by nested category slugs (level 1, 2)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 12)' })
  @ApiQuery({ name: 'status', required: false, enum: ProductStatus, description: 'Filter by product status (default: ACTIVE)' })
  @ApiResponse({ status: 200, description: 'Returns paginated list of products for the category' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  findByNestedCategorySlugs2(
    @Param('slug1') slug1: string,
    @Param('slug2') slug2: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: ProductStatus,
  ) {
    return this.productsService.findByNestedCategorySlugs(slug1, slug2, undefined, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      status,
    });
  }

  @Get('categories/:slug1')
  @ApiOperation({ summary: 'Get products by category slug (level 1)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 12)' })
  @ApiQuery({ name: 'status', required: false, enum: ProductStatus, description: 'Filter by product status (default: ACTIVE)' })
  @ApiResponse({ status: 200, description: 'Returns paginated list of products for the category' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  findByNestedCategorySlugs1(
    @Param('slug1') slug1: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: ProductStatus,
  ) {
    return this.productsService.findByNestedCategorySlugs(slug1, undefined, undefined, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      status,
    });
  }

  @Get('category/:slug')
  @ApiOperation({ summary: 'Get products by category slug (public)' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 12)' })
  @ApiQuery({ name: 'status', required: false, enum: ProductStatus, description: 'Filter by product status (default: ACTIVE)' })
  @ApiResponse({ status: 200, description: 'Returns paginated list of products for the category' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  findByCategorySlug(
    @Param('slug') slug: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: ProductStatus,
  ) {
    return this.productsService.findByCategorySlug(slug, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      status,
    });
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get product by slug (increments view count)' })
  @ApiResponse({ status: 200, description: 'Returns product details' })
  @ApiResponse({ status: 404, description: 'Product not found' })
  findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  @Get('also-shop')
  @ApiOperation({ summary: 'Get products grouped by brand for "People Also Shop" feature (public)' })
  @ApiQuery({ name: 'currentBrand', required: false, type: String, description: 'Current brand to exclude from results' })
  @ApiQuery({ name: 'limitBrands', required: false, type: Number, description: 'Number of brands to return (default: 3, max: 10)' })
  @ApiQuery({ name: 'limitPerBrand', required: false, type: Number, description: 'Number of products per brand (default: 3, max: 10)' })
  @ApiResponse({ status: 200, description: 'Returns products grouped by brand' })
  getAlsoShop(
    @Query('currentBrand') currentBrand?: string,
    @Query('limitBrands') limitBrands?: string,
    @Query('limitPerBrand') limitPerBrand?: string,
  ) {
    return this.productsService.findProductsGroupedByBrand(
      currentBrand,
      limitBrands ? parseInt(limitBrands, 10) : 3,
      limitPerBrand ? parseInt(limitPerBrand, 10) : 3,
    );
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

