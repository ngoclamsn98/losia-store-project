import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  Generated,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Voucher } from './voucher.entity';
import { ClientUser } from '../../client-users/entities/client-user.entity';

@Entity('voucher_usages')
export class VoucherUsage {
  @PrimaryColumn('uuid')
  @Generated('uuid')
  id: string;

  @Column({ name: 'voucher_id', type: 'uuid' })
  voucherId: string;

  @ManyToOne(() => Voucher, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'voucher_id' })
  voucher: Voucher;

  @Column({ name: 'client_user_id', type: 'uuid', nullable: true })
  clientUserId: string | null;

  @ManyToOne(() => ClientUser, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'client_user_id' })
  clientUser: ClientUser | null;

  @Column({ name: 'order_id', type: 'uuid', nullable: true })
  orderId: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, name: 'discount_amount' })
  discountAmount: number;

  @CreateDateColumn({ name: 'used_at' })
  usedAt: Date;
}

