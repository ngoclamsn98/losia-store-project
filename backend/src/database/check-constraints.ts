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

async function checkConstraints() {
  try {
    console.log('🔌 Connecting to database...');
    await AppDataSource.initialize();

    console.log('\n📋 Checking constraints on products table...\n');
    
    // Get all constraints
    const constraints = await AppDataSource.query(`
      SELECT 
        con.conname AS constraint_name,
        con.contype AS constraint_type,
        CASE con.contype
          WHEN 'p' THEN 'PRIMARY KEY'
          WHEN 'u' THEN 'UNIQUE'
          WHEN 'f' THEN 'FOREIGN KEY'
          WHEN 'c' THEN 'CHECK'
        END AS type_description,
        pg_get_constraintdef(con.oid) AS definition
      FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
      JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
      WHERE rel.relname = 'products'
      ORDER BY con.conname;
    `);
    
    console.log('Constraints found:');
    console.table(constraints);
    
    // Check specifically for the problematic constraint
    const problematicConstraint = constraints.find(
      (c: any) => c.constraint_name === 'UQ_9eade29292d114bd037a68a22d8'
    );
    
    if (problematicConstraint) {
      console.log('\n⚠️  Found problematic constraint:');
      console.log(problematicConstraint);
    }
    
    // Check for duplicate slugs
    console.log('\n🔍 Checking for duplicate slugs...\n');
    const duplicates = await AppDataSource.query(`
      SELECT slug, COUNT(*) as count
      FROM products
      GROUP BY slug
      HAVING COUNT(*) > 1;
    `);
    
    if (duplicates.length > 0) {
      console.log('❌ Found duplicate slugs:');
      console.table(duplicates);
    } else {
      console.log('✅ No duplicate slugs found');
    }
    
    // Show all products with their slugs
    console.log('\n📦 All products:\n');
    const products = await AppDataSource.query(`
      SELECT id, name, slug, created_at
      FROM products
      ORDER BY created_at DESC
      LIMIT 20;
    `);
    console.table(products);
    
    await AppDataSource.destroy();
    console.log('\n👋 Database connection closed');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkConstraints();

