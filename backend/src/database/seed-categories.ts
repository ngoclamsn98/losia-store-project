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

// Helper function to generate slug from name with parent prefix
function generateSlug(name: string, parentName: string | null): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  // Add parent prefix if parentName is provided
  if (parentName) {
    const parentSlug = parentName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return `${parentSlug}-${slug}`;
  }
  
  return slug;
}

// Category data from category.txt
const CATEGORY_DATA = [
  // Parent categories
  { name: 'Women', parent: null },
  { name: 'Sports', parent: null },
  { name: 'Handbags', parent: null },
  { name: 'Accessories', parent: null },
  { name: 'Kids', parent: null },
  { name: 'Giảm giá', parent: null },
  { name: 'Hàng mới về', parent: null },
  
  // Women subcategories
  { name: 'Váy', parent: 'Women' },
  { name: 'Áo', parent: 'Women' },
  { name: 'Áo Len', parent: 'Women' },
  { name: 'Áo Khoác & Jacket', parent: 'Women' },
  { name: 'Quần Jean', parent: 'Women' },
  { name: 'Quần Dài', parent: 'Women' },
  { name: 'Túi Xách', parent: 'Women' },
  { name: 'Phụ Kiện', parent: 'Women' },
  
  // Sports subcategories
  { name: 'Vợt Pickleball', parent: 'Sports' },
  { name: 'Thể Thao Nam', parent: 'Sports' },
  { name: 'Thể Thao Nữ', parent: 'Sports' },
  
  // Handbags subcategories
  { name: 'Ba lô', parent: 'Handbags' },
  { name: 'Túi Bucket', parent: 'Handbags' },
  { name: 'Ví Câm Tay', parent: 'Handbags' },
  { name: 'Túi Đeo Chéo', parent: 'Handbags' },
  { name: 'Túi Đeo Vai', parent: 'Handbags' },
  { name: 'Ví Tiền', parent: 'Handbags' },
  
  // Accessories subcategories
  { name: 'Dây Chuyền', parent: 'Accessories' },
  { name: 'Vòng Tay', parent: 'Accessories' },
  { name: 'Nhân', parent: 'Accessories' },
  { name: 'Hoa Tai', parent: 'Accessories' },
  { name: 'Đông hộ', parent: 'Accessories' },
  { name: 'Ví Tiền', parent: 'Accessories' },
  
  // Kids subcategories (Bé Trai, Bé Gái are sub-categories of Kids)
  { name: 'Bé Trai', parent: 'Kids' },
  { name: 'Bé Gái', parent: 'Kids' },
  
  // Bé Trai subcategories
  { name: 'Áo', parent: 'Bé Trai' },
  { name: 'Áo Len', parent: 'Bé Trai' },
  { name: 'Áo Gió', parent: 'Bé Trai' },
  { name: 'Áo Khoác & Jacket', parent: 'Bé Trai' },
  { name: 'Quần Jeans', parent: 'Bé Trai' },
  { name: 'Giày', parent: 'Bé Trai' },
  
  // Bé Gái subcategories
  { name: 'Váy', parent: 'Bé Gái' },
  { name: 'Áo', parent: 'Bé Gái' },
  { name: 'Áo Len', parent: 'Bé Gái' },
  { name: 'Áo Khoác & Jacket', parent: 'Bé Gái' },
  { name: 'Quần Jeans', parent: 'Bé Gái' },
  { name: 'Giày', parent: 'Bé Gái' },
];

async function seedCategories() {
  try {
    console.log('Initializing database connection...');
    await AppDataSource.initialize();

    const categoryRepository = AppDataSource.getRepository(Category);
    
    // Clear category table with CASCADE to handle foreign key constraints
    try {
      await AppDataSource.query('TRUNCATE TABLE "categories" CASCADE');
      console.log('✓ Cleared existing categories');
    } catch (error) {
      console.log('⚠ Could not truncate categories, will proceed with existing data');
    }

    // Map to store parent categories by name
    const parentCategoryMap = new Map<string, Category>();

    console.log('Seeding category data...');

    // First pass: Create all parent categories (where parent is null)
    for (const data of CATEGORY_DATA) {
      if (data.parent === null) {
        const category = categoryRepository.create({
          name: data.name,
          slug: generateSlug(data.name, data.parent),
          isActive: true,
        });
        const saved = await categoryRepository.save(category);
        parentCategoryMap.set(data.name, saved);
        console.log(`✓ Created parent category: ${data.name}`);
      }
    }

    // Second pass: Create child categories (multiple iterations to handle nested levels)
    let remainingData = CATEGORY_DATA.filter(data => data.parent !== null);
    let iteration = 0;
    const maxIterations = 10; // Prevent infinite loops

    while (remainingData.length > 0 && iteration < maxIterations) {
      iteration++;
      const processed: typeof CATEGORY_DATA = [];

      for (const data of remainingData) {
        const parentCategory = parentCategoryMap.get(data.parent);

        if (!parentCategory) {
          // Parent not found yet, keep it for next iteration
          continue;
        }

        const category = categoryRepository.create({
          name: data.name,
          slug: generateSlug(data.name, data.parent),
          parentId: parentCategory.id,
          isActive: true,
        });
        const saved = await categoryRepository.save(category);
        parentCategoryMap.set(data.name, saved);
        processed.push(data);
        console.log(`✓ Created child category: ${data.name} (parent: ${data.parent})`);
      }

      if (processed.length === 0 && remainingData.length > 0) {
        // No progress made, some categories couldn't be processed
        console.log(`⚠ Could not find parents for:`);
        remainingData.forEach(data => {
          console.log(`  - ${data.name} (parent: ${data.parent})`);
        });
        break;
      }

      // Remove processed data from remaining
      remainingData = remainingData.filter(data => !processed.includes(data));
    }

    console.log('\n✅ Category seeding completed successfully!');
    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

seedCategories();

