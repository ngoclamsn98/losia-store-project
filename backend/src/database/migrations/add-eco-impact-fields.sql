-- Migration: Add eco impact fields to products table
-- Date: 2025-11-01

-- Add eco impact columns to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS eco_impact_group VARCHAR(255),
ADD COLUMN IF NOT EXISTS eco_glasses_of_water DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS eco_hours_of_lighting DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS eco_kms_of_driving DECIMAL(10, 2);

-- Create product_impacts table
CREATE TABLE IF NOT EXISTS product_impacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_group VARCHAR(255) UNIQUE NOT NULL,
  glasses_of_water DECIMAL(10, 2) NOT NULL,
  hours_of_lighting DECIMAL(10, 2) NOT NULL,
  kms_of_driving DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default eco impact data
INSERT INTO product_impacts (product_group, glasses_of_water, hours_of_lighting, kms_of_driving)
VALUES
  ('Váy (Dress)', 2083.33, 100.0, 8.39),
  ('Áo (Top)', 1125.0, 12.5, 0.92),
  ('Áo len (Sweaters)', 1395.83, 75.0, 9.22),
  ('Áo khoác (Coats & Jackets)', 1458.33, 125.0, 11.72),
  ('Quần jeans (Jeans)', 1562.5, 153.75, 11.57),
  ('Quần dài (Pants)', 354.17, 21.88, 5.04),
  ('Chân váy (Skirts)', 1145.83, 50.0, 4.6),
  ('Quần short (Shorts)', 937.5, 37.5, 4.18)
ON CONFLICT (product_group) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_products_eco_impact_group ON products(eco_impact_group);
CREATE INDEX IF NOT EXISTS idx_product_impacts_product_group ON product_impacts(product_group);

