import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Generated,
} from 'typeorm';

export enum VoucherType {
  PERCENTAGE = 'PERCENTAGE', // Giảm theo %
  FIXED_AMOUNT = 'FIXED_AMOUNT', // Giảm số tiền cố định
}

export enum VoucherStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  EXPIRED = 'EXPIRED',
}

@Entity('vouchers')
export class Voucher {
  @PrimaryColumn('uuid')
  @Generated('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true })
  code: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: VoucherType,
    default: VoucherType.PERCENTAGE,
  })
  type: VoucherType;

  // Giá trị giảm (% hoặc số tiền)
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  value: number;

  // Giá trị đơn hàng tối thiểu để áp dụng
  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'min_order_value', default: 0 })
  minOrderValue: number;

  // Giảm tối đa (cho loại PERCENTAGE)
  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'max_discount', nullable: true })
  maxDiscount: number | null;

  // Số lượng voucher có thể sử dụng
  @Column({ name: 'usage_limit', type: 'int', nullable: true })
  usageLimit: number | null;

  // Số lần đã sử dụng
  @Column({ name: 'usage_count', type: 'int', default: 0 })
  usageCount: number;

  // Giới hạn số lần sử dụng mỗi user
  @Column({ name: 'usage_limit_per_user', type: 'int', nullable: true })
  usageLimitPerUser: number | null;

  // Ngày bắt đầu
  @Column({ name: 'start_date', type: 'timestamp', nullable: true })
  startDate: Date | null;

  // Ngày kết thúc
  @Column({ name: 'end_date', type: 'timestamp', nullable: true })
  endDate: Date | null;

  // Chỉ dành cho khách hàng mới (first purchase)
  @Column({ name: 'is_first_purchase_only', default: false })
  isFirstPurchaseOnly: boolean;

  // Chỉ dành cho khách hàng đã đăng nhập
  @Column({ name: 'is_authenticated_only', default: false })
  isAuthenticatedOnly: boolean;

  @Column({
    type: 'enum',
    enum: VoucherStatus,
    default: VoucherStatus.ACTIVE,
  })
  status: VoucherStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

