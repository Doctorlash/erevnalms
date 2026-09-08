import { IsString, IsNotEmpty } from 'class-validator';

export class CreateEnrollmentDto {
  @IsString({ message: 'User ID must be a string.' })
  @IsNotEmpty({ message: 'User ID is required.' })
  userId!: string;

  @IsString({ message: 'Subject ID must be a string.' })
  @IsNotEmpty({ message: 'Subject ID is required.' })
  subjectId!: string;
}
