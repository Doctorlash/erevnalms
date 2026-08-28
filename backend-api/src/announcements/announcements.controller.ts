import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { AnnouncementsService } from './announcements.service';

import { CreateAnnouncementDto } from './dto/create-announcement.dto';

@Controller('announcements')
export class AnnouncementsController {
  constructor(private readonly service: AnnouncementsService) {}

  @Post()
  create(
    @Body()
    dto: CreateAnnouncementDto,
  ) {
    return this.service.create(dto);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }
  @Get('teacher/:teacherId')
  teacherAnnouncements(
    @Param('teacherId')
    teacherId: string,
  ) {
    return this.service.teacherAnnouncements(teacherId);
  }
  @Get(':id')
  findOne(
    @Param('id')
    id: string,
  ) {
    return this.service.findOne(id);
  }

  @Get('subject/:subjectId')
  subjectAnnouncements(
    @Param('subjectId')
    subjectId: string,
  ) {
    return this.service.subjectAnnouncements(subjectId);
  }

  @Post(':id/publish')
  publish(
    @Param('id')
    id: string,
  ) {
    return this.service.publish(id);
  }

  @Post(':id/unpublish')
  unpublish(
    @Param('id')
    id: string,
  ) {
    return this.service.unpublish(id);
  }
}
