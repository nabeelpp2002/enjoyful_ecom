import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Feedback, FeedbackDocument, FeedbackStatus } from './schemas/feedback.schema';
import { User, UserDocument } from '../auth/schemas/user.schema';
import { CreateFeedbackDto } from './dto/create-feedback.dto';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectModel(Feedback.name) private feedbackModel: Model<FeedbackDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(userId: string, dto: CreateFeedbackDto) {
    const user = await this.userModel.findById(userId).lean();
    if (!user) throw new NotFoundException('User not found');

    const userName =
      [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
      user.email.split('@')[0];

    const created = await this.feedbackModel.create({
      user: new Types.ObjectId(userId),
      userName,
      userEmail: user.email,
      rating: dto.rating ?? 0,
      message: dto.message.trim(),
      status: 'new',
    });
    return created.toObject();
  }

  /** Admin: list all feedback with optional status filter + search. */
  async listAdmin(page = 1, limit = 20, status: 'all' | FeedbackStatus = 'all', q = '') {
    const filter: Record<string, unknown> = {};
    if (status !== 'all') filter.status = status;
    if (q) {
      const safeQ = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.$or = [
        { userName: { $regex: safeQ, $options: 'i' } },
        { userEmail: { $regex: safeQ, $options: 'i' } },
        { message: { $regex: safeQ, $options: 'i' } },
      ];
    }
    const skip = (page - 1) * limit;
    const [data, total, stats] = await Promise.all([
      this.feedbackModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      this.feedbackModel.countDocuments(filter),
      this.adminStats(),
    ]);
    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      stats,
    };
  }

  private async adminStats() {
    const [total, newCount, read, archived] = await Promise.all([
      this.feedbackModel.countDocuments({}),
      this.feedbackModel.countDocuments({ status: 'new' }),
      this.feedbackModel.countDocuments({ status: 'read' }),
      this.feedbackModel.countDocuments({ status: 'archived' }),
    ]);
    return { total, new: newCount, read, archived };
  }

  async setStatus(id: string, status: FeedbackStatus) {
    const fb = await this.feedbackModel.findById(id);
    if (!fb) throw new NotFoundException('Feedback not found');
    fb.status = status;
    fb.readAt = status === 'read' || status === 'archived' ? (fb.readAt ?? new Date()) : null;
    fb.archivedAt = status === 'archived' ? new Date() : null;
    await fb.save();
    return fb.toObject();
  }

  async remove(id: string) {
    const fb = await this.feedbackModel.findByIdAndDelete(id);
    if (!fb) throw new NotFoundException('Feedback not found');
    return { deleted: true };
  }
}
