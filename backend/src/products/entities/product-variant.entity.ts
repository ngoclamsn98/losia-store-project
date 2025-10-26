import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Generated,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Product } from './product.entity';

@Entity('product_variants')
export class ProductVariant {
  @PrimaryColumn('uuid')
  @Generated('uuid')
  id: string;

  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @ManyToOne(() => Product, (product) => product.variants, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ nullable: true })
  sku: string;

  @Column({ nullable: true })
  name: string;

  @Column({ type: 'jsonb', nullable: true })
  attributes: Record<string, string>; // e.g., { "color": "Red", "size": "M" }

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'compare_at_price', nullable: true })
  compareAtPrice: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'cost_price', nullable: true })
  costPrice: number;

  @Column({ default: 0 })
  stock: number;

  @Column({ name: 'low_stock_threshold', default: 10 })
  lowStockThreshold: number;

  @Column({ name: 'image_url', nullable: true })
  imageUrl: string;

  @Column({ default: 0 })
  weight: number; // in grams

  @Column({ name: 'is_default', default: false })
  isDefault: boolean;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

