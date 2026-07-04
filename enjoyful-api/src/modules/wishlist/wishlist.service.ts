import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Wishlist, WishlistDocument } from './schemas/wishlist.schema';

@Injectable()
export class WishlistService {
  constructor(
    @InjectModel(Wishlist.name) private wishlistModel: Model<WishlistDocument>,
  ) {}

  async getWishlist(userId: string): Promise<WishlistDocument> {
    const wishlist = await this.wishlistModel
      .findOne({ user: new Types.ObjectId(userId) })
      .populate('products', 'name price image hoverImage slug rating')
      .lean();

    if (!wishlist) {
      return {
        user: new Types.ObjectId(userId),
        products: [],
      } as unknown as WishlistDocument;
    }

    return wishlist as unknown as WishlistDocument;
  }

  async addProduct(userId: string, productId: string): Promise<WishlistDocument> {
    const wishlist = await this.wishlistModel.findOneAndUpdate(
      { user: new Types.ObjectId(userId) },
      { $addToSet: { products: new Types.ObjectId(productId) } },
      { new: true, upsert: true },
    ).populate('products', 'name price image hoverImage slug rating');

    return wishlist;
  }

  async removeProduct(userId: string, productId: string): Promise<WishlistDocument> {
    const wishlist = await this.wishlistModel.findOneAndUpdate(
      { user: new Types.ObjectId(userId) },
      { $pull: { products: new Types.ObjectId(productId) } },
      { new: true },
    ).populate('products', 'name price image hoverImage slug rating');

    if (!wishlist) throw new NotFoundException('Wishlist not found');
    return wishlist;
  }
}
