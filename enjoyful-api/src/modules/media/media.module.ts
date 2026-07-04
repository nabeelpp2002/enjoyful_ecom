import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import { MediaController } from './media.controller';
import { MediaService } from './media.service';

export const CLOUDINARY = 'CLOUDINARY';

const CloudinaryProvider = {
  provide: CLOUDINARY,
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    cloudinary.config({
      cloud_name: configService.getOrThrow<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: configService.getOrThrow<string>('CLOUDINARY_API_KEY'),
      api_secret: configService.getOrThrow<string>('CLOUDINARY_API_SECRET'),
    });
    return cloudinary;
  },
};

@Module({
  imports: [ConfigModule],
  controllers: [MediaController],
  providers: [CloudinaryProvider, MediaService],
  exports: [MediaService, CLOUDINARY],
})
export class MediaModule {}
