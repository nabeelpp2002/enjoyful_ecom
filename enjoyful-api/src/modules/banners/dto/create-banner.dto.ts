import {
  IsString,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsIn,
  IsDateString,
  ValidateNested,
  IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class BannerImageVariantDto {
  @ApiProperty({ description: 'Public URL of the image' })
  @IsString()
  url: string;

  @ApiProperty({ description: 'Cloudinary public ID' })
  @IsString()
  publicId: string;
}

class BannerImageDto {
  @ApiPropertyOptional({ type: BannerImageVariantDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => BannerImageVariantDto)
  desktop?: BannerImageVariantDto;

  @ApiPropertyOptional({ type: BannerImageVariantDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => BannerImageVariantDto)
  mobile?: BannerImageVariantDto;
}

export class CreateBannerDto {
  @ApiProperty({ enum: ['hero', 'category-top', 'mid-page', 'popup'] })
  @IsIn(['hero', 'category-top', 'mid-page', 'popup'])
  slot: string;

  @ApiProperty()
  @IsString()
  title: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subtitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ctaText?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ctaUrl?: string;

  @ApiPropertyOptional({ type: BannerImageDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => BannerImageDto)
  image?: BannerImageDto;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  sortOrder?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  scheduleStart?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  scheduleEnd?: string;
}
