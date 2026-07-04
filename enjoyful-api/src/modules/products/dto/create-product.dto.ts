import {
  IsString, IsNumber, IsOptional, IsBoolean, IsArray, Min, IsIn,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class ExternalBuyLinkDto {
  @IsOptional() @IsString() url?: string;
  @IsOptional() @IsBoolean() visible?: boolean;
}

export class ExternalBuyLinksDto {
  @IsOptional() @ValidateNested() @Type(() => ExternalBuyLinkDto) amazon?: ExternalBuyLinkDto;
  @IsOptional() @ValidateNested() @Type(() => ExternalBuyLinkDto) talabat?: ExternalBuyLinkDto;
  @IsOptional() @ValidateNested() @Type(() => ExternalBuyLinkDto) carrefour?: ExternalBuyLinkDto;
}

export class CreateProductDto {
  @ApiProperty() @IsString() name!: string;
  @ApiProperty() @IsString() category!: string;
  @ApiPropertyOptional() @IsOptional() @IsString() subcategory?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() productType?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() tagline?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() brand?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() slug?: string;

  @ApiProperty() @Type(() => Number) @IsNumber() @Min(0) price!: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(0) compareAtPrice?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(0) originalPrice?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(0) discountPct?: number;
  @ApiPropertyOptional({ enum: ['AED', 'GBP'] })
  @IsOptional() @IsIn(['AED', 'GBP']) currency?: string;

  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) benefits?: string[];
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) ingredients?: string[];
  @ApiPropertyOptional() @IsOptional() @IsString() howToUse?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) skinType?: string[];
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) highlights?: string[];
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) suitableFor?: string[];

  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(0) stock?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(0) rating?: number;
  @ApiPropertyOptional() @IsOptional() @Type(() => Number) @IsNumber() @Min(0) reviews?: number;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isFeatured?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isActive?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() isHidden?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() onSale?: boolean;
  @ApiPropertyOptional() @IsOptional() @IsBoolean() bestDeal?: boolean;

  @ApiPropertyOptional() @IsOptional() @IsString() image?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() hoverImage?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) images?: string[];

  @ApiPropertyOptional({ type: ExternalBuyLinksDto })
  @IsOptional() @ValidateNested() @Type(() => ExternalBuyLinksDto)
  externalBuyLinks?: ExternalBuyLinksDto;

  @ApiPropertyOptional() @IsOptional() @IsString() productFamily?: string;

  // ── Rich Catalog Fields ──────────────────────────────────────────────────────
  @ApiPropertyOptional() @IsOptional() @IsString() productCode?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() skuCode?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() variant?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() unitType?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() mockupStatus?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() size?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() itemForm?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() shortDescription?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) activeIngredients?: string[];
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) features?: string[];
  @ApiPropertyOptional() @IsOptional() @IsString() targetUse?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) hairType?: string[];
  @ApiPropertyOptional() @IsOptional() @IsString() scent?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() texture?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() recommendedUsage?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() precautions?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() seoTitle?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() metaDescription?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) keywords?: string[];
  @ApiPropertyOptional() @IsOptional() @IsArray() @IsString({ each: true }) searchTags?: string[];
  @ApiPropertyOptional() @IsOptional() @IsString() barcode?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() shelfLife?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() storageInstructions?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() countryOfOrigin?: string;
}
