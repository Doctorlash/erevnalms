import { IsString } from 'class-validator';

export class JoinClassDto {
  @IsString()
  studentId!: string;
}
