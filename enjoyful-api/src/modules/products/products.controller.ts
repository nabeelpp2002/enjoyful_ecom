import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseGuards, UseInterceptors, UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe';

@ApiTags('Products')
@Controller('products')
@UseGuards(RolesGuard)
export class ProductsController {
  constructor(private service: ProductsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List products with filtering and pagination' })
  findAll(@Query() query: ProductQueryDto) { return this.service.findAll(query); }

  @Get('admin/all')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all products for admin (includes hidden/inactive)' })
  findAllAdmin() { return this.service.findAllAdmin(); }

  @Public()
  @Get('quick-search')
  @ApiOperation({ summary: 'Fast prefix search for the search overlay' })
  quickSearch(@Query('q') q: string, @Query('limit') limit?: string) {
    const n = limit ? Math.min(20, Math.max(1, parseInt(limit, 10))) : 8;
    return this.service.quickSearch(q, n);
  }

  @Public()
  @Get('family/:family')
  @ApiOperation({ summary: 'Get all size variants in a product family' })
  findFamily(@Param('family') family: string) { return this.service.findFamily(family); }

  @Public()
  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get product by slug' })
  findBySlug(@Param('slug') slug: string) { return this.service.findBySlug(slug); }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  findOne(@Param('id', ParseObjectIdPipe) id: string) { return this.service.findOne(id); }

  @Post()
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a product (admin)' })
  create(@Body() dto: CreateProductDto) { return this.service.create(dto); }

  @Patch(':id')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a product (admin)' })
  update(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: Partial<CreateProductDto>,
  ) { return this.service.update(id, dto); }

  @Patch(':id/visibility')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Toggle product visibility (admin)' })
  updateVisibility(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body('isHidden') isHidden: boolean,
  ) { return this.service.updateVisibility(id, isHidden); }

  @Delete(':id')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Soft-delete a product (admin)' })
  remove(@Param('id', ParseObjectIdPipe) id: string) { return this.service.softDelete(id); }

  @Post('bulk-import/json')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bulk import products from JSON array (admin)' })
  bulkImportJson(@Body() body: { products: CreateProductDto[] }) {
    return this.service.bulkImportJson(body.products);
  }

  @Post('bulk-import/csv')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Bulk import products from CSV file (admin)' })
  @UseInterceptors(FileInterceptor('file'))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  bulkImportCsv(@UploadedFile() file: any) {
    return this.service.bulkImportCsv(file.buffer);
  }

  // Returns parsed (but NOT saved) products from the Enjoyful Life XLSX catalog spreadsheet.
  // Admin reviews the result and imports via bulk-import/json.
  @Post('parse-xlsx')
  @Roles('admin')
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Parse Enjoyful Life XLSX catalog — returns mapped DTOs for review (admin)' })
  @UseInterceptors(FileInterceptor('file'))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parseXlsx(@UploadedFile() file: any) {
    return this.service.parseXlsxBuffer(file.buffer);
  }
}
