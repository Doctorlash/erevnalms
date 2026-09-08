import { BadRequestException, Controller, Get, Query } from '@nestjs/common';

import { StudentProgrammeType } from '@prisma/client';

import { SubjectsService } from './subjects.service';

@Controller('subjects')
export class RegistrationSubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Get('registration')
  registrationSubjects(@Query('programme') programme?: StudentProgrammeType) {
    if (
      programme !== StudentProgrammeType.JAMB &&
      programme !== StudentProgrammeType.WAEC
    ) {
      throw new BadRequestException('Programme must be either JAMB or WAEC.');
    }

    return this.subjectsService.availableForRegistration(programme);
  }
}
