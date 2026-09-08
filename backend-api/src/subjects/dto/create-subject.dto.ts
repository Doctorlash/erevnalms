import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

import { StudentProgrammeType } from '@prisma/client';

export class CreateSubjectDto {
  @IsString({
    message: 'Subject name must be a string.',
  })
  @MinLength(2, {
    message: 'Subject name must be at least 2 characters long.',
  })
  name!: string;

  @IsOptional()
  @IsString({
    message: 'Description must be a string.',
  })
  description?: string;

  @IsEnum(StudentProgrammeType, {
    message: 'Programme must be either JAMB or WAEC.',
  })
  programme!: StudentProgrammeType;
}
