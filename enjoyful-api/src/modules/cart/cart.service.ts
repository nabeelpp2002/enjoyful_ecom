import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cart, CartDocument } from './schemas/cart.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { AddCartItemDto, UpdateCartItemDto } from './dto/cart-item.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name) private cartModel: Model<CartDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  async getCart(userId: string): Promise<CartDocument> {
    const cart = await this.cartModel
      .findOne({ user: new Types.ObjectId(userId) })
      .populate('items.product', 'name price image slug')
      .lean();

    if (!cart) {
      return {
        user: new Types.ObjectId(userId),
        items: [],
      } as unknown as CartDocument;
    }

    return cart as unknown as CartDocument;
  }

  async addItem(userId: string, dto: AddCartItemDto): Promise<CartDocument> {
    const { productId, quantity = 1 } = dto;

    const product = await this.productModel.findById(productId).lean();
    if (!product) throw new NotFoundException('Product not found');

    if (product.deletedAt || !product.isActive) {
      throw new BadRequestException('This product is not currently available.');
    }

    const productObjId = new Types.ObjectId(productId);

    let cart = await this.cartModel.findOne({ user: new Types.ObjectId(userId) });

    if (!cart) {
      cart = await this.cartModel.create({
        user: new Types.ObjectId(userId),
        items: [
          {
            product: productObjId,
            quantity,
            priceSnapshot: product.price,
            nameSnapshot: product.name,
            imageSnapshot: product.image ?? '',
            addedAt: new Date(),
          },
        ],
      });
      return cart.populate('items.product', 'name price image slug');
    }

    const existingItemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId,
    );

    if (existingItemIndex > -1) {
      cart.items[existingItemIndex].quantity += quantity;
    } else {
      cart.items.push({
        product: productObjId,
        quantity,
        priceSnapshot: product.price,
        nameSnapshot: product.name,
        imageSnapshot: product.image ?? '',
        addedAt: new Date(),
      } as any);
    }

    await cart.save();
    return cart.populate('items.product', 'name price image slug');
  }

  async updateItem(
    userId: string,
    productId: string,
    dto: UpdateCartItemDto,
  ): Promise<CartDocument> {
    const cart = await this.cartModel.findOneAndUpdate(
      {
        user: new Types.ObjectId(userId),
        'items.product': new Types.ObjectId(productId),
      },
      { $set: { 'items.$.quantity': Math.max(1, dto.quantity) } },
      { new: true },
    ).populate('items.product', 'name price image slug');

    if (!cart) throw new NotFoundException('Cart item not found');
    return cart;
  }

  async removeItem(userId: string, productId: string): Promise<CartDocument> {
    const cart = await this.cartModel.findOneAndUpdate(
      { user: new Types.ObjectId(userId) },
      { $pull: { items: { product: new Types.ObjectId(productId) } } },
      { new: true },
    ).populate('items.product', 'name price image slug');

    if (!cart) throw new NotFoundException('Cart not found');
    return cart;
  }

  async clearCart(userId: string): Promise<CartDocument> {
    const cart = await this.cartModel.findOneAndUpdate(
      { user: new Types.ObjectId(userId) },
      { $set: { items: [] } },
      { new: true },
    ).lean();

    if (!cart) throw new NotFoundException('Cart not found');
    return cart as unknown as CartDocument;
  }

  async mergeCarts(
    userId: string,
    guestItems: { productId: string; quantity: number }[],
  ): Promise<CartDocument> {
    let cart = await this.cartModel.findOne({ user: new Types.ObjectId(userId) });

    if (!cart) {
      cart = await this.cartModel.create({
        user: new Types.ObjectId(userId),
        items: [],
      });
    }

    for (const guestItem of guestItems) {
      const product = await this.productModel.findById(guestItem.productId).lean();
      if (!product) continue;

      const existingIndex = cart.items.findIndex(
        (item) => item.product.toString() === guestItem.productId,
      );

      if (existingIndex > -1) {
        cart.items[existingIndex].quantity = Math.max(
          cart.items[existingIndex].quantity,
          guestItem.quantity,
        );
      } else {
        cart.items.push({
          product: new Types.ObjectId(guestItem.productId),
          quantity: guestItem.quantity,
          priceSnapshot: product.price,
          nameSnapshot: product.name,
          imageSnapshot: product.image ?? '',
          addedAt: new Date(),
        } as any);
      }
    }

    await cart.save();
    return cart.populate('items.product', 'name price image slug');
  }
}
