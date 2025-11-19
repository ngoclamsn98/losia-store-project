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
    label: 'Excellent',
    value: 'excellent',
    description:
      'Practically new: shows no obvious signs of being worn or washed.',
  },
  {
    label: 'Very Good',
    value: 'very-good',
    description: 'No major flaws. Inspection shows: minor wear on fabric.',
  },
  {
    label: 'Good',
    value: 'good',
    description: 'Worn but still in good condition. Inspection shows: minor stain.',
  },
  {
    label: 'Flawed Gem',
    value: 'flawed gem',
    description:
      'Still has life left in it, but has visible flaws that may require repair. May be from a best-selling brand that is eligible for resale due to high demand. Inspection shows: exterior staining.',
  },
  {
    label: 'Rated Gem',
    value: 'rare-gem',
    description: 'Rare gem: from a best-selling brand that is eligible for resale due to high demand. Inspection shows: minor wear on fabric.',
  },
  {
    label: 'New With Tags',
    value: 'new-with-tags',
    description: 'New with tags: shows no obvious signs of being worn or washed.',
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
        console.log(`- Condition already exists: ${data.label}`);
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

