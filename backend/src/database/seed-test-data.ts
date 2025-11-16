import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';
import { ClientUser } from '../client-users/entities/client-user.entity';
import { Product, ProductStatus } from '../products/entities/product.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { FavoriteProduct } from '../favorites/entities/favorite.entity';
import { Category } from '../categories/entities/category.entity';
import { User } from '../users/entities/user.entity';
import { File } from '../files/entities/file.entity';
import { Cart } from '../cart/entities/cart.entity';
import { Order } from '../orders/entities/order.entity';
import { ProductImpact } from '../product-impacts/entities/product-impact.entity';
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
    FavoriteProduct,
  ],
  synchronize: false,
});

// Test client users data
const CLIENT_USERS_DATA = [
  {
    email: 'test1@example.com',
    password: 'Test123!@#',
    name: 'Nguyễn Văn A',
    phone: '0901234567',
  },
  {
    email: 'test2@example.com',
    password: 'Test123!@#',
    name: 'Trần Thị B',
    phone: '0902234567',
  },
  {
    email: 'test3@example.com',
    password: 'Test123!@#',
    name: 'Lê Văn C',
    phone: '0903234567',
  },
];

// Test products data with different brands for PeopleAlsoShop
const PRODUCTS_DATA = [
  // Brand: Zara
  {
    brandName: 'Zara',
    name: 'Zara Áo Sơ Mi Trắng',
    slug: 'zara-ao-so-mi-trang',
    description: 'Áo sơ mi trắng basic từ Zara',
    price: 450000,
    compareAtPrice: 600000,
    stock: 50,
    imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500',
  },
  {
    brandName: 'Zara',
    name: 'Zara Quần Jean Xanh',
    slug: 'zara-quan-jean-xanh',
    description: 'Quần jean xanh classic từ Zara',
    price: 650000,
    compareAtPrice: 850000,
    stock: 40,
    imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500',
  },
  {
    brandName: 'Zara',
    name: 'Zara Váy Đen Dự Tiệc',
    slug: 'zara-vay-den-du-tiec',
    description: 'Váy đen sang trọng từ Zara',
    price: 850000,
    compareAtPrice: 1200000,
    stock: 30,
    imageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500',
  },
  // Brand: H&M
  {
    brandName: 'H&M',
    name: 'H&M Áo Thun Cotton',
    slug: 'hm-ao-thun-cotton',
    description: 'Áo thun cotton basic từ H&M',
    price: 250000,
    compareAtPrice: 350000,
    stock: 100,
    imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=500',
  },
  {
    brandName: 'H&M',
    name: 'H&M Quần Short Kaki',
    slug: 'hm-quan-short-kaki',
    description: 'Quần short kaki từ H&M',
    price: 350000,
    compareAtPrice: 500000,
    stock: 60,
    imageUrl: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=500',
  },
  {
    brandName: 'H&M',
    name: 'H&M Áo Khoác Denim',
    slug: 'hm-ao-khoac-denim',
    description: 'Áo khoác denim từ H&M',
    price: 550000,
    compareAtPrice: 750000,
    stock: 45,
    imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500',
  },
  // Brand: Uniqlo
  {
    brandName: 'Uniqlo',
    name: 'Uniqlo Áo Len Cổ Lọ',
    slug: 'uniqlo-ao-len-co-lo',
    description: 'Áo len cổ lọ từ Uniqlo',
    price: 550000,
    compareAtPrice: 700000,
    stock: 70,
    imageUrl: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=500',
  },
  {
    brandName: 'Uniqlo',
    name: 'Uniqlo Quần Jogger',
    slug: 'uniqlo-quan-jogger',
    description: 'Quần jogger thoải mái từ Uniqlo',
    price: 450000,
    compareAtPrice: 600000,
    stock: 55,
    imageUrl: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=500',
  },
  {
    brandName: 'Uniqlo',
    name: 'Uniqlo Áo Polo',
    slug: 'uniqlo-ao-polo',
    description: 'Áo polo từ Uniqlo',
    price: 350000,
    compareAtPrice: 450000,
    stock: 80,
    imageUrl: 'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=500',
  },
  // Brand: Nike
  {
    brandName: 'Nike',
    name: 'Nike Áo Thể Thao',
    slug: 'nike-ao-the-thao',
    description: 'Áo thể thao từ Nike',
    price: 750000,
    compareAtPrice: 950000,
    stock: 60,
    imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500',
  },
  {
    brandName: 'Nike',
    name: 'Nike Quần Short Thể Thao',
    slug: 'nike-quan-short-the-thao',
    description: 'Quần short thể thao từ Nike',
    price: 550000,
    compareAtPrice: 700000,
    stock: 50,
    imageUrl: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=500',
  },
  {
    brandName: 'Nike',
    name: 'Nike Giày Chạy Bộ',
    slug: 'nike-giay-chay-bo',
    description: 'Giày chạy bộ từ Nike',
    price: 1500000,
    compareAtPrice: 2000000,
    stock: 35,
    imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
  },
  // Brand: Adidas
  {
    brandName: 'Adidas',
    name: 'Adidas Áo Hoodie',
    slug: 'adidas-ao-hoodie',
    description: 'Áo hoodie từ Adidas',
    price: 850000,
    compareAtPrice: 1100000,
    stock: 45,
    imageUrl: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500',
  },
  {
    brandName: 'Adidas',
    name: 'Adidas Quần Dài Thể Thao',
    slug: 'adidas-quan-dai-the-thao',
    description: 'Quần dài thể thao từ Adidas',
    price: 650000,
    compareAtPrice: 850000,
    stock: 55,
    imageUrl: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=500',
  },
  {
    brandName: 'Adidas',
    name: 'Adidas Giày Sneaker',
    slug: 'adidas-giay-sneaker',
    description: 'Giày sneaker từ Adidas',
    price: 1400000,
    compareAtPrice: 1800000,
    stock: 40,
    imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500',
  },
];


async function seedTestData() {
  try {
    console.log('Initializing database connection...');
    await AppDataSource.initialize();

    const clientUserRepository = AppDataSource.getRepository(ClientUser);
    const productRepository = AppDataSource.getRepository(Product);
    const productVariantRepository = AppDataSource.getRepository(ProductVariant);
    const favoriteRepository = AppDataSource.getRepository(FavoriteProduct);
    const categoryRepository = AppDataSource.getRepository(Category);

    // Step 1: Create test client users
    console.log('\n=== Creating test client users ===');
    const createdUsers: ClientUser[] = [];

    for (const userData of CLIENT_USERS_DATA) {
      const existingUser = await clientUserRepository.findOne({
        where: { email: userData.email },
      });

      if (existingUser) {
        console.log(`- User already exists: ${userData.email}`);
        createdUsers.push(existingUser);
      } else {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        const user = clientUserRepository.create({
          email: userData.email,
          passwordHash: hashedPassword,
          name: userData.name,
          phone: userData.phone,
          isActive: true,
          emailVerified: true,
        });
        const savedUser = await clientUserRepository.save(user);
        createdUsers.push(savedUser);
        console.log(`✓ Created user: ${userData.email}`);
      }
    }

    // Step 2: Get a category for products (use first available category)
    const category = await categoryRepository.findOne({
      where: { isActive: true },
    });

    if (!category) {
      console.log('⚠ No category found. Please run seed-categories.ts first.');
      await AppDataSource.destroy();
      return;
    }

    // Step 3: Create test products with different brands
    console.log('\n=== Creating test products ===');
    const createdProducts: Product[] = [];

    for (const productData of PRODUCTS_DATA) {
      const existingProduct = await productRepository.findOne({
        where: { slug: productData.slug },
      });

      if (existingProduct) {
        console.log(`- Product already exists: ${productData.name}`);
        createdProducts.push(existingProduct);
      } else {
        const product = productRepository.create({
          brandName: productData.brandName,
          name: productData.name,
          slug: productData.slug,
          description: productData.description,
          status: ProductStatus.ACTIVE,
          thumbnailUrl: productData.imageUrl,
          imageUrls: [productData.imageUrl],
          isFeatured: false,
        });

        const savedProduct = await productRepository.save(product);

        // Add category relationship
        savedProduct.categories = [category];
        await productRepository.save(savedProduct);

        // Create default variant
        const variant = productVariantRepository.create({
          productId: savedProduct.id,
          name: 'Default',
          price: productData.price,
          compareAtPrice: productData.compareAtPrice,
          stock: productData.stock,
          imageUrl: productData.imageUrl,
          isDefault: true,
          isActive: true,
          attributes: { size: 'M' },
        });

        await productVariantRepository.save(variant);
        createdProducts.push(savedProduct);
        console.log(`✓ Created product: ${productData.name} (${productData.brandName})`);
      }
    }

    // Step 4: Create favorite products for test users
    console.log('\n=== Creating favorite products ===');

    // User 1 favorites: 5 products from different brands
    const user1Favorites = [0, 3, 6, 9, 12]; // Mix of brands
    for (const index of user1Favorites) {
      if (createdProducts[index]) {
        const existing = await favoriteRepository.findOne({
          where: {
            clientUserId: createdUsers[0].id,
            productId: createdProducts[index].id,
          },
        });

        if (!existing) {
          const favorite = favoriteRepository.create({
            clientUserId: createdUsers[0].id,
            productId: createdProducts[index].id,
          });
          await favoriteRepository.save(favorite);
          console.log(`✓ Added favorite for ${createdUsers[0].email}: ${createdProducts[index].name}`);
        }
      }
    }

    // User 2 favorites: 4 products
    const user2Favorites = [1, 4, 7, 10];
    for (const index of user2Favorites) {
      if (createdProducts[index]) {
        const existing = await favoriteRepository.findOne({
          where: {
            clientUserId: createdUsers[1].id,
            productId: createdProducts[index].id,
          },
        });

        if (!existing) {
          const favorite = favoriteRepository.create({
            clientUserId: createdUsers[1].id,
            productId: createdProducts[index].id,
          });
          await favoriteRepository.save(favorite);
          console.log(`✓ Added favorite for ${createdUsers[1].email}: ${createdProducts[index].name}`);
        }
      }
    }

    // User 3 favorites: 6 products
    const user3Favorites = [2, 5, 8, 11, 13, 14];
    for (const index of user3Favorites) {
      if (createdProducts[index]) {
        const existing = await favoriteRepository.findOne({
          where: {
            clientUserId: createdUsers[2].id,
            productId: createdProducts[index].id,
          },
        });

        if (!existing) {
          const favorite = favoriteRepository.create({
            clientUserId: createdUsers[2].id,
            productId: createdProducts[index].id,
          });
          await favoriteRepository.save(favorite);
          console.log(`✓ Added favorite for ${createdUsers[2].email}: ${createdProducts[index].name}`);
        }
      }
    }

    console.log('\n✅ Test data seeding completed successfully!');
    console.log('\n=== Summary ===');
    console.log(`Created/Found ${createdUsers.length} test users`);
    console.log(`Created/Found ${createdProducts.length} test products`);
    console.log(`Brands: Zara, H&M, Uniqlo, Nike, Adidas`);
    console.log('\nTest credentials:');
    CLIENT_USERS_DATA.forEach(user => {
      console.log(`  Email: ${user.email} | Password: ${user.password}`);
    });

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

seedTestData();


