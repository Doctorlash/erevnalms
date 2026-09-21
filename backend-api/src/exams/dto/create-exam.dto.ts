import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateExamDto {
  @IsString()
  title!: string;

  @IsString()
  subjectId!: string;

  @IsOptional()
  @IsString()
  cohortId?: string;

  @IsInt()
  duration!: number;

  @IsInt()
  totalMarks!: number;

  @IsBoolean()
  isPublished!: boolean;

  @IsOptional()
  @IsBoolean()
  isFinalExam?: boolean;
}
