import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CategoryBannersController } from './category-banners.controller';
import { CategoryBannersService } from './category-banners.service';
import { CategoryBanner, CategoryBannerSchema } from './schemas/category-banner.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CategoryBanner.name, schema: CategoryBannerSchema },
    ]),
  ],
  controllers: [CategoryBannersController],
  providers: [CategoryBannersService],
})
export class CategoryBannersModule {}
