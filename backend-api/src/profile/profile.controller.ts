/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

import { ProfileService } from './profile.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('me')
  me(@Req() req: any) {
    return this.profileService.getProfile(req.user.id);
  }

  @Patch('me')
  update(
    @Req() req: any,
    @Body()
    body: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      school?: string;
      classLevel?: string;
      bio?: string;
      profileImage?: string;
    },
  ) {
    return this.profileService.updateProfile(req.user.id, body);
  }

  @Patch('password')
  password(
    @Req() req: any,
    @Body()
    body: {
      oldPassword: string;
      newPassword: string;
    },
  ) {
    return this.profileService.changePassword(
      req.user.id,
      body.oldPassword,
      body.newPassword,
    );
  }

  @Post('avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/profile',

        filename: (_req, file, callback) => {
          const uniqueName =
            `${Date.now()}-${Math.round(Math.random() * 1e9)}` +
            extname(file.originalname);

          callback(null, uniqueName);
        },
      }),

      limits: {
        fileSize: 5 * 1024 * 1024,
      },

      fileFilter: (_req, file, callback) => {
        if (!file.mimetype.startsWith('image/')) {
          return callback(
            new BadRequestException('Only image files are allowed'),
            false,
          );
        }

        callback(null, true);
      },
    }),
  )
  avatar(@Req() req: any, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Please upload an image');
    }

    const profileImage = `/uploads/profile/${file.filename}`;

    return this.profileService.updateAvatar(req.user.id, profileImage);
  }
}
