import {
  Controller,
  Post,
  Delete,
  Param,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { MediaService } from './media.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

@ApiTags('Media')
@Controller('media')
@UseGuards(RolesGuard)
@ApiBearerAuth()
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @Roles('admin')
  @ApiOperation({ summary: 'Upload a single image to Cloudinary (admin)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        folder: { type: 'string', example: 'enjoyful' },
      },
      required: ['file'],
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file provided');
    return this.mediaService.uploadImage(file);
  }

  @Delete('*publicId')
  @Roles('admin')
  @ApiOperation({
    summary: 'Delete an image from Cloudinary by publicId (admin). publicId may contain slashes.',
  })
  deleteImage(@Param('publicId') publicId: string) {
    const decoded = decodeURIComponent(publicId);
    return this.mediaService.deleteImage(decoded);
  }
}
