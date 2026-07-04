import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import slugify from 'slugify';
import { Category, CategoryDocument } from './schemas/category.schema';
import { CreateCategoryDto } from './dto/create-category.dto';

@Injectable()
export class CategoriesService {
  constructor(@InjectModel(Category.name) private categoryModel: Model<CategoryDocument>) {}

  findAll() {
    return this.categoryModel.find({ isActive: true }).sort({ sortOrder: 1 }).lean();
  }

  async findBySlug(slug: string) {
    const cat = await this.categoryModel.findOne({ slug }).lean();
    if (!cat) throw new NotFoundException('Category not found');
    return cat;
  }

  async create(dto: CreateCategoryDto) {
    const slug = await this.generateSlug(dto.name);
    return this.categoryModel.create({ ...dto, slug });
  }

  async update(id: string, dto: Partial<CreateCategoryDto>) {
    const update: Partial<CreateCategoryDto & { slug: string }> = { ...dto };
    if (dto.name) update.slug = await this.generateSlug(dto.name, id);
    const cat = await this.categoryModel.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!cat) throw new NotFoundException('Category not found');
    return cat;
  }

  async remove(id: string) {
    const cat = await this.categoryModel.findByIdAndDelete(id).lean();
    if (!cat) throw new NotFoundException('Category not found');
    return { deleted: true };
  }

  private async generateSlug(name: string, excludeId?: string): Promise<string> {
    const base = slugify(name, { lower: true, strict: true });
    let slug = base;
    let counter = 2;
    while (true) {
      const query = this.categoryModel.findOne({ slug });
      if (excludeId) query.where('_id').ne(excludeId);
      const exists = await query.lean();
      if (!exists) break;
      slug = `${base}-${counter++}`;
    }
    return slug;
  }
}
