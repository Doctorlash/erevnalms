import { Module } from '@nestjs/common';

import { TeacherApplicationsController } from './teacher-applications.controller';
import { TeacherApplicationsService } from './teacher-applications.service';

@Module({
  controllers: [TeacherApplicationsController],
  providers: [TeacherApplicationsService],
  exports: [TeacherApplicationsService],
})
export class TeacherApplicationsModule {}
