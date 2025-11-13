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

  // Department tags for filtering (e.g., 'women', 'premium', 'designer', 'shoes', etc.)
  @Column({ type: 'simple-array', nullable: true, name: 'department_tags' })
  departmentTags: string[];

  // Style tags for filtering (e.g., 'belts', 'hats', 'ballerina-flat', etc.)
  @Column({ type: 'simple-array', nullable: true, name: 'style_tags' })
  styleTags: string[];

  // Category tags for filtering (e.g., 'dresses', 'tops', 'jeans', etc.)
  @Column({ type: 'simple-array', nullable: true, name: 'category_tags' })
  categoryTags: string[];

  // Color names for filtering
  @Column({ type: 'simple-array', nullable: true, name: 'color_names' })
  colorNames: string[];

  // Pattern/characteristics (e.g., 'solid', 'striped', 'floral')
  @Column({ nullable: true, name: 'chars_pattern' })
  charsPattern: string;

  // Price for filtering
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price: number;

  // Is luxury brand
  @Column({ name: 'luxe_brand', default: false })
  luxeBrand: boolean;

  // Curation ID for curated collections
  @Column({ name: 'curation_id', nullable: true })
  curationId: string;

  @Column({ default: 0 })
  views: number;

  @Column({ name: 'seo_title', nullable: true })
  seoTitle: string;

  @Column({ name: 'seo_description', nullable: true })
  seoDescription: string;

  @Column({ name: 'seo_keywords', type: 'simple-array', nullable: true })
  seoKeywords: string[];

  // Eco Impact relationship - ManyToOne allows multiple products to share same eco impact
  @ManyToOne(() => EcoImpact, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'eco_impact_id' })
  ecoImpact: EcoImpact | null;

  @Column({ name: 'eco_impact_id', type: 'uuid', nullable: true })
  ecoImpactId: string | null;

  // Season field
  @Column({
    type: 'enum',
    enum: ProductSeason,
    nullable: true,
  })
  season: ProductSeason;

  // Product Condition relationship - ManyToOne allows multiple products to share same condition
  @ManyToOne(() => ProductCondition, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'product_condition_id' })
  productCondition: ProductCondition | null;

  @Column({ name: 'product_condition_id', type: 'uuid', nullable: true })
  productConditionId: string | null;

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

