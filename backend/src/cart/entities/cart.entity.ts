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
import { ClientUser } from '../../client-users/entities/client-user.entity';

@Entity('carts')
export class Cart {
  @PrimaryColumn('uuid')
  @Generated('uuid')
  id: string;

  @Column({ name: 'client_user_id', type: 'uuid' })
  clientUserId: string;

  @ManyToOne(() => ClientUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'client_user_id' })
  clientUser: ClientUser;

  @Column({ type: 'jsonb', default: [] })
  items: CartItem[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

export interface CartItem {
  variantId: string;
  productId: string;
  productName: string;
  variantName?: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

