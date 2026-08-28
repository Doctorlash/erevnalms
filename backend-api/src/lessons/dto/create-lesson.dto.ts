import { IsString, IsOptional, IsInt } from 'class-validator';

export class CreateLessonDto {
  @IsString()
  title!: string;

  @IsString()
  content!: string;

  @IsString()
  topicId!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  videoUrl?: string;

  @IsOptional()
  @IsInt()
  duration?: number;
}
