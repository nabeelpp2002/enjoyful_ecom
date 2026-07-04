import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Banner, BannerDocument } from './schemas/banner.schema';
import { CreateBannerDto } from './dto/create-banner.dto';

@Injectable()
export class BannersService {
  constructor(
    @InjectModel(Banner.name) private bannerModel: Model<BannerDocument>,
  ) {}

  async findAll(activeOnly = false): Promise<BannerDocument[]> {
    const now = new Date();
    const filter: Record<string, unknown> = {};

    if (activeOnly) {
      filter.isActive = true;
      filter.$and = [
        {
          $or: [
            { scheduleStart: { $exists: false } },
            { scheduleStart: null },
            { scheduleStart: { $lte: now } },
          ],
        },
        {
          $or: [
            { scheduleEnd: { $exists: false } },
            { scheduleEnd: null },
            { scheduleEnd: { $gte: now } },
          ],
        },
      ];
    }

    return this.bannerModel
      .find(filter)
      .sort({ slot: 1, sortOrder: 1 })
      .lean() as unknown as BannerDocument[];
  }

  async findAdminAll(): Promise<BannerDocument[]> {
    return this.bannerModel.find().lean() as unknown as BannerDocument[];
  }

  async create(dto: CreateBannerDto): Promise<BannerDocument> {
    return this.bannerModel.create(dto);
  }

  async update(id: string, dto: Partial<CreateBannerDto>): Promise<BannerDocument> {
    const banner = await this.bannerModel
      .findByIdAndUpdate(id, dto, { new: true })
      .lean();
    if (!banner) throw new NotFoundException('Banner not found');
    return banner as unknown as BannerDocument;
  }

  async remove(id: string): Promise<{ deleted: boolean }> {
    const banner = await this.bannerModel.findByIdAndDelete(id).lean();
    if (!banner) throw new NotFoundException('Banner not found');
    return { deleted: true };
  }

  async reorder(ids: string[]): Promise<{ updated: number }> {
    const operations = ids.map((id, index) => ({
      updateOne: {
        filter: { _id: id },
        update: { $set: { sortOrder: index } },
      },
    }));
    const result = await this.bannerModel.bulkWrite(operations);
    return { updated: result.modifiedCount };
  }
}
