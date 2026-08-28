import { IsDateString, IsString } from 'class-validator';

export class CreateLiveClassDto {
  @IsString()
  title!: string;

  @IsString()
  subjectId!: string;

  @IsString()
  teacherId!: string;

  @IsString()
  meetingLink!: string;

  @IsDateString()
  startTime!: string;

  @IsDateString()
  endTime!: string;
}
