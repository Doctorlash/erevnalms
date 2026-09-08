import { Module } from '@nestjs/common';

import { SubjectsController } from './subjects.controller';
import { RegistrationSubjectsController } from './registration-subjects.controller';

import { SubjectsService } from './subjects.service';

@Module({
  controllers: [SubjectsController, RegistrationSubjectsController],
  providers: [SubjectsService],
})
export class SubjectsModule {}
