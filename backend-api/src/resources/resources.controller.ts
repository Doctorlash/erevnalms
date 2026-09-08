import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  Post,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';

import { ResourcesService } from './resources.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('resources')
@UseGuards(JwtAuthGuard)
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  /**
   * ============================================================
   * CREATE RESOURCE
   * ============================================================
   *
   * Teachers and admins can upload resources.
   *
   * Maximum upload size:
   * 100 MB
   *
   * The service performs the final MIME/type validation.
   */
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 100 * 1024 * 1024,
      },

      fileFilter: (req, file, callback) => {
        const allowedMimeTypes = [
          'application/pdf',

          // Video
          'video/mp4',
          'video/webm',
          'video/quicktime',
          'video/x-msvideo',

          // Audio
          'audio/mpeg',
          'audio/mp3',
          'audio/wav',
          'audio/x-wav',
          'audio/mp4',
          'audio/x-m4a',
          'audio/aac',
          'audio/ogg',
          'audio/webm',
        ];

        if (!allowedMimeTypes.includes(file.mimetype)) {
          callback(
            new BadRequestException(
              'Unsupported file type. Only PDF, video, and audio files are allowed.',
            ),
            false,
          );

          return;
        }

        callback(null, true);
      },
    }),
  )
  create(
    @Request()
    req: {
      user: {
        id: string;
        role: string;
      };
    },

    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({
            maxSize: 100 * 1024 * 1024,
          }),
        ],
      }),
    )
    file: Express.Multer.File,

    @Body()
    body: {
      title: string;
      description?: string;
      type: 'PDF' | 'VIDEO' | 'AUDIO';
      subjectId: string;
    },
  ) {
    return this.resourcesService.create(body, file, req.user.id);
  }

  /**
   * ============================================================
   * GET RESOURCES
   * ============================================================
   */
  @Get()
  findAll(
    @Request()
    req: {
      user: {
        id: string;
        role: string;
      };
    },
  ) {
    return this.resourcesService.findAll(req.user.id, req.user.role);
  }

  /**
   * ============================================================
   * GET RESOURCES BY SUBJECT
   * ============================================================
   */
  @Get('subject/:subjectId')
  findBySubject(
    @Param('subjectId') subjectId: string,

    @Request()
    req: {
      user: {
        id: string;
        role: string;
      };
    },
  ) {
    return this.resourcesService.findBySubject(
      subjectId,
      req.user.id,
      req.user.role,
    );
  }

  /**
   * ============================================================
   * GET MY RESOURCES
   * ============================================================
   */
  @Get('teacher')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER')
  findMyResources(
    @Request()
    req: {
      user: {
        id: string;
      };
    },
  ) {
    return this.resourcesService.findByTeacher(req.user.id);
  }

  /**
   * ============================================================
   * GET SINGLE RESOURCE
   * ============================================================
   */
  @Get(':id')
  findOne(
    @Param('id') id: string,

    @Request()
    req: {
      user: {
        id: string;
        role: string;
      };
    },
  ) {
    return this.resourcesService.findOne(id, req.user.id, req.user.role);
  }

  /**
   * ============================================================
   * DELETE RESOURCE
   * ============================================================
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  delete(
    @Param('id') id: string,

    @Request()
    req: {
      user: {
        id: string;
        role: string;
      };
    },
  ) {
    return this.resourcesService.delete(id, req.user.id, req.user.role);
  }
}
