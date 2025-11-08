import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Generated,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinTable,
  JoinColumn,
} from 'typeorm';
import { Category } from '../../categories/entities/category.entity';
import { ProductVariant } from './product-variant.entity';
import { User } from '../../users/entities/user.entity';
import { EcoImpact } from '../../eco-impacts/entities/eco-impact.entity';
import { ProductCondition } from '../../product-conditions/entities/product-condition.entity';

export enum ProductStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
}

export enum ProductSeason {
  SPRING = 'SPRING',
  SUMMER = 'SUMMER',
  FALL = 'FALL',
  WINTER = 'WINTER',
  ALL_SEASON = 'ALL_SEASON',
}

@Entity('products')
export class Product {
  @PrimaryColumn('uuid')
  @Generated('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  content: string;

  @ManyToMany(() => Category, (category) => category.products)
  @JoinTable({
    name: 'product_categories',
    joinColumn: { name: 'product_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'category_id', referencedColumnName: 'id' },
  })
  categories: Category[];

  @Column({ type: 'simple-array', name: 'image_urls', nullable: true })
  imageUrls: string[];

  @Column({ name: 'thumbnail_url', nullable: true })
  thumbnailUrl: string;

  @OneToMany(() => ProductVariant, (variant) => variant.product, {
    cascade: true,
    eager: true,
  })
  variants: ProductVariant[];

  @Column({
    type: 'enum',
    enum: ProductStatus,
    default: ProductStatus.DRAFT,
  })
  status: ProductStatus;

  @Column({ name: 'is_featured', default: false })
  isFeatured: boolean;

  @Column({ type: 'simple-array', nullable: true })
  tags: string[];

  @Column({ default: 0 })
  views: number;

  @Column({ name: 'seo_title', nullable: true })
  seoTitle: string;

  @Column({ name: 'seo_description', nullable: true })
  seoDescription: string;

  @Column({ name: 'seo_keywords', type: 'simple-array', nullable: true })
  seoKeywords: string[];

  // Eco Impact relationship
  @OneToOne(() => EcoImpact, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'eco_impact_id' })
  ecoImpact: EcoImpact | null;

  // Season field
  @Column({
    type: 'enum',
    enum: ProductSeason,
    nullable: true,
  })
  season: ProductSeason;

  // Product Condition relationship
  @OneToOne(() => ProductCondition, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'product_condition_id' })
  productCondition: ProductCondition | null;

  @Column({ name: 'created_by_id', type: 'uuid', nullable: true })
  createdById: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by_id' })
  createdBy: User;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

