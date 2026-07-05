import { IsString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CATEGORY_BANNER_CATEGORIES } from '../category-banner-categories';

export class CreateCategoryBannerDto {
  @ApiProperty({ enum: CATEGORY_BANNER_CATEGORIES })
  @IsString()
  @IsIn(CATEGORY_BANNER_CATEGORIES)
  category: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  desktopImageUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mobileImageUrl?: string;
}
