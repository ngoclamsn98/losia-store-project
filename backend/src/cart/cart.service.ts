import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart, CartItem } from './entities/cart.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { Product } from '../products/entities/product.entity';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private cartRepository: Repository<Cart>,
    @InjectRepository(ProductVariant)
    private variantRepository: Repository<ProductVariant>,
    @InjectRepository(Product)
    private productRepository: Repository<Product>,
  ) {}

  async getCart(userId: string): Promise<Cart> {
    let cart = await this.cartRepository.findOne({
      where: { userId },
    });

    if (!cart) {
      cart = this.cartRepository.create({
        userId,
        items: [],
      });
      await this.cartRepository.save(cart);
    }

    return cart;
  }

  async addToCart(userId: string, dto: AddToCartDto): Promise<Cart> {
    const variant = await this.variantRepository.findOne({
      where: { id: dto.variantId },
      relations: ['product'],
    });

    if (!variant) {
      throw new NotFoundException('Product variant not found');
    }

    if (!variant.isActive) {
      throw new BadRequestException('Product variant is not available');
    }

    if (variant.stock < dto.quantity) {
      throw new BadRequestException('Insufficient stock');
    }

    const cart = await this.getCart(userId);
    const existingItemIndex = cart.items.findIndex(
      (item) => item.variantId === dto.variantId,
    );

    if (existingItemIndex >= 0) {
      // Update quantity
      const newQuantity = cart.items[existingItemIndex].quantity + dto.quantity;
      if (variant.stock < newQuantity) {
        throw new BadRequestException('Insufficient stock');
      }
      cart.items[existingItemIndex].quantity = newQuantity;
    } else {
      // Add new item
      const cartItem: CartItem = {
        variantId: variant.id,
        productId: variant.product.id,
        productName: variant.product.name,
        variantName: variant.name,
        price: variant.price,
        quantity: dto.quantity,
        imageUrl: variant.imageUrl || variant.product.thumbnailUrl,
      };
      cart.items.push(cartItem);
    }

    return this.cartRepository.save(cart);
  }

  async updateCartItem(
    userId: string,
    variantId: string,
    dto: UpdateCartItemDto,
  ): Promise<Cart> {
    const cart = await this.getCart(userId);
    const itemIndex = cart.items.findIndex(
      (item) => item.variantId === variantId,
    );

    if (itemIndex < 0) {
      throw new NotFoundException('Item not found in cart');
    }

    const variant = await this.variantRepository.findOne({
      where: { id: variantId },
    });

    if (!variant) {
      throw new NotFoundException('Product variant not found');
    }

    if (variant.stock < dto.quantity) {
      throw new BadRequestException('Insufficient stock');
    }

    cart.items[itemIndex].quantity = dto.quantity;
    cart.items[itemIndex].price = variant.price; // Update price in case it changed

    return this.cartRepository.save(cart);
  }

  async removeFromCart(userId: string, variantId: string): Promise<Cart> {
    const cart = await this.getCart(userId);
    cart.items = cart.items.filter((item) => item.variantId !== variantId);
    return this.cartRepository.save(cart);
  }

  async clearCart(userId: string): Promise<Cart> {
    const cart = await this.getCart(userId);
    cart.items = [];
    return this.cartRepository.save(cart);
  }
}

