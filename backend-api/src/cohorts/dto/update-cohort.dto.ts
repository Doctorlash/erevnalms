/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { CohortStatus, StudentProgrammeType } from '@prisma/client';

export class UpdateCohortDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsEnum(StudentProgrammeType)
  programme?: StudentProgrammeType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  fee?: number;

  @IsOptional()
  @IsEnum(CohortStatus)
  status?: CohortStatus;
}
