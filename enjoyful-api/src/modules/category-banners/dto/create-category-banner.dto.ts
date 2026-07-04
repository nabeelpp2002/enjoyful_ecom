import { IsString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryBannerDto {
  @ApiProperty({ enum: ['Glow', 'Baby', 'Daily', 'Fragrances', 'Home'] })
  @IsString()
  @IsIn(['Glow', 'Baby', 'Daily', 'Fragrances', 'Home'])
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
