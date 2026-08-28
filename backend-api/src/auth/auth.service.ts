import { createHash, randomBytes } from 'crypto';
import { MailService } from '../mail/mail.service';
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async register(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) {
    const existingUser = await this.usersService.findByEmail(data.email);

    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await this.usersService.create({
      ...data,
      password: hashedPassword,
    });

    return {
      message: 'Registration successful',
      user: {
        id: user.id,
        email: user.email,
      },
    };
  }
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

  async registerTeacher(data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) {
    const existingUser = await this.usersService.findByEmail(data.email);

    if (existingUser) {
      throw new BadRequestException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const teacher = await this.usersService.create({
      ...data,
      password: hashedPassword,

      role: 'TEACHER',

      isActive: false,
    });

    return {
      message:
        'Registration successful. Your account is awaiting administrator approval.',

      user: {
        id: teacher.id,

        email: teacher.email,

        role: teacher.role,

        isActive: teacher.isActive,
      },
    };
  }
  private async loginByRole(
    email: string,
    password: string,
    role: 'STUDENT' | 'TEACHER' | 'ADMIN',
  ) {
    const user = await this.usersService.findByEmail(email);

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
  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);

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

    // Confirm the current password
    const currentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!currentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect.');
    }

    // Confirm the new passwords match
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('New passwords do not match.');
    }

    // Prevent using the same password
    const samePassword = await bcrypt.compare(newPassword, user.password);

    if (samePassword) {
      throw new BadRequestException(
        'Your new password must be different from your current password.',
      );
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await this.usersService.updatePassword(userId, hashedPassword);

    return {
      success: true,
      message: 'Password changed successfully.',
    };
  }
  async resetPassword(token: string, password: string) {
    const hashedToken = createHash('sha256').update(token).digest('hex');

    const user = await this.usersService.findByResetPasswordToken(hashedToken);

    if (!user) {
      throw new BadRequestException('Invalid or expired password reset link.');
    }

    const resetPasswordExpires = (
      user as { resetPasswordExpires?: Date | null }
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
