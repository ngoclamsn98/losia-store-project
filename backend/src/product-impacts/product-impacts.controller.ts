import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProductImpactsService } from './product-impacts.service';
import { CreateProductImpactDto } from './dto/create-product-impact.dto';
import { UpdateProductImpactDto } from './dto/update-product-impact.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Product Impacts')
@Controller('product-impacts')
export class ProductImpactsController {
  constructor(private readonly productImpactsService: ProductImpactsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new product impact (Admin only)' })
  @ApiResponse({ status: 201, description: 'Product impact created successfully' })
  @ApiResponse({ status: 409, description: 'Product group already exists' })
  create(@Body() createProductImpactDto: CreateProductImpactDto) {
    return this.productImpactsService.create(createProductImpactDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all product impacts (public)' })
  @ApiResponse({ status: 200, description: 'Returns all product impacts' })
  async findAll() {
    const impacts = await this.productImpactsService.findAll();
    return {
      ecoImpacts: impacts.map(impact => ({
        id: impact.id,
        productGroup: impact.productGroup,
        glassesOfWater: Number(impact.glassesOfWater),
        hoursOfLighting: Number(impact.hoursOfLighting),
        kmsOfDriving: Number(impact.kmsOfDriving),
      })),
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product impact by ID' })
  @ApiResponse({ status: 200, description: 'Returns product impact details' })
  @ApiResponse({ status: 404, description: 'Product impact not found' })
  findOne(@Param('id') id: string) {
    return this.productImpactsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update product impact (Admin only)' })
  @ApiResponse({ status: 200, description: 'Product impact updated successfully' })
  @ApiResponse({ status: 404, description: 'Product impact not found' })
  update(@Param('id') id: string, @Body() updateProductImpactDto: UpdateProductImpactDto) {
    return this.productImpactsService.update(id, updateProductImpactDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete product impact (Admin only)' })
  @ApiResponse({ status: 200, description: 'Product impact deleted successfully' })
  @ApiResponse({ status: 404, description: 'Product impact not found' })
  remove(@Param('id') id: string) {
    return this.productImpactsService.remove(id);
  }

  @Post('seed')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Seed default product impacts (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'Product impacts seeded successfully' })
  async seed() {
    await this.productImpactsService.seed();
    return { message: 'Product impacts seeded successfully' };
  }
}

