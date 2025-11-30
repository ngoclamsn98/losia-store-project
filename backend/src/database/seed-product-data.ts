import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { EcoImpact } from '../eco-impacts/entities/eco-impact.entity';
import { ProductCondition } from '../product-conditions/entities/product-condition.entity';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  entities: [EcoImpact, ProductCondition],
  synchronize: false,
});

const ECO_IMPACT_DATA = [
  {
    productGroup: 'Dress',
    glassesOfWater: 2083.33,
    hoursOfLighting: 100.0,
    kmsOfDriving: 8.39,
  },
  {
    productGroup: 'Top',
    glassesOfWater: 1125.0,
    hoursOfLighting: 12.5,
    kmsOfDriving: 0.92,
  },
  {
    productGroup: 'Sweaters',
    glassesOfWater: 1395.83,
    hoursOfLighting: 75.0,
    kmsOfDriving: 9.22,
  },
  {
    productGroup: 'Coats & Jackets',
    glassesOfWater: 1458.33,
    hoursOfLighting: 125.0,
    kmsOfDriving: 11.72,
  },
  {
    productGroup: 'Jeans',
    glassesOfWater: 1562.5,
    hoursOfLighting: 153.75,
    kmsOfDriving: 11.57,
  },
  {
    productGroup: 'Pants',
    glassesOfWater: 354.17,
    hoursOfLighting: 21.88,
    kmsOfDriving: 5.04,
  },
  {
    productGroup: 'Skirts',
    glassesOfWater: 1145.83,
    hoursOfLighting: 50.0,
    kmsOfDriving: 4.6,
  },
  {
    productGroup: 'Shorts',
    glassesOfWater: 937.5,
    hoursOfLighting: 37.5,
    kmsOfDriving: 4.18,
  },
];

const CONDITION_OPTIONS = [
  {
    label: 'Còn gần như mới',
    value: 'excellent',
    description:
      'Còn gần như mới: không có dấu hiệu rõ ràng của việc đã được sử dụng hoặc giặt.',
  },
  {
    label: 'Còn khá tốt',
    value: 'very-good',
    description: 'Không có vết sứt lớn. Kiểm tra: vết mòn nhỏ trên vải.',
  },
  {
    label: 'Còn tốt',
    value: 'good',
    description: 'Đã bị mòn nhưng vẫn còn trong trạng thái tốt. Kiểm tra: vết sặc nhỏ.',
  },
  {
    label: 'Còn có vết sứt',
    value: 'flawed gem',
    description:
      'Còn có vết sứt: vẫn còn trong trạng thái tốt, nhưng có vết sứt nhỏ. Kiểm tra: vết sặc nhỏ.',
  },
  {
    label: 'Còn có vết sặc',
    value: 'rare-gem',
    description: 'Còn có vết sặc: vẫn còn trong trạng thái tốt, nhưng có vết sặc nhỏ.',
  },
  {
    label: 'Mới với nhãn',
    value: 'new-with-tags',
    description: 'Mới với nhãn: không có dấu hiệu rõ ràng của việc đã được sử dụng hoặc giặt.',
  },
];

async function seedProductData() {
  try {
    console.log('Initializing database connection...');
    await AppDataSource.initialize();

    const ecoImpactRepository = AppDataSource.getRepository(EcoImpact);
    const productConditionRepository = AppDataSource.getRepository(ProductCondition);

    // Seed Eco Impact Data
    console.log('Seeding eco impact data...');
    for (const data of ECO_IMPACT_DATA) {
      const existing = await ecoImpactRepository.findOne({
        where: { productGroup: data.productGroup },
      });

      if (!existing) {
        const ecoImpact = ecoImpactRepository.create(data);
        await ecoImpactRepository.save(ecoImpact);
        console.log(`✓ Created eco impact for: ${data.productGroup}`);
      } else {
        console.log(`- Eco impact already exists for: ${data.productGroup}`);
      }
    }

    // Seed Product Condition Data
    console.log('\nSeeding product condition data...');
    for (const data of CONDITION_OPTIONS) {
      const existing = await productConditionRepository.findOne({
        where: { value: data.value },
      });

      if (!existing) {
        const condition = productConditionRepository.create(data);
        await productConditionRepository.save(condition);
        console.log(`✓ Created condition: ${data.label}`);
      } else {
        // Update existing condition with new label and description
        existing.label = data.label;
        existing.description = data.description;
        await productConditionRepository.save(existing);
        console.log(`✓ Updated condition: ${data.label}`);
      }
    }

    console.log('\n✅ Seeding completed successfully!');
    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

seedProductData();

