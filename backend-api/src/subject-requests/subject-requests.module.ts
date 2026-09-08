import { Module } from '@nestjs/common';

import { SubjectRequestsController } from './subject-requests.controller';
import { SubjectRequestsService } from './subject-requests.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SubjectRequestsController],
  providers: [SubjectRequestsService],
  exports: [SubjectRequestsService],
})
export class SubjectRequestsModule {}
