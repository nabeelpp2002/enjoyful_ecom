import { IsString, IsOptional, IsBoolean, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSlideDto {
  @IsString() title: string;
  @IsOptional() @IsString() subtitle?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() buttonText?: string;
  @IsOptional() @IsString() buttonLink?: string;

  @IsOptional() @IsString() desktopImageUrl?: string;
  @IsOptional() @IsString() mobileImageUrl?: string;
  @IsOptional() @IsString() imageUrl?: string;

  @IsOptional() @Type(() => Number) @IsNumber() @Min(0) order?: number;
  @IsOptional() @IsBoolean() isActive?: boolean;
}
