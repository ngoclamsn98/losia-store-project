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

async function fixSchema() {
  try {
    console.log('🔌 Connecting to database...');
    await AppDataSource.initialize();

    console.log('\n🔧 Checking and fixing products table schema...\n');

    // Check if new_with_tag column exists
    const newWithTagCheck = await AppDataSource.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' AND column_name = 'new_with_tag';
    `);

    if (newWithTagCheck.length === 0) {
      console.log('Adding new_with_tag column...');
      await AppDataSource.query(`
        ALTER TABLE products 
        ADD COLUMN new_with_tag boolean DEFAULT false;
      `);
      console.log('✅ Added new_with_tag column');
    } else {
      console.log('✓ new_with_tag column already exists');
    }

    // Check if number_code column exists
    const numberCodeCheck = await AppDataSource.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'products' AND column_name = 'number_code';
    `);

    if (numberCodeCheck.length === 0) {
      console.log('Adding number_code column...');
      await AppDataSource.query(`
        ALTER TABLE products 
        ADD COLUMN number_code varchar;
      `);
      console.log('✅ Added number_code column');
      
      // Add unique constraint
      console.log('Adding unique constraint to number_code...');
      await AppDataSource.query(`
        ALTER TABLE products 
        ADD CONSTRAINT UQ_products_number_code UNIQUE (number_code);
      `);
      console.log('✅ Added unique constraint to number_code');
    } else {
      console.log('✓ number_code column already exists');
      
      // Check if unique constraint exists
      const constraintCheck = await AppDataSource.query(`
        SELECT constraint_name 
        FROM information_schema.table_constraints 
        WHERE table_name = 'products' 
        AND constraint_type = 'UNIQUE' 
        AND constraint_name LIKE '%number_code%';
      `);
      
      if (constraintCheck.length === 0) {
        console.log('Adding unique constraint to number_code...');
        await AppDataSource.query(`
          ALTER TABLE products 
          ADD CONSTRAINT UQ_products_number_code UNIQUE (number_code);
        `);
        console.log('✅ Added unique constraint to number_code');
      } else {
        console.log('✓ Unique constraint on number_code already exists');
      }
    }

    // Check for products with null number_code
    const nullNumberCodeProducts = await AppDataSource.query(`
      SELECT id, name FROM products WHERE number_code IS NULL;
    `);

    if (nullNumberCodeProducts.length > 0) {
      console.log(`\n⚠️  Found ${nullNumberCodeProducts.length} products with null number_code`);
      console.log('Generating number codes for existing products...');
      
      for (const product of nullNumberCodeProducts) {
        const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randomSuffix = Math.floor(100000 + Math.random() * 900000);
        const numberCode = `${datePrefix}${randomSuffix}`;
        
        await AppDataSource.query(
          `UPDATE products SET number_code = $1 WHERE id = $2`,
          [numberCode, product.id]
        );
        console.log(`✓ Updated product "${product.name}" with number_code: ${numberCode}`);
      }
      console.log('✅ All products now have number_code');
    } else {
      console.log('✓ All products have number_code');
    }

    // Make number_code NOT NULL if it's nullable
    const columnInfo = await AppDataSource.query(`
      SELECT is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'products' AND column_name = 'number_code';
    `);

    if (columnInfo.length > 0 && columnInfo[0].is_nullable === 'YES') {
      console.log('\nMaking number_code column NOT NULL...');
      await AppDataSource.query(`
        ALTER TABLE products 
        ALTER COLUMN number_code SET NOT NULL;
      `);
      console.log('✅ number_code column is now NOT NULL');
    } else {
      console.log('✓ number_code column is already NOT NULL');
    }

    console.log('\n✅ Schema fix completed successfully!');
    await AppDataSource.destroy();
    console.log('👋 Database connection closed');
  } catch (error) {
    console.error('❌ Error during schema fix:', error);
    process.exit(1);
  }
}

fixSchema();

