import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(RolesGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Place an order from the current cart (authenticated)' })
  createFromCart(
    @CurrentUser() user: { id: string; role: string },
    @Body() dto: CreateOrderDto,
  ) {
    return this.ordersService.createFromCart(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List orders — admin sees all, customer sees own' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @CurrentUser() user: { id: string; role: string },
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.ordersService.findAll(user.id, user.role, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single order by ID (admin sees any, customer sees own)' })
  findOne(
    @CurrentUser() user: { id: string; role: string },
    @Param('id', ParseObjectIdPipe) id: string,
  ) {
    return this.ordersService.findOne(id, user.id, user.role);
  }

  @Patch(':id/status')
  @Roles('admin')
  @ApiOperation({ summary: 'Update order status (admin)' })
  updateStatus(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.ordersService.updateStatus(id, dto.status);
  }
}
