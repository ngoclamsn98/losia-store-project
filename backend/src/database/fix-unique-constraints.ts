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

async function fixConstraints() {
  try {
    console.log('🔌 Connecting to database...');
    await AppDataSource.initialize();

    console.log('\n🔧 Removing UNIQUE constraints from eco_impact_id and product_condition_id...\n');
    
    // Drop unique constraint on eco_impact_id
    try {
      await AppDataSource.query(`
        ALTER TABLE products 
        DROP CONSTRAINT IF EXISTS "UQ_9eade29292d114bd037a68a22d8";
      `);
      console.log('✅ Removed UNIQUE constraint on eco_impact_id');
    } catch (error) {
      console.log('⚠️  Constraint on eco_impact_id may not exist or already removed');
    }
    
    // Drop unique constraint on product_condition_id
    try {
      await AppDataSource.query(`
        ALTER TABLE products 
        DROP CONSTRAINT IF EXISTS "UQ_a98f3f91d201b00ba7db4ba2ac8";
      `);
      console.log('✅ Removed UNIQUE constraint on product_condition_id');
    } catch (error) {
      console.log('⚠️  Constraint on product_condition_id may not exist or already removed');
    }
    
    // Verify constraints are removed
    console.log('\n📋 Checking remaining constraints...\n');
    const constraints = await AppDataSource.query(`
      SELECT 
        con.conname AS constraint_name,
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
    
    console.log('Current constraints:');
    console.table(constraints);
    
    await AppDataSource.destroy();
    console.log('\n✅ Done! Database connection closed');
    console.log('\n💡 Now you can restart your server and create products without unique constraint errors.');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixConstraints();

