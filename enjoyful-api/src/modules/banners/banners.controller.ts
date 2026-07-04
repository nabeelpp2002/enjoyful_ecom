import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { BannersService } from './banners.service';
import { CreateBannerDto } from './dto/create-banner.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe';

@ApiTags('Banners')
@Controller('banners')
@UseGuards(RolesGuard)
export class BannersController {
  constructor(private readonly bannersService: BannersService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get banners (public). Pass ?activeOnly=true to filter active/scheduled banners.' })
  @ApiQuery({ name: 'activeOnly', required: false, type: Boolean })
  findAll(@Query('activeOnly') activeOnly?: string) {
    return this.bannersService.findAll(activeOnly === 'true');
  }

  @Get('admin')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all banners unfiltered (admin)' })
  findAdminAll() {
    return this.bannersService.findAdminAll();
  }

  @Post()
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a banner (admin)' })
  create(@Body() dto: CreateBannerDto) {
    return this.bannersService.create(dto);
  }

  @Patch('reorder')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reorder banners by providing ordered array of IDs (admin)' })
  reorder(@Body() body: { ids: string[] }) {
    return this.bannersService.reorder(body.ids);
  }

  @Patch(':id')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a banner (admin)' })
  update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: Partial<CreateBannerDto>,
  ) {
    return this.bannersService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a banner (admin)' })
  remove(@Param('id', ParseObjectIdPipe) id: string) {
    return this.bannersService.remove(id);
  }
}
