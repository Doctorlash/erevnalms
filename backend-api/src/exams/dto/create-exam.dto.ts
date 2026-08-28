import { IsBoolean, IsInt, IsString } from 'class-validator';

export class CreateExamDto {
  @IsString()
  title!: string;

  @IsString()
  subjectId!: string;

  @IsInt()
  duration!: number;

  @IsInt()
  totalMarks!: number;

  @IsBoolean()
  isPublished!: boolean;
}
