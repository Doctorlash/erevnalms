import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

import { StudentProgrammeType } from '@prisma/client';

export class RegisterDto {
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

  /**
   * PROGRAMMES
   *
   * A student can select:
   * - JAMB
   * - WAEC
   *
   * A student may select both programmes.
   */
  @IsArray({
    message: 'Programmes must be provided as an array.',
  })
  @ArrayMinSize(1, {
    message: 'You must select at least one programme.',
  })
  @IsEnum(StudentProgrammeType, {
    each: true,
    message: 'Each programme must be JAMB or WAEC.',
  })
  programmes!: StudentProgrammeType[];

  /**
   * JAMB SUBJECTS
   *
   * Maximum of 4 subjects.
   *
   * These IDs must belong to JAMB subjects.
   */
  @IsOptional()
  @IsArray({
    message: 'JAMB subjects must be provided as an array.',
  })
  @ArrayMaxSize(4, {
    message: 'JAMB students can select a maximum of 4 subjects.',
  })
  @IsString({
    each: true,
    message: 'Each JAMB subject must be a valid subject ID.',
  })
  jambSubjectIds?: string[];

  /**
   * WAEC SUBJECTS
   *
   * Maximum of 9 subjects.
   *
   * These IDs must belong to WAEC subjects.
   */
  @IsOptional()
  @IsArray({
    message: 'WAEC subjects must be provided as an array.',
  })
  @ArrayMaxSize(9, {
    message: 'WAEC students can select a maximum of 9 subjects.',
  })
  @IsString({
    each: true,
    message: 'Each WAEC subject must be a valid subject ID.',
  })
  waecSubjectIds?: string[];
}
