import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import type { ReviewSort } from './reviews.service';
import { CreateReviewDto, UpdateReviewDto } from './dto/create-review.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe';

@ApiTags('Reviews')
@Controller('reviews')
@UseGuards(RolesGuard)
export class ReviewsController {
  constructor(private service: ReviewsService) {}

  @Public()
  @Get('product/:productId')
  @ApiOperation({ summary: 'List reviews for a product (public, paginated)' })
  list(
    @Param('productId', ParseObjectIdPipe) productId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sort') sort?: ReviewSort,
  ) {
    return this.service.listForProduct(
      productId,
      page ? Math.max(1, parseInt(page, 10)) : 1,
      limit ? Math.min(50, Math.max(1, parseInt(limit, 10))) : 10,
      sort ?? 'recent',
    );
  }

  @Public()
  @Get('product/:productId/summary')
  @ApiOperation({ summary: 'Rating summary (avg + distribution) for a product' })
  summary(@Param('productId', ParseObjectIdPipe) productId: string) {
    return this.service.summaryFor(productId);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a review (authenticated, one per product per user)' })
  create(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateReviewDto,
  ) {
    return this.service.create(user.id, dto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update own review' })
  update(
    @CurrentUser() user: { id: string },
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateReviewDto,
  ) {
    return this.service.update(id, user.id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a review (own, or any if admin)' })
  remove(
    @CurrentUser() user: { id: string; role: string },
    @Param('id', ParseObjectIdPipe) id: string,
  ) {
    return this.service.remove(id, user.id, user.role === 'admin');
  }

  @Get('admin/all')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all reviews including hidden + deleted (admin)' })
  listAdmin(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: 'all' | 'visible' | 'hidden' | 'deleted',
    @Query('q') q?: string,
  ) {
    return this.service.listAdmin(
      page ? Math.max(1, parseInt(page, 10)) : 1,
      limit ? Math.min(100, Math.max(1, parseInt(limit, 10))) : 20,
      status ?? 'all',
      q?.trim() ?? '',
    );
  }

  @Patch(':id/visibility')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Hide/show a review (admin moderation)' })
  setVisibility(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() body: { hidden: boolean },
  ) {
    return this.service.setHidden(id, body.hidden);
  }

  @Patch(':id/archive')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft-delete (archive) or restore a review (admin)' })
  setArchive(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() body: { deleted: boolean },
  ) {
    return this.service.setDeleted(id, body.deleted);
  }
}
