import { IsDateString, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateAssignmentDto {
  @IsString()
  title!: string;

  @IsString()
  subjectId!: string;

  @IsString()
  teacherId!: string;

  @IsOptional()
  @IsString()
  cohortId?: string;

  @IsString()
  description!: string;

  @IsDateString()
  dueDate!: string;

  @IsInt()
  maxScore!: number;
}
