import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { StudentProgrammeType } from '@prisma/client';

export class CreateCohortDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEnum(StudentProgrammeType)
  programme!: StudentProgrammeType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsInt()
  @Min(0)
  fee!: number;
}
