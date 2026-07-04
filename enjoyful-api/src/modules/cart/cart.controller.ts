import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddCartItemDto, MergeCartDto, UpdateCartItemDto } from './dto/cart-item.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe';

@ApiTags('Cart')
@Controller('cart')
@UseGuards(RolesGuard)
@ApiBearerAuth()
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Get the current user\'s cart' })
  getCart(@CurrentUser() user: { id: string }) {
    return this.cartService.getCart(user.id);
  }

  @Post('items')
  @ApiOperation({ summary: 'Add an item to the cart' })
  addItem(
    @CurrentUser() user: { id: string },
    @Body() dto: AddCartItemDto,
  ) {
    return this.cartService.addItem(user.id, dto);
  }

  @Patch('items/:productId')
  @ApiOperation({ summary: 'Update the quantity of a cart item' })
  updateItem(
    @CurrentUser() user: { id: string },
    @Param('productId', ParseObjectIdPipe) productId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem(user.id, productId, dto);
  }

  @Delete('items/:productId')
  @ApiOperation({ summary: 'Remove an item from the cart' })
  removeItem(
    @CurrentUser() user: { id: string },
    @Param('productId', ParseObjectIdPipe) productId: string,
  ) {
    return this.cartService.removeItem(user.id, productId);
  }

  @Delete()
  @ApiOperation({ summary: 'Clear all items from the cart' })
  clearCart(@CurrentUser() user: { id: string }) {
    return this.cartService.clearCart(user.id);
  }

  @Post('merge')
  @ApiOperation({ summary: 'Merge guest cart items into the authenticated user\'s cart' })
  mergeCarts(
    @CurrentUser() user: { id: string },
    @Body() dto: MergeCartDto,
  ) {
    return this.cartService.mergeCarts(user.id, dto.items);
  }
}
