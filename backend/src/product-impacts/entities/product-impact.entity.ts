import {
  Entity,
  Column,
  PrimaryColumn,
  Generated,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('product_impacts')
export class ProductImpact {
  @PrimaryColumn('uuid')
  @Generated('uuid')
  id: string;

  @Column({ name: 'product_group', unique: true })
  productGroup: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'glasses_of_water' })
  glassesOfWater: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'hours_of_lighting' })
  hoursOfLighting: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'kms_of_driving' })
  kmsOfDriving: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

