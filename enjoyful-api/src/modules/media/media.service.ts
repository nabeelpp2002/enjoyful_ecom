import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

export interface UploadResult {
  url: string;
  publicId: string;
  width: number;
  height: number;
}

@Injectable()
export class MediaService {
  async uploadImage(
    file: Express.Multer.File,
    folder = 'enjoyful',
  ): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          transformation: [
            {
              quality: 'auto:best',
              fetch_format: 'auto',
              width: 2560,
              crop: 'limit',
            },
          ],
        },
        (error, result) => {
          if (error || !result) {
            return reject(
              new InternalServerErrorException(
                error?.message ?? 'Cloudinary upload failed',
              ),
            );
          }
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
          });
        },
      );

      uploadStream.end(file.buffer);
    });
  }

  async deleteImage(publicId: string): Promise<{ result: string }> {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  }

  async uploadMultiple(
    files: Express.Multer.File[],
    folder = 'enjoyful',
  ): Promise<UploadResult[]> {
    return Promise.all(files.map((file) => this.uploadImage(file, folder)));
  }
}
