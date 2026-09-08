import { Body, Controller, Patch, Post, UseGuards } from '@nestjs/common';

import { AuthService } from './auth.service';

import { CurrentUser } from './decorators/current-user.decorator';
import type { AuthenticatedUser } from './decorators/current-user.decorator';

import { JwtAuthGuard } from './guards/jwt-auth.guard';

import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RegisterTeacherDto } from './dto/register-teacher.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * ============================================================
   * STUDENT
   * ============================================================
   */

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('student-login')
  studentLogin(@Body() dto: LoginDto) {
    return this.authService.studentLogin(dto.email, dto.password);
  }

  /**
   * ============================================================
   * TEACHER
   * ============================================================
   */

  @Post('register-teacher')
  registerTeacher(@Body() dto: RegisterTeacherDto) {
    return this.authService.registerTeacher(dto);
  }

  @Post('teacher-login')
  teacherLogin(@Body() dto: LoginDto) {
    return this.authService.teacherLogin(dto.email, dto.password);
  }

  /**
   * ============================================================
   * PASSWORD RECOVERY
   * ============================================================
   */

  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }

  /**
   * ============================================================
   * CHANGE PASSWORD
   * ============================================================
   */

  @Patch('change-password')
  @UseGuards(JwtAuthGuard)
  changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.authService.changePassword(
      user.id,
      dto.currentPassword,
      dto.newPassword,
      dto.confirmPassword,
    );
  }

  /**
   * ============================================================
   * ADMIN
   * ============================================================
   */

  @Post('admin-login')
  adminLogin(@Body() dto: LoginDto) {
    return this.authService.adminLogin(dto.email, dto.password);
  }
}
