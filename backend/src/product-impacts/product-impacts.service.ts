import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductImpact } from './entities/product-impact.entity';
import { CreateProductImpactDto } from './dto/create-product-impact.dto';
import { UpdateProductImpactDto } from './dto/update-product-impact.dto';

@Injectable()
export class ProductImpactsService {
  constructor(
    @InjectRepository(ProductImpact)
    private readonly productImpactRepository: Repository<ProductImpact>,
  ) {}

  async create(createProductImpactDto: CreateProductImpactDto): Promise<ProductImpact> {
    // Check if product group already exists
    const existing = await this.productImpactRepository.findOne({
      where: { productGroup: createProductImpactDto.productGroup },
    });

    if (existing) {
      throw new ConflictException(`Product impact for group "${createProductImpactDto.productGroup}" already exists`);
    }

    const productImpact = this.productImpactRepository.create(createProductImpactDto);
    return this.productImpactRepository.save(productImpact);
  }

  async findAll(): Promise<ProductImpact[]> {
    return this.productImpactRepository.find({
      order: { productGroup: 'ASC' },
    });
  }

  async findOne(id: string): Promise<ProductImpact> {
    const productImpact = await this.productImpactRepository.findOne({
      where: { id },
    });

    if (!productImpact) {
      throw new NotFoundException(`Product impact with ID "${id}" not found`);
    }

    return productImpact;
  }

  async findByProductGroup(productGroup: string): Promise<ProductImpact | null> {
    return this.productImpactRepository.findOne({
      where: { productGroup },
    });
  }

  async update(id: string, updateProductImpactDto: UpdateProductImpactDto): Promise<ProductImpact> {
    const productImpact = await this.findOne(id);

    // Check if updating to a product group that already exists
    if (updateProductImpactDto.productGroup && updateProductImpactDto.productGroup !== productImpact.productGroup) {
      const existing = await this.productImpactRepository.findOne({
        where: { productGroup: updateProductImpactDto.productGroup },
      });

      if (existing) {
        throw new ConflictException(`Product impact for group "${updateProductImpactDto.productGroup}" already exists`);
      }
    }

    Object.assign(productImpact, updateProductImpactDto);
    return this.productImpactRepository.save(productImpact);
  }

  async remove(id: string): Promise<void> {
    const productImpact = await this.findOne(id);
    await this.productImpactRepository.remove(productImpact);
  }

  async seed(): Promise<void> {
    const defaultImpacts = [
      {
        productGroup: 'Váy (Dress)',
        glassesOfWater: 2083.33,
        hoursOfLighting: 100.0,
        kmsOfDriving: 8.39,
      },
      {
        productGroup: 'Áo (Top)',
        glassesOfWater: 1125.0,
        hoursOfLighting: 12.5,
        kmsOfDriving: 0.92,
      },
      {
        productGroup: 'Áo len (Sweaters)',
        glassesOfWater: 1395.83,
        hoursOfLighting: 75.0,
        kmsOfDriving: 9.22,
      },
      {
        productGroup: 'Áo khoác (Coats & Jackets)',
        glassesOfWater: 1458.33,
        hoursOfLighting: 125.0,
        kmsOfDriving: 11.72,
      },
      {
        productGroup: 'Quần jeans (Jeans)',
        glassesOfWater: 1562.5,
        hoursOfLighting: 153.75,
        kmsOfDriving: 11.57,
      },
      {
        productGroup: 'Quần dài (Pants)',
        glassesOfWater: 354.17,
        hoursOfLighting: 21.88,
        kmsOfDriving: 5.04,
      },
      {
        productGroup: 'Chân váy (Skirts)',
        glassesOfWater: 1145.83,
        hoursOfLighting: 50.0,
        kmsOfDriving: 4.6,
      },
      {
        productGroup: 'Quần short (Shorts)',
        glassesOfWater: 937.5,
        hoursOfLighting: 37.5,
        kmsOfDriving: 4.18,
      },
    ];

    for (const impact of defaultImpacts) {
      const existing = await this.findByProductGroup(impact.productGroup);
      if (!existing) {
        await this.create(impact);
      }
    }
  }
}

