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
import { memoryStorage } from 'multer';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ProfileService } from './profile.service';

@Controller('profile')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('me')
  me(@Req() req: { user: { id: string } }) {
    return this.profileService.getProfile(req.user.id);
  }

  @Patch('me')
  update(@Req() req: { user: { id: string } }, @Body() body: UpdateProfileDto) {
    return this.profileService.updateProfile(req.user.id, body);
  }

  @Patch('password')
  password(
    @Req() req: { user: { id: string } },
    @Body() body: ChangePasswordDto,
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
      storage: memoryStorage(),

      limits: {
        fileSize: 5 * 1024 * 1024,
      },

      fileFilter: (_req, file, callback) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

        if (!allowedTypes.includes(file.mimetype)) {
          return callback(
            new BadRequestException(
              'Only JPEG, PNG, and WebP images are allowed',
            ),
            false,
          );
        }

        callback(null, true);
      },
    }),
  )
  avatar(
    @Req() req: { user: { id: string } },
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Please upload a JPEG, PNG, or WebP image');
    }

    return this.profileService.updateAvatar(req.user.id, file);
  }
}
