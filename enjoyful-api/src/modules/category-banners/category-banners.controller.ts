import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CategoryBannersService } from './category-banners.service';
import { CreateCategoryBannerDto } from './dto/create-category-banner.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('Category Banners')
@Controller('category-banners')
@UseGuards(RolesGuard)
export class CategoryBannersController {
  constructor(private readonly service: CategoryBannersService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all category banners (public)' })
  findAll() {
    return this.service.findAll();
  }

  @Post()
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upsert a category banner (admin)' })
  upsert(@Body() dto: CreateCategoryBannerDto) {
    return this.service.upsert(dto);
  }
}
