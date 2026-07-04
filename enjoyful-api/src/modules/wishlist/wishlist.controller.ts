import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { WishlistService } from './wishlist.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe';

@ApiTags('Wishlist')
@Controller('wishlist')
@UseGuards(RolesGuard)
@ApiBearerAuth()
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @Get()
  @ApiOperation({ summary: 'Get the current user\'s wishlist' })
  getWishlist(@CurrentUser() user: { id: string }) {
    return this.wishlistService.getWishlist(user.id);
  }

  @Post(':productId')
  @ApiOperation({ summary: 'Add a product to the wishlist' })
  addProduct(
    @CurrentUser() user: { id: string },
    @Param('productId', ParseObjectIdPipe) productId: string,
  ) {
    return this.wishlistService.addProduct(user.id, productId);
  }

  @Delete(':productId')
  @ApiOperation({ summary: 'Remove a product from the wishlist' })
  removeProduct(
    @CurrentUser() user: { id: string },
    @Param('productId', ParseObjectIdPipe) productId: string,
  ) {
    return this.wishlistService.removeProduct(user.id, productId);
  }
}
