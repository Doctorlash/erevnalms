import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterTeacherDto {
  @IsString({ message: 'First name must be a string.' })
  firstName!: string;

  @IsString({ message: 'Last name must be a string.' })
  lastName!: string;

  @IsEmail({}, { message: 'Email must be a valid email address.' })
  email!: string;

  @IsString({ message: 'Password must be a string.' })
  @MinLength(6, {
    message: 'Password must be at least 6 characters long.',
  })
  password!: string;
}
