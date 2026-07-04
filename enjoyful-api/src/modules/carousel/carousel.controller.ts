import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CarouselService } from './carousel.service';
import { CreateSlideDto } from './dto/create-slide.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe';

@ApiTags('Carousel')
@Controller('carousel')
@UseGuards(RolesGuard)
export class CarouselController {
  constructor(private service: CarouselService) {}

  @Public()
  @Get()
  findAll() { return this.service.findAll(); }

  @Post()
  @Roles('admin')
  @ApiBearerAuth()
  create(@Body() dto: CreateSlideDto) { return this.service.create(dto); }

  @Put(':id')
  @Roles('admin')
  @ApiBearerAuth()
  update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: Partial<CreateSlideDto>,
  ) { return this.service.update(id, dto); }

  @Delete(':id')
  @Roles('admin')
  @ApiBearerAuth()
  remove(@Param('id', ParseObjectIdPipe) id: string) { return this.service.remove(id); }
}
