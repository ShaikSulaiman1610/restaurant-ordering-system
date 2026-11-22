
import {
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import type { UploadApiResponse } from 'cloudinary';
import { PassThrough } from 'node:stream';

import { CloudinaryService } from './cloudinary.service';

describe('CloudinaryService', () => {
  let service: CloudinaryService;

  const folder = 'restaurant-ordering/restaurant-covers';
  const publicId =
    'restaurant-ordering/restaurant-covers/test-image';

  const createFile = (
    overrides: Partial<Express.Multer.File> = {},
  ): Express.Multer.File =>
    ({
      fieldname: 'file',
      originalname: 'restaurant.png',
      encoding: '7bit',
      mimetype: 'image/png',
      buffer: Buffer.from('test-image-data'),
      size: 15,
      destination: '',
      filename: '',
      path: '',
      stream: new PassThrough(),
      ...overrides,
    }) as Express.Multer.File;

  beforeEach(() => {
    jest.restoreAllMocks();

    const configService = {
      getOrThrow: jest.fn((key: string) => {
        const values: Record<string, string> = {
          CLOUDINARY_CLOUD_NAME: 'test-cloud',
          CLOUDINARY_API_KEY: 'test-key',
          CLOUDINARY_API_SECRET: 'test-secret',
        };

        return values[key];
      }),
    } as unknown as ConfigService;

    service = new CloudinaryService(configService);

    jest.spyOn(Logger.prototype, 'error').mockImplementation(
      () => undefined,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('uploadImage', () => {
    it('rejects a missing image', async () => {
      await expect(
        service.uploadImage(
          undefined as unknown as Express.Multer.File,
          folder,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects an empty image', async () => {
      await expect(
        service.uploadImage(
          createFile({
            buffer: Buffer.alloc(0),
            size: 0,
          }),
          folder,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects unsupported image formats', async () => {
      await expect(
        service.uploadImage(
          createFile({ mimetype: 'application/pdf' }),
          folder,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects images larger than 5 MB', async () => {
      await expect(
        service.uploadImage(
          createFile({ size: 5 * 1024 * 1024 + 1 }),
          folder,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects an invalid Cloudinary folder', async () => {
      await expect(
        service.uploadImage(
          createFile(),
          '../invalid-folder',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('uploads an image and returns its URL and public ID', async () => {
      const response = {
        secure_url: 'https://res.cloudinary.com/test/image.png',
        public_id: publicId,
      } as UploadApiResponse;

      const uploadSpy = jest
        .spyOn(cloudinary.uploader, 'upload_stream')
        .mockImplementation(
          ((options: unknown, callback: Function) => {
            const stream = new PassThrough();

            stream.on('finish', () => {
              callback(undefined, response);
            });

            return stream;
          }) as typeof cloudinary.uploader.upload_stream,
        );

      await expect(
        service.uploadImage(createFile(), folder),
      ).resolves.toEqual({
        url: response.secure_url,
        publicId: response.public_id,
      });

      expect(uploadSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          folder,
          resource_type: 'image',
          overwrite: false,
        }),
        expect.any(Function),
      );
    });

    it('handles a Cloudinary upload failure', async () => {
      jest
        .spyOn(cloudinary.uploader, 'upload_stream')
        .mockImplementation(
          ((options: unknown, callback: Function) => {
            const stream = new PassThrough();

            stream.on('finish', () => {
              callback(new Error('Upload rejected'), undefined);
            });

            return stream;
          }) as typeof cloudinary.uploader.upload_stream,
        );

      await expect(
        service.uploadImage(createFile(), folder),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('handles an empty Cloudinary upload response', async () => {
      jest
        .spyOn(cloudinary.uploader, 'upload_stream')
        .mockImplementation(
          ((options: unknown, callback: Function) => {
            const stream = new PassThrough();

            stream.on('finish', () => {
              callback(undefined, undefined);
            });

            return stream;
          }) as typeof cloudinary.uploader.upload_stream,
        );

      await expect(
        service.uploadImage(createFile(), folder),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('deleteImage', () => {
    it('rejects an invalid public ID', async () => {
      await expect(
        service.deleteImage('../invalid'),
      ).rejects.toThrow(BadRequestException);
    });

    it('deletes an existing image', async () => {
      const destroySpy = jest
        .spyOn(cloudinary.uploader, 'destroy')
        .mockResolvedValue({ result: 'ok' });

      await expect(
        service.deleteImage(publicId),
      ).resolves.toBeUndefined();

      expect(destroySpy).toHaveBeenCalledWith(
        publicId,
        { resource_type: 'image' },
      );
    });

    it('accepts an already deleted image', async () => {
      jest
        .spyOn(cloudinary.uploader, 'destroy')
        .mockResolvedValue({ result: 'not found' });

      await expect(
        service.deleteImage(publicId),
      ).resolves.toBeUndefined();
    });

    it('handles a Cloudinary deletion failure', async () => {
      jest
        .spyOn(cloudinary.uploader, 'destroy')
        .mockRejectedValue(new Error('Cloudinary unavailable'));

      await expect(
        service.deleteImage(publicId),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('handles an unexpected deletion result', async () => {
      jest
        .spyOn(cloudinary.uploader, 'destroy')
        .mockResolvedValue({ result: 'error' });

      await expect(
        service.deleteImage(publicId),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });
});
