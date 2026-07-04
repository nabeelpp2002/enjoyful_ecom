import { IsInt, IsString, IsOptional, MaxLength, MinLength, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFeedbackDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt() @Min(0) @Max(5)
  rating?: number;

  @IsString() @MinLength(2) @MaxLength(2000)
  message!: string;
}
