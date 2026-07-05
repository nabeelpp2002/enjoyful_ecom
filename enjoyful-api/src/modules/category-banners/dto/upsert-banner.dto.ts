import { IsString, IsOptional, IsIn } from 'class-validator';

export class UpsertCategoryBannerDto {
  @IsString() @IsIn(['Glow', 'Baby', 'Daily', 'Fragrances', 'Home Care']) category: string;
  @IsOptional() @IsString() desktopImageUrl?: string;
  @IsOptional() @IsString() mobileImageUrl?: string;
}
