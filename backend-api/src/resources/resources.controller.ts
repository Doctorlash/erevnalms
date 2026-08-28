import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
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
export class ResourcesController {
  constructor(private readonly resourcesService: ResourcesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  @UseInterceptors(FileInterceptor('file'))
  create(
    @Request()
    req: {
      user: {
        id: string;
        role: string;
      };
    },

    @UploadedFile() file: Express.Multer.File,

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

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.resourcesService.findAll();
  }

  @Get('subject/:subjectId')
  @UseGuards(JwtAuthGuard)
  findBySubject(@Param('subjectId') subjectId: string) {
    return this.resourcesService.findBySubject(subjectId);
  }

  @Get('teacher')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('TEACHER', 'ADMIN')
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

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.resourcesService.findOne(id);
  }

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
