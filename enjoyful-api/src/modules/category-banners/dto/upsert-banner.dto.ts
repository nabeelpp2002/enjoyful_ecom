import { IsString, IsOptional, IsIn } from 'class-validator';

export class UpsertCategoryBannerDto {
  @IsString() @IsIn(['Glow', 'Baby', 'Daily', 'Fragrances', 'Home']) category: string;
  @IsOptional() @IsString() desktopImageUrl?: string;
  @IsOptional() @IsString() mobileImageUrl?: string;
}
