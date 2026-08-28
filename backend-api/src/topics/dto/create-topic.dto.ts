import { IsString, IsOptional } from 'class-validator';

export class CreateTopicDto {
  @IsString()
  name!: string;

  @IsString()
  subjectId!: string;

  @IsOptional()
  @IsString()
  description?: string;
}
