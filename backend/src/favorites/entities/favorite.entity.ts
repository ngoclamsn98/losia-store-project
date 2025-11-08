import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  Generated,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ClientUser } from '../../client-users/entities/client-user.entity';
import { Product } from '../../products/entities/product.entity';

@Entity('favorite_products')
@Index(['clientUserId', 'productId'], { unique: true }) // Prevent duplicate favorites
export class FavoriteProduct {
  @PrimaryColumn('uuid')
  @Generated('uuid')
  id: string;

  @Column({ name: 'client_user_id', type: 'uuid' })
  clientUserId: string;

  @ManyToOne(() => ClientUser, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'client_user_id' })
  clientUser: ClientUser;

  @Column({ name: 'product_id', type: 'uuid' })
  productId: string;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

