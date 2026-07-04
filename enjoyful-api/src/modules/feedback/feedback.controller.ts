import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { FeedbackService } from './feedback.service';
import { CreateFeedbackDto } from './dto/create-feedback.dto';
import type { FeedbackStatus } from './schemas/feedback.schema';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe';

@ApiTags('Feedback')
@Controller('feedback')
@UseGuards(RolesGuard)
export class FeedbackController {
  constructor(private service: FeedbackService) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Submit customer feedback (authenticated)' })
  create(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateFeedbackDto,
  ) {
    return this.service.create(user.id, dto);
  }

  @Get('admin/all')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all customer feedback (admin)' })
  listAdmin(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: 'all' | FeedbackStatus,
    @Query('q') q?: string,
  ) {
    return this.service.listAdmin(
      page ? Math.max(1, parseInt(page, 10)) : 1,
      limit ? Math.min(100, Math.max(1, parseInt(limit, 10))) : 20,
      status ?? 'all',
      q?.trim() ?? '',
    );
  }

  @Patch(':id/status')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update feedback status (admin: new/read/archived)' })
  setStatus(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() body: { status: FeedbackStatus },
  ) {
    return this.service.setStatus(id, body.status);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete feedback (admin)' })
  remove(@Param('id', ParseObjectIdPipe) id: string) {
    return this.service.remove(id);
  }
}
