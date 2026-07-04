import { IsString, IsOptional, IsIn, IsObject } from 'class-validator';

const EVENT_TYPES = [
  'page_view',
  'product_view',
  'product_click',
  'add_to_cart',
  'add_to_wishlist',
  'search',
  'checkout_initiated',
];

export class TrackEventDto {
  @IsString() @IsIn(EVENT_TYPES) type: string;
  @IsString() sessionId: string;
  @IsOptional() @IsString() productId?: string;
  @IsOptional() @IsString() productName?: string;
  @IsOptional() @IsString() path?: string;
  @IsOptional() @IsString() query?: string;
  @IsOptional() @IsString() referrer?: string;
  @IsOptional() @IsString() device?: string;
  @IsOptional() @IsObject() metadata?: Record<string, unknown>;
}
