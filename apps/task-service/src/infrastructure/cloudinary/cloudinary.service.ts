
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import type { UploadApiResponse } from 'cloudinary';
import { Readable } from 'node:stream';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(private readonly configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.getOrThrow<string>(
        'CLOUDINARY_CLOUD_NAME',
      ),
      api_key: this.configService.getOrThrow<string>(
        'CLOUDINARY_API_KEY',
      ),
      api_secret: this.configService.getOrThrow<string>(
        'CLOUDINARY_API_SECRET',
      ),
      secure: true,
    });
  }

  async uploadImage(
    file: Express.Multer.File,
    folder: string,
  ): Promise<{ url: string; publicId: string }> {
    if (!file?.buffer || file.size === 0) {
      throw new BadRequestException('Image file is required');
    }

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Only JPEG, PNG and WebP images are allowed',
      );
    }

    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      throw new BadRequestException(
        'Image must not exceed 5 MB',
      );
    }

    if (!/^restaurant-ordering\/[a-z0-9-]+$/.test(folder)) {
      throw new BadRequestException('Invalid image folder');
    }

    try {
      const result = await new Promise<UploadApiResponse>(
        (resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder,
              resource_type: 'image',
              overwrite: false,
            },
            (error, uploaded) => {
              if (error) {
                reject(error);
                return;
              }

              if (!uploaded) {
                reject(
                  new Error('Cloudinary returned no upload result'),
                );
                return;
              }

              resolve(uploaded);
            },
          );

          Readable.from(file.buffer).pipe(uploadStream);
        },
      );

      return {
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error: unknown) {
      const details =
        error instanceof Error
          ? error.message
          : typeof error === 'object' && error !== null
            ? JSON.stringify(error)
            : String(error);

      this.logger.error(
        `Cloudinary image upload failed: ${details}`,
      );

      throw new InternalServerErrorException(
        'Image upload failed',
      );
    }
  }

  async deleteImage(publicId: string): Promise<void> {
    if (
      !publicId ||
      !/^restaurant-ordering\/[a-z0-9-]+\/[a-zA-Z0-9_-]+$/.test(
        publicId,
      )
    ) {
      throw new BadRequestException(
        'Invalid image public ID',
      );
    }

    try {
      const result = await cloudinary.uploader.destroy(
        publicId,
        { resource_type: 'image' },
      );

      if (
        result.result !== 'ok' &&
        result.result !== 'not found'
      ) {
        throw new Error(
          `Cloudinary deletion failed: ${result.result}`,
        );
      }
    } catch (error: unknown) {
      const details =
        error instanceof Error
          ? error.message
          : typeof error === 'object' && error !== null
            ? JSON.stringify(error)
            : String(error);

      this.logger.error(
        `Cloudinary image deletion failed: ${details}`,
      );

      throw new InternalServerErrorException(
        'Image deletion failed',
      );
    }
  }
}
