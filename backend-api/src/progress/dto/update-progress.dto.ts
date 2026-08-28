import { IsBoolean, IsInt, IsString, Max, Min } from 'class-validator';

export class UpdateProgressDto {
  @IsString()
  userId!: string;

  @IsString()
  lessonId!: string;

  @IsInt()
  @Min(0)
  @Max(100)
  progress!: number;

  @IsBoolean()
  completed!: boolean;
}
