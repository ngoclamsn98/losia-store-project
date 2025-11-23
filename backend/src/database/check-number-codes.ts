import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  synchronize: false,
});

async function checkNumberCodes() {
  try {
    console.log('🔌 Connecting to database...');
    await AppDataSource.initialize();

    console.log('\n📊 Checking products number_code values...\n');

    const products = await AppDataSource.query(`
      SELECT id, name, number_code 
      FROM products 
      ORDER BY created_at DESC 
      LIMIT 20;
    `);

    if (products.length === 0) {
      console.log('No products found in database.');
    } else {
      console.log(`Found ${products.length} products:\n`);
      products.forEach((product: any, index: number) => {
        console.log(`${index + 1}. ${product.name}`);
        console.log(`   Number Code: ${product.number_code}`);
        console.log(`   ID: ${product.id}\n`);
      });
    }

    // Check for any null number codes
    const nullCodes = await AppDataSource.query(`
      SELECT COUNT(*) as count FROM products WHERE number_code IS NULL;
    `);

    console.log(`\n✅ Products with NULL number_code: ${nullCodes[0].count}`);

    await AppDataSource.destroy();
    console.log('👋 Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkNumberCodes();

