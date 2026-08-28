import { IsOptional, IsString } from 'class-validator';

export class CreateAnnouncementDto {
  @IsString()
  title!: string;

  @IsString()
  message!: string;

  @IsString()
  teacherId!: string;

  @IsOptional()
  @IsString()
  subjectId?: string;
}
