import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Slide, SlideDocument } from './schemas/slide.schema';
import { CreateSlideDto } from './dto/create-slide.dto';

@Injectable()
export class CarouselService {
  constructor(@InjectModel(Slide.name) private slideModel: Model<SlideDocument>) {}

  async findAll(): Promise<SlideDocument[]> {
    return this.slideModel.find().sort({ order: 1 }).lean() as unknown as SlideDocument[];
  }

  async create(dto: CreateSlideDto): Promise<SlideDocument> {
    return this.slideModel.create(dto);
  }

  async update(id: string, dto: Partial<CreateSlideDto>): Promise<SlideDocument> {
    const slide = await this.slideModel.findByIdAndUpdate(id, dto, { new: true }).lean();
    if (!slide) throw new NotFoundException('Slide not found');
    return slide as unknown as SlideDocument;
  }

  async remove(id: string): Promise<{ deleted: boolean }> {
    const slide = await this.slideModel.findByIdAndDelete(id).lean();
    if (!slide) throw new NotFoundException('Slide not found');
    return { deleted: true };
  }
}
