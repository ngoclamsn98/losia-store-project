import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { Category } from '../categories/entities/category.entity';
import { Product } from '../products/entities/product.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { User } from '../users/entities/user.entity';
import { File } from '../files/entities/file.entity';
import { Cart } from '../cart/entities/cart.entity';
import { Order } from '../orders/entities/order.entity';
import { ProductImpact } from '../product-impacts/entities/product-impact.entity';
import { ClientUser } from '../client-users/entities/client-user.entity';
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
  entities: [
    User,
    Category,
    Product,
    ProductVariant,
    File,
    Cart,
    Order,
    ProductImpact,
    ClientUser,
    EcoImpact,
    ProductCondition,
  ],
  synchronize: false,
});

// Helper function to generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Category data from category.txt
const CATEGORY_DATA = [
  // Danh mục cha: Dress
  { name: 'Dress', parent: null },
  { name: 'Casual Dress', parent: 'Dress' },
  { name: 'Cocktail Dress', parent: 'Dress' },

  // Danh mục cha: Top
  { name: 'Top', parent: null },
  { name: 'Short Sleeve T-Shirt', parent: 'Top' },
  { name: 'Short Sleeve Top', parent: 'Top' },
  { name: 'Tank Top', parent: 'Top' },
  { name: 'Zip Up Hoodie', parent: 'Top' },
  { name: 'Sleeveless Blouse', parent: 'Top' },
  { name: 'Sleeve Blouse', parent: 'Top' },
  { name: 'Sleeveless Top', parent: 'Top' },
  { name: 'Cardigan', parent: 'Top' },
  { name: 'Pullover Sweater', parent: 'Top' },
  { name: 'Long Sleeve T-Shirt', parent: 'Top' },
  { name: 'Sweatshirt', parent: 'Top' },
  { name: 'Long Sleeve Blouse', parent: 'Top' },
  { name: 'Long Sleeve Top', parent: 'Top' },
  { name: 'Turtleneck Sweater', parent: 'Top' },
  { name: 'Wool Pullover Sweater', parent: 'Top' },

  // Danh mục cha: Sweaters
  { name: 'Sweaters', parent: null },
  { name: 'Pullover Sweater', parent: 'Sweaters' },
  { name: 'Cardigan', parent: 'Sweaters' },
  { name: 'Turtleneck Sweater', parent: 'Sweaters' },

  // Danh mục cha: Coats & Jackets
  { name: 'Coats & Jackets', parent: null },
  { name: 'Blazer', parent: 'Coats & Jackets' },
  { name: 'Vintage Blazer', parent: 'Coats & Jackets' },
  { name: 'Wool Blazer', parent: 'Coats & Jackets' },
  { name: 'Vest', parent: 'Coats & Jackets' },
  { name: 'Trenchcoat', parent: 'Coats & Jackets' },
  { name: 'Coat', parent: 'Coats & Jackets' },
  { name: 'Jacket', parent: 'Coats & Jackets' },
  { name: 'Denim Jacket', parent: 'Coats & Jackets' },
  { name: 'Leather Jacket', parent: 'Coats & Jackets' },
  { name: 'Wool Coat', parent: 'Coats & Jackets' },

  // Danh mục cha: Jeans
  { name: 'Jeans', parent: null },

  // Danh mục cha: Pants
  { name: 'Pants', parent: null },
  { name: 'Wool Pants', parent: 'Pants' },
  { name: 'Track Pants', parent: 'Pants' },
  { name: 'Linen Pants', parent: 'Pants' },
  { name: 'Casual Pants', parent: 'Pants' },
  { name: 'Dress Pants', parent: 'Pants' },
  { name: 'Active Pants', parent: 'Pants' },

  // Danh mục cha: Skirts
  { name: 'Skirts', parent: null },
  { name: 'Formal Skirt', parent: 'Skirts' },
  { name: 'Wool Skirt', parent: 'Skirts' },
  { name: 'Casual Skirt', parent: 'Skirts' },

  // Danh mục cha: Shorts
  { name: 'Shorts', parent: null },
  { name: 'Denim Shorts', parent: 'Shorts' },
  { name: 'Khaki Shorts', parent: 'Shorts' },
  { name: 'Vintage Shorts', parent: 'Shorts' },
  { name: 'Romper', parent: 'Shorts' },

  // Danh mục cha: Handbags
  { name: 'Handbags', parent: null },
  { name: 'Leather Shoulder Bag', parent: 'Handbags' },
  { name: 'Shoulder Bag', parent: 'Handbags' },
  { name: 'Vintage Leather Wallet', parent: 'Handbags' },
  { name: 'Toe', parent: 'Handbags' },
  { name: 'Leather Satchel', parent: 'Handbags' },
  { name: 'Leather Tote', parent: 'Handbags' },
  { name: 'Leather Wristlet', parent: 'Handbags' },
  { name: 'Crossbody Bag', parent: 'Handbags' },

  // Danh mục cha: Shoes
  { name: 'Shoes', parent: null },
  { name: 'Sneakers', parent: 'Shoes' },
  { name: 'Heels', parent: 'Shoes' },
  { name: 'Wedges', parent: 'Shoes' },
  { name: 'Sandals', parent: 'Shoes' },
  { name: 'Boots', parent: 'Shoes' },
];

async function seedCategories() {
  try {
    console.log('Initializing database connection...');
    await AppDataSource.initialize();

    const categoryRepository = AppDataSource.getRepository(Category);

    // Map to store parent categories by name
    const parentCategoryMap = new Map<string, Category>();

    console.log('Seeding category data...');

    // First pass: Create all parent categories (where parent is null)
    for (const data of CATEGORY_DATA) {
      if (data.parent === null) {
        const existing = await categoryRepository.findOne({
          where: { name: data.name },
        });

        if (!existing) {
          const category = categoryRepository.create({
            name: data.name,
            slug: generateSlug(data.name),
            isActive: true,
          });
          const saved = await categoryRepository.save(category);
          parentCategoryMap.set(data.name, saved);
          console.log(`✓ Created parent category: ${data.name}`);
        } else {
          parentCategoryMap.set(data.name, existing);
          console.log(`- Parent category already exists: ${data.name}`);
        }
      }
    }

    // Second pass: Create child categories
    for (const data of CATEGORY_DATA) {
      if (data.parent !== null) {
        const existing = await categoryRepository.findOne({
          where: { name: data.name, parentId: parentCategoryMap.get(data.parent)?.id },
        });

        if (!existing) {
          const parentCategory = parentCategoryMap.get(data.parent);
          
          if (!parentCategory) {
            console.log(`⚠ Parent category not found for: ${data.name} (parent: ${data.parent})`);
            continue;
          }

          const category = categoryRepository.create({
            name: data.name,
            slug: generateSlug(data.name),
            parentId: parentCategory.id,
            isActive: true,
          });
          await categoryRepository.save(category);
          console.log(`✓ Created child category: ${data.name} (parent: ${data.parent})`);
        } else {
          console.log(`- Child category already exists: ${data.name} (parent: ${data.parent})`);
        }
      }
    }

    console.log('\n✅ Category seeding completed successfully!');
    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

seedCategories();

