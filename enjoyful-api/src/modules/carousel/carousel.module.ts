import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CarouselController } from './carousel.controller';
import { CarouselService } from './carousel.service';
import { Slide, SlideSchema } from './schemas/slide.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Slide.name, schema: SlideSchema }])],
  controllers: [CarouselController],
  providers: [CarouselService],
})
export class CarouselModule {}
