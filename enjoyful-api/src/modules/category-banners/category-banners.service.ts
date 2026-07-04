import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CategoryBanner, CategoryBannerDocument } from './schemas/category-banner.schema';
import { CreateCategoryBannerDto } from './dto/create-category-banner.dto';

@Injectable()
export class CategoryBannersService {
  constructor(
    @InjectModel(CategoryBanner.name)
    private model: Model<CategoryBannerDocument>,
  ) {}

  async findAll(): Promise<CategoryBannerDocument[]> {
    return this.model.find().sort({ category: 1 }).lean() as unknown as CategoryBannerDocument[];
  }

  async upsert(dto: CreateCategoryBannerDto): Promise<CategoryBannerDocument> {
    const { category, ...rest } = dto;
    return this.model
      .findOneAndUpdate(
        { category },
        { $set: { category, ...rest } },
        { upsert: true, new: true },
      )
      .lean() as unknown as CategoryBannerDocument;
  }
}
