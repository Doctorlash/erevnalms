/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsString({ message: 'firstName must be a string' })
  firstName!: string;

  @IsString({ message: 'lastName must be a string' })
  lastName!: string;

  @IsEmail({}, { message: 'email must be a valid email address' })
  email!: string;

  @IsString({ message: 'password must be a string' })
  @MinLength(6, { message: 'password must be at least 6 characters long' })
  password!: string;
}
