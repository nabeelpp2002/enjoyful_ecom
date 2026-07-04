import { IsInt, IsString, IsOptional, MaxLength, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateReviewDto {
  @IsString() productId!: string;

  @Type(() => Number)
  @IsInt() @Min(1) @Max(5)
  rating!: number;

  @IsOptional() @IsString() @MaxLength(120) title?: string;

  @IsString() @MaxLength(2000) comment!: string;
}

export class UpdateReviewDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(5) rating?: number;
  @IsOptional() @IsString() @MaxLength(120) title?: string;
  @IsOptional() @IsString() @MaxLength(2000) comment?: string;
}
