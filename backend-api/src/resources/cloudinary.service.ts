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
    }>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: resourceType,
          folder: 'erevna/resources',
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
          });
        },
      );

      uploadStream.end(file.buffer);
    });
  }

  async deleteFile(publicId: string, resourceType: 'image' | 'video' | 'raw') {
    return cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });
  }
}
