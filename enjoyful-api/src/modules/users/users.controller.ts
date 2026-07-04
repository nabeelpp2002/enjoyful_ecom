import { Controller, Get, Patch, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import type { UserSort } from './users.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe';

@ApiTags('Users')
@Controller('users')
@UseGuards(RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private service: UsersService) {}

  @Get()
  @Roles('admin')
  @ApiOperation({ summary: 'List users (admin, paginated, searchable)' })
  list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('q') q?: string,
    @Query('sort') sort?: UserSort,
  ) {
    return this.service.listAdmin(
      page ? Math.max(1, parseInt(page, 10)) : 1,
      limit ? Math.min(100, Math.max(1, parseInt(limit, 10))) : 20,
      q?.trim() ?? '',
      sort ?? 'recent',
    );
  }

  @Get(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Get a user with recent orders + reviews (admin)' })
  getOne(@Param('id', ParseObjectIdPipe) id: string) {
    return this.service.getOne(id);
  }

  @Patch(':id/status')
  @Roles('admin')
  @ApiOperation({ summary: 'Activate or deactivate a user (admin)' })
  setStatus(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() body: { isActive: boolean },
  ) {
    return this.service.setActive(id, body.isActive);
  }
}
