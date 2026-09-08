/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, InternalServerErrorException } from '@nestjs/common';

import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    resourceType: 'image' | 'video' | 'raw',
  ) {
    if (!file) {
      throw new InternalServerErrorException('No file provided');
    }

    return new Promise<{
      secure_url: string;
      public_id: string;
      bytes: number;
      resource_type: string;
      format?: string;
    }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: resourceType,

          folder: 'erevna/resources',

          // Preserve the original filename as the basis of the
          // Cloudinary public ID while still preventing collisions.
          use_filename: true,
          unique_filename: true,

          // Preserve the original filename metadata.
          filename_override: file.originalname,
        },
        (error, result) => {
          if (error || !result) {
            reject(new InternalServerErrorException('File upload failed'));

            return;
          }

          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
            bytes: result.bytes,
            resource_type: result.resource_type,
            format: result.format,
          });
        },
      );

      uploadStream.end(file.buffer);
    });
  }

  async deleteFile(publicId: string, resourceType: 'image' | 'video' | 'raw') {
    if (!publicId) {
      return {
        result: 'not found',
      };
    }

    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
        type: 'upload',

        // Remove cached CDN copies of the deleted resource.
        invalidate: true,
      });

      /*
       * "not found" means the Cloudinary asset is already gone.
       * That is safe for our deletion workflow because the
       * database record can now be removed as well.
       */
      if (result.result !== 'ok' && result.result !== 'not found') {
        throw new InternalServerErrorException(
          `Cloudinary deletion failed: ${result.result}`,
        );
      }

      return result;
    } catch (error) {
      if (error instanceof InternalServerErrorException) {
        throw error;
      }

      throw new InternalServerErrorException('Cloudinary deletion failed');
    }
  }
}
