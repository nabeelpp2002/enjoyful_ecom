import {
  Injectable, NotFoundException, ForbiddenException, ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Review, ReviewDocument } from './schemas/review.schema';
import { User, UserDocument } from '../auth/schemas/user.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';
import { CreateReviewDto, UpdateReviewDto } from './dto/create-review.dto';

export type ReviewSort = 'recent' | 'oldest' | 'highest' | 'lowest';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  async listForProduct(productId: string, page = 1, limit = 10, sort: ReviewSort = 'recent') {
    if (!Types.ObjectId.isValid(productId)) {
      throw new NotFoundException('Product not found');
    }
    const sortMap: Record<ReviewSort, Record<string, 1 | -1>> = {
      recent: { createdAt: -1 },
      oldest: { createdAt: 1 },
      highest: { rating: -1, createdAt: -1 },
      lowest: { rating: 1, createdAt: -1 },
    };
    const filter = {
      product: new Types.ObjectId(productId),
      isApproved: true,
      isHidden: { $ne: true },
      isDeleted: { $ne: true },
    };
    const skip = (page - 1) * limit;
    const [data, total, summary] = await Promise.all([
      this.reviewModel.find(filter).sort(sortMap[sort]).skip(skip).limit(limit).lean(),
      this.reviewModel.countDocuments(filter),
      this.summaryFor(productId),
    ]);
    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      summary,
    };
  }

  /** Aggregated stats — avg rating + per-star distribution. */
  async summaryFor(productId: string) {
    const result = await this.reviewModel.aggregate([
      { $match: {
        product: new Types.ObjectId(productId),
        isApproved: true,
        isHidden: { $ne: true },
        isDeleted: { $ne: true },
      } },
      {
        $group: {
          _id: null,
          avg: { $avg: '$rating' },
          count: { $sum: 1 },
          dist: { $push: '$rating' },
        },
      },
    ]);
    if (!result.length) {
      return { average: 0, count: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
    }
    const r = result[0] as { avg: number; count: number; dist: number[] };
    const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const rating of r.dist) distribution[Math.round(rating)]++;
    return { average: Math.round(r.avg * 10) / 10, count: r.count, distribution };
  }

  async create(userId: string, dto: CreateReviewDto) {
    if (!Types.ObjectId.isValid(dto.productId)) throw new NotFoundException('Product not found');
    const productExists = await this.productModel.exists({ _id: dto.productId, deletedAt: null });
    if (!productExists) throw new NotFoundException('Product not found');

    const user = await this.userModel.findById(userId).lean();
    if (!user) throw new NotFoundException('User not found');

    const productOid = new Types.ObjectId(dto.productId);
    const userOid = new Types.ObjectId(userId);
    const existing = await this.reviewModel.findOne({ product: productOid, user: userOid }).lean();
    if (existing) {
      // Surface the existing review id so the frontend can switch to "Edit" mode
      // instead of showing a dead-end error.
      throw new ConflictException({
        code: 'ALREADY_REVIEWED',
        message: "You've already reviewed this product. You can edit your review instead.",
        existingReviewId: existing._id.toString(),
      });
    }

    const userName =
      [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
      user.email.split('@')[0];

    const created = await this.reviewModel.create({
      product: new Types.ObjectId(dto.productId),
      user: new Types.ObjectId(userId),
      userName,
      userEmail: user.email,
      avatarUrl: (user as { avatarUrl?: string }).avatarUrl ?? '',
      rating: dto.rating,
      title: dto.title?.trim() ?? '',
      comment: dto.comment.trim(),
      isVerifiedPurchase: false,
      isApproved: true,
    });

    await this.recomputeProductRating(dto.productId);
    return created.toObject();
  }

  async update(reviewId: string, userId: string, dto: UpdateReviewDto) {
    const review = await this.reviewModel.findById(reviewId);
    if (!review) throw new NotFoundException('Review not found');
    if (review.user.toString() !== userId) throw new ForbiddenException('Not your review');

    if (dto.rating !== undefined) review.rating = dto.rating;
    if (dto.title !== undefined) review.title = dto.title.trim();
    if (dto.comment !== undefined) review.comment = dto.comment.trim();
    await review.save();

    await this.recomputeProductRating(review.product.toString());
    return review.toObject();
  }

  /**
   * Customer deleting their OWN review = hard delete (full retraction).
   * Admin deleting someone else's review = SOFT delete (kept in DB, hidden from public).
   */
  async remove(reviewId: string, userId: string, isAdmin: boolean) {
    const review = await this.reviewModel.findById(reviewId);
    if (!review) throw new NotFoundException('Review not found');

    const isOwner = review.user.toString() === userId;
    if (!isAdmin && !isOwner) throw new ForbiddenException('Not your review');

    const productId = review.product.toString();
    if (isOwner && !isAdmin) {
      await review.deleteOne();
    } else {
      // Admin soft delete
      review.isDeleted = true;
      review.deletedAt = new Date();
      await review.save();
    }
    await this.recomputeProductRating(productId);
    return { deleted: true };
  }

  /** Admin: list ALL reviews (including hidden + soft-deleted) with optional status filter. */
  async listAdmin(page = 1, limit = 20, status: 'all' | 'visible' | 'hidden' | 'deleted' = 'all', q = '') {
    const filter: Record<string, unknown> = {};
    if (status === 'visible') {
      filter.isApproved = true;
      filter.isHidden = { $ne: true };
      filter.isDeleted = { $ne: true };
    } else if (status === 'hidden') {
      filter.isHidden = true;
      filter.isDeleted = { $ne: true };
    } else if (status === 'deleted') {
      filter.isDeleted = true;
    }
    if (q) {
      const safeQ = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { userName: { $regex: safeQ, $options: 'i' } },
        { userEmail: { $regex: safeQ, $options: 'i' } },
        { title: { $regex: safeQ, $options: 'i' } },
        { comment: { $regex: safeQ, $options: 'i' } },
      ];
    }
    const skip = (page - 1) * limit;
    const [data, total, stats] = await Promise.all([
      this.reviewModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('product', 'name slug').lean(),
      this.reviewModel.countDocuments(filter),
      this.adminStats(),
    ]);
    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      stats,
    };
  }

  private async adminStats() {
    const [total, visible, hidden, deleted] = await Promise.all([
      this.reviewModel.countDocuments({}),
      this.reviewModel.countDocuments({ isApproved: true, isHidden: { $ne: true }, isDeleted: { $ne: true } }),
      this.reviewModel.countDocuments({ isHidden: true, isDeleted: { $ne: true } }),
      this.reviewModel.countDocuments({ isDeleted: true }),
    ]);
    return { total, visible, hidden, deleted };
  }

  async setHidden(reviewId: string, hidden: boolean) {
    const review = await this.reviewModel.findById(reviewId);
    if (!review) throw new NotFoundException('Review not found');
    review.isHidden = hidden;
    review.hiddenAt = hidden ? new Date() : null;
    review.isApproved = !hidden;
    await review.save();
    await this.recomputeProductRating(review.product.toString());
    return review.toObject();
  }

  /** Soft-delete toggle — set isDeleted true/false. Used by admin to archive or restore. */
  async setDeleted(reviewId: string, deleted: boolean) {
    const review = await this.reviewModel.findById(reviewId);
    if (!review) throw new NotFoundException('Review not found');
    review.isDeleted = deleted;
    review.deletedAt = deleted ? new Date() : null;
    await review.save();
    await this.recomputeProductRating(review.product.toString());
    return review.toObject();
  }

  /** Recompute product.rating + product.reviews from the visible review set. */
  private async recomputeProductRating(productId: string) {
    const summary = await this.summaryFor(productId);
    await this.productModel.updateOne(
      { _id: productId },
      { $set: { rating: summary.average, reviews: summary.count } },
    );
  }
}
