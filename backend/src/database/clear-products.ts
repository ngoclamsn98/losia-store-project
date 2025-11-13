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

async function clearProducts() {
  try {
    console.log('🔌 Connecting to database...');
    await AppDataSource.initialize();

    console.log('🗑️  Clearing products and related data...');
    
    // Delete in correct order to avoid foreign key constraints
    await AppDataSource.query('DELETE FROM product_variants');
    await AppDataSource.query('DELETE FROM product_categories');
    await AppDataSource.query('DELETE FROM products');
    
    console.log('✅ Products cleared successfully!');
    
    await AppDataSource.destroy();
    console.log('👋 Database connection closed');
  } catch (error) {
    console.error('❌ Error during clearing:', error);
    process.exit(1);
  }
}

clearProducts();

