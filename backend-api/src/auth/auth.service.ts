import { createHash, randomBytes } from 'crypto';

import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { Prisma, StudentProgrammeType } from '@prisma/client';

import { MailService } from '../mail/mail.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  /**
   * ============================================================
   * STUDENT REGISTRATION
   * ============================================================
   *
   * Registration flow:
   *
   * 1. Validate student information.
   * 2. Validate selected programmes.
   * 3. Validate programme-specific subject limits.
   * 4. Validate that selected subjects belong to the correct programme.
   * 5. Create the student.
   * 6. Create StudentProgramme records.
   * 7. Create PENDING SubjectRequest records.
   *
   * IMPORTANT:
   *
   * Enrollment is NOT created during registration.
   *
   * SubjectRequest = what the student requested.
   * Enrollment = what the administrator approved.
   */
  async register(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    programmes: StudentProgrammeType[];
    jambSubjectIds?: string[];
    waecSubjectIds?: string[];
  }) {
    const email = data.email.trim().toLowerCase();

    const firstName = data.firstName.trim();
    const lastName = data.lastName.trim();

    if (!firstName || !lastName) {
      throw new BadRequestException('First name and last name are required.');
    }

    /**
     * ------------------------------------------------------------
     * PROGRAMME VALIDATION
     * ------------------------------------------------------------
     */

    if (!data.programmes || data.programmes.length === 0) {
      throw new BadRequestException('You must select at least one programme.');
    }

    /**
     * Remove duplicate programmes.
     */
    const programmes = [...new Set(data.programmes)];

    const validProgrammes: StudentProgrammeType[] = [
      StudentProgrammeType.JAMB,
      StudentProgrammeType.WAEC,
    ];

    for (const programme of programmes) {
      if (!validProgrammes.includes(programme)) {
        throw new BadRequestException(
          `Invalid programme selected: ${programme}`,
        );
      }
    }

    const hasJamb = programmes.includes(StudentProgrammeType.JAMB);

    const hasWaec = programmes.includes(StudentProgrammeType.WAEC);

    /**
     * ------------------------------------------------------------
     * NORMALIZE SUBJECT ARRAYS
     * ------------------------------------------------------------
     */

    const jambSubjectIds = [
      ...new Set(
        (data.jambSubjectIds ?? []).map((id) => id.trim()).filter(Boolean),
      ),
    ];

    const waecSubjectIds = [
      ...new Set(
        (data.waecSubjectIds ?? []).map((id) => id.trim()).filter(Boolean),
      ),
    ];

    /**
     * ------------------------------------------------------------
     * JAMB VALIDATION
     * ------------------------------------------------------------
     *
     * JAMB:
     * Maximum = 4 subjects.
     */

    if (hasJamb && jambSubjectIds.length === 0) {
      throw new BadRequestException(
        'You selected JAMB but did not select any JAMB subjects.',
      );
    }

    if (jambSubjectIds.length > 4) {
      throw new BadRequestException(
        'JAMB students can select a maximum of 4 subjects.',
      );
    }

    if (!hasJamb && jambSubjectIds.length > 0) {
      throw new BadRequestException(
        'JAMB subjects cannot be selected unless you register for JAMB.',
      );
    }

    /**
     * ------------------------------------------------------------
     * WAEC VALIDATION
     * ------------------------------------------------------------
     *
     * WAEC:
     * Maximum = 9 subjects.
     */

    if (hasWaec && waecSubjectIds.length === 0) {
      throw new BadRequestException(
        'You selected WAEC but did not select any WAEC subjects.',
      );
    }

    if (waecSubjectIds.length > 9) {
      throw new BadRequestException(
        'WAEC students can select a maximum of 9 subjects.',
      );
    }

    if (!hasWaec && waecSubjectIds.length > 0) {
      throw new BadRequestException(
        'WAEC subjects cannot be selected unless you register for WAEC.',
      );
    }

    /**
     * ------------------------------------------------------------
     * PREVENT EMPTY REGISTRATION
     * ------------------------------------------------------------
     */

    if (jambSubjectIds.length === 0 && waecSubjectIds.length === 0) {
      throw new BadRequestException('Please select at least one subject.');
    }

    /**
     * ------------------------------------------------------------
     * CHECK EMAIL
     * ------------------------------------------------------------
     */

    const existingUser = await this.usersService.findByEmail(email);

    if (existingUser) {
      throw new BadRequestException('Email already exists.');
    }

    /**
     * ------------------------------------------------------------
     * VALIDATE JAMB SUBJECTS
     * ------------------------------------------------------------
     *
     * Every selected JAMB subject must:
     *
     * - Exist
     * - Be active
     * - Belong to JAMB
     */

    if (jambSubjectIds.length > 0) {
      const jambSubjects = await this.usersService['prisma'].subject.findMany({
        where: {
          id: {
            in: jambSubjectIds,
          },
          programme: StudentProgrammeType.JAMB,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
        },
      });

      const foundJambSubjectIds = new Set(
        jambSubjects.map((subject) => subject.id),
      );

      const invalidJambSubjectIds = jambSubjectIds.filter(
        (id) => !foundJambSubjectIds.has(id),
      );

      if (invalidJambSubjectIds.length > 0) {
        throw new BadRequestException(
          'One or more selected JAMB subjects do not exist, are inactive, or do not belong to JAMB.',
        );
      }
    }

    /**
     * ------------------------------------------------------------
     * VALIDATE WAEC SUBJECTS
     * ------------------------------------------------------------
     *
     * Every selected WAEC subject must:
     *
     * - Exist
     * - Be active
     * - Belong to WAEC
     */

    if (waecSubjectIds.length > 0) {
      const waecSubjects = await this.usersService['prisma'].subject.findMany({
        where: {
          id: {
            in: waecSubjectIds,
          },
          programme: StudentProgrammeType.WAEC,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
        },
      });

      const foundWaecSubjectIds = new Set(
        waecSubjects.map((subject) => subject.id),
      );

      const invalidWaecSubjectIds = waecSubjectIds.filter(
        (id) => !foundWaecSubjectIds.has(id),
      );

      if (invalidWaecSubjectIds.length > 0) {
        throw new BadRequestException(
          'One or more selected WAEC subjects do not exist, are inactive, or do not belong to WAEC.',
        );
      }
    }

    /**
     * ------------------------------------------------------------
     * PREVENT CROSS-PROGRAMME SUBJECT DUPLICATION
     * ------------------------------------------------------------
     *
     * A student can have the same subject name under both
     * programmes because JAMB and WAEC subjects are separate
     * records.
     *
     * Example:
     *
     * JAMB Mathematics
     * WAEC Mathematics
     *
     * These are valid and independent subjects.
     *
     * Therefore we do NOT reject the same subject name across
     * programmes here.
     */

    /**
     * ------------------------------------------------------------
     * HASH PASSWORD
     * ------------------------------------------------------------
     */

    const hashedPassword = await bcrypt.hash(data.password, 10);

    /**
     * ------------------------------------------------------------
     * DATABASE TRANSACTION
     * ------------------------------------------------------------
     *
     * Student creation, programme creation, and subject
     * requests are handled as one transaction.
     */

    const result = await this.usersService['prisma'].$transaction(
      async (tx: Prisma.TransactionClient) => {
        /**
         * Create student.
         */
        const user = await tx.user.create({
          data: {
            firstName,
            lastName,
            email,
            password: hashedPassword,
            role: 'STUDENT',
            isActive: true,
          },
        });

        /**
         * --------------------------------------------------------
         * CREATE PROGRAMME RECORDS
         * --------------------------------------------------------
         */

        await tx.studentProgramme.createMany({
          data: programmes.map((programme) => ({
            userId: user.id,
            programme,
          })),
          skipDuplicates: true,
        });

        /**
         * --------------------------------------------------------
         * CREATE JAMB SUBJECT REQUESTS
         * --------------------------------------------------------
         */

        if (jambSubjectIds.length > 0) {
          await tx.subjectRequest.createMany({
            data: jambSubjectIds.map((subjectId) => ({
              userId: user.id,
              subjectId,
              programme: StudentProgrammeType.JAMB,
              status: 'PENDING',
            })),
            skipDuplicates: true,
          });
        }

        /**
         * --------------------------------------------------------
         * CREATE WAEC SUBJECT REQUESTS
         * --------------------------------------------------------
         */

        if (waecSubjectIds.length > 0) {
          await tx.subjectRequest.createMany({
            data: waecSubjectIds.map((subjectId) => ({
              userId: user.id,
              subjectId,
              programme: StudentProgrammeType.WAEC,
              status: 'PENDING',
            })),
            skipDuplicates: true,
          });
        }

        return user;
      },
    );

    /**
     * ------------------------------------------------------------
     * RESPONSE
     * ------------------------------------------------------------
     */

    return {
      message:
        'Registration successful. Your subject requests are awaiting administrator approval.',

      user: {
        id: result.id,
        firstName: result.firstName,
        lastName: result.lastName,
        email: result.email,
        role: result.role,
      },

      programmes,

      requests: {
        jamb: jambSubjectIds.length,
        waec: waecSubjectIds.length,
      },
    };
  }

  /**
   * ============================================================
   * FORGOT PASSWORD
   * ============================================================
   */

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);

    /*
     * Do not reveal whether the email exists.
     * This prevents account enumeration.
     */
    if (!user) {
      return {
        message:
          'If an account exists with that email, a password reset link has been sent.',
      };
    }

    const rawToken = randomBytes(32).toString('hex');

    const hashedToken = createHash('sha256').update(rawToken).digest('hex');

    const expires = new Date();

    expires.setMinutes(expires.getMinutes() + 30);

    await this.usersService.setPasswordResetToken(
      user.id,
      hashedToken,
      expires,
    );

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const resetUrl = `${frontendUrl}/reset-password?token=${rawToken}`;

    await this.mailService.sendPasswordResetEmail(
      user.email,
      user.firstName,
      resetUrl,
    );

    return {
      message:
        'If an account exists with that email, a password reset link has been sent.',
    };
  }

  /**
   * ============================================================
   * TEACHER REGISTRATION
   * ============================================================
   *
   * Teachers do NOT select JAMB or WAEC subjects during
   * registration.
   *
   * Administrator approval is required before the teacher
   * can log in.
   */

  async registerTeacher(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) {
    const firstName = data.firstName.trim();
    const lastName = data.lastName.trim();
    const email = data.email.trim().toLowerCase();

    if (!firstName || !lastName) {
      throw new BadRequestException('First name and last name are required.');
    }

    const existingUser = await this.usersService.findByEmail(email);

    if (existingUser) {
      throw new BadRequestException('Email already exists.');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const teacher = await this.usersService.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: 'TEACHER',
      isActive: false,
    });

    return {
      message:
        'Registration successful. Your account is awaiting administrator approval.',

      user: {
        id: teacher.id,
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        email: teacher.email,
        role: teacher.role,
        isActive: teacher.isActive,
      },
    };
  }

  /**
   * ============================================================
   * ROLE-BASED LOGIN
   * ============================================================
   */

  private async loginByRole(
    email: string,
    password: string,
    role: 'STUDENT' | 'TEACHER' | 'ADMIN',
  ) {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await this.usersService.findByEmail(normalizedEmail);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.role !== role) {
      throw new UnauthorizedException(
        `This account is not registered as ${role.toLowerCase()}.`,
      );
    }

    const passwordValid = await bcrypt.compare(password, user.password);

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException(
        'Your account is awaiting administrator approval.',
      );
    }

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      access_token: token,

      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    };
  }

  async studentLogin(email: string, password: string) {
    return this.loginByRole(email, password, 'STUDENT');
  }

  async teacherLogin(email: string, password: string) {
    return this.loginByRole(email, password, 'TEACHER');
  }

  async adminLogin(email: string, password: string) {
    return this.loginByRole(email, password, 'ADMIN');
  }

  /**
   * ============================================================
   * GENERAL LOGIN
   * ============================================================
   */

  async login(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await this.usersService.findByEmail(normalizedEmail);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException(
        'Your account is awaiting administrator approval.',
      );
    }

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      access_token: token,

      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      },
    };
  }

  /**
   * ============================================================
   * CHANGE PASSWORD
   * ============================================================
   */

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
    confirmPassword: string,
  ) {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('User account not found.');
    }

    const currentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!currentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect.');
    }

    if (newPassword !== confirmPassword) {
      throw new BadRequestException('New passwords do not match.');
    }

    const samePassword = await bcrypt.compare(newPassword, user.password);

    if (samePassword) {
      throw new BadRequestException(
        'Your new password must be different from your current password.',
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.usersService.updatePassword(userId, hashedPassword);

    return {
      success: true,
      message: 'Password changed successfully.',
    };
  }

  /**
   * ============================================================
   * RESET PASSWORD
   * ============================================================
   */

  async resetPassword(token: string, password: string) {
    const hashedToken = createHash('sha256').update(token).digest('hex');

    const user = await this.usersService.findByResetPasswordToken(hashedToken);

    if (!user) {
      throw new BadRequestException('Invalid or expired password reset link.');
    }

    const resetPasswordExpires = (
      user as {
        resetPasswordExpires?: Date | null;
      }
    ).resetPasswordExpires;

    if (!resetPasswordExpires || resetPasswordExpires < new Date()) {
      throw new BadRequestException('Invalid or expired password reset link.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await this.usersService.updatePassword(user.id, hashedPassword);

    await this.usersService.clearPasswordResetToken(user.id);

    return {
      message: 'Password reset successful. You can now log in.',
    };
  }
}
