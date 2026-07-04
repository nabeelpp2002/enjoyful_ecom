import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../auth/schemas/user.schema';
import { Order, OrderDocument } from '../orders/schemas/order.schema';
import { Review, ReviewDocument } from '../reviews/schemas/review.schema';

export type UserSort = 'recent' | 'oldest' | 'name' | 'orders';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
  ) {}

  async listAdmin(page = 1, limit = 20, q = '', sort: UserSort = 'recent') {
    const filter: Record<string, unknown> = {};
    if (q) {
      const safeQ = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { email: { $regex: safeQ, $options: 'i' } },
        { firstName: { $regex: safeQ, $options: 'i' } },
        { lastName: { $regex: safeQ, $options: 'i' } },
      ];
    }

    const sortMap: Record<UserSort, Record<string, 1 | -1>> = {
      recent: { createdAt: -1 },
      oldest: { createdAt: 1 },
      name: { firstName: 1, lastName: 1 },
      orders: { createdAt: -1 }, // ordering by aggregate done after lookup
    };

    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.userModel.find(filter).sort(sortMap[sort]).skip(skip).limit(limit).lean(),
      this.userModel.countDocuments(filter),
    ]);

    // Attach order + review counts for each user in one round-trip each
    const ids = users.map(u => u._id);
    const [orderAgg, reviewAgg] = await Promise.all([
      this.orderModel.aggregate([
        { $match: { user: { $in: ids } } },
        { $group: { _id: '$user', count: { $sum: 1 }, totalSpent: { $sum: '$total' } } },
      ]),
      this.reviewModel.aggregate([
        { $match: { user: { $in: ids } } },
        { $group: { _id: '$user', count: { $sum: 1 } } },
      ]),
    ]);
    const orderMap = new Map(orderAgg.map((r: { _id: Types.ObjectId; count: number; totalSpent: number }) => [r._id.toString(), r]));
    const reviewMap = new Map(reviewAgg.map((r: { _id: Types.ObjectId; count: number }) => [r._id.toString(), r.count]));

    const data = users.map(u => {
      const id = u._id.toString();
      const o = orderMap.get(id);
      return {
        id,
        email: u.email,
        firstName: u.firstName ?? '',
        lastName: u.lastName ?? '',
        avatarUrl: (u as { avatarUrl?: string }).avatarUrl ?? '',
        role: u.role,
        isActive: u.isActive,
        emailVerified: (u as { emailVerified?: boolean }).emailVerified ?? false,
        providers: (u as { providers?: string[] }).providers ?? [],
        createdAt: (u as unknown as { createdAt: Date }).createdAt,
        updatedAt: (u as unknown as { updatedAt: Date }).updatedAt,
        orderCount: o?.count ?? 0,
        totalSpent: Math.round((o?.totalSpent ?? 0) * 100) / 100,
        reviewCount: reviewMap.get(id) ?? 0,
      };
    });

    if (sort === 'orders') {
      data.sort((a, b) => b.orderCount - a.orderCount || b.totalSpent - a.totalSpent);
    }

    // Aggregate stats for the dashboard card
    const [totalUsers, activeUsers, adminCount, recentSignups] = await Promise.all([
      this.userModel.countDocuments({}),
      this.userModel.countDocuments({ isActive: true }),
      this.userModel.countDocuments({ role: 'admin' }),
      this.userModel.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      stats: { totalUsers, activeUsers, adminCount, recentSignups },
    };
  }

  async getOne(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('User not found');
    const user = await this.userModel.findById(id).lean();
    if (!user) throw new NotFoundException('User not found');
    const [orders, reviews] = await Promise.all([
      this.orderModel.find({ user: id }).sort({ createdAt: -1 }).limit(10).lean(),
      this.reviewModel.find({ user: id }).sort({ createdAt: -1 }).limit(10).populate('product', 'name slug').lean(),
    ]);
    return { user, recentOrders: orders, recentReviews: reviews };
  }

  async setActive(id: string, isActive: boolean) {
    if (!Types.ObjectId.isValid(id)) throw new NotFoundException('User not found');
    const user = await this.userModel.findByIdAndUpdate(id, { isActive }, { new: true }).lean();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
