import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';

import { UsersService } from './users.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * ADMIN ONLY
   * Get all users.
   */
  @Get()
  @Roles('ADMIN')
  findAll() {
    return this.usersService.findAll();
  }

  /**
   * ADMIN ONLY
   * Get all teachers.
   */
  @Get('teachers')
  @Roles('ADMIN')
  teachers() {
    return this.usersService.getTeachers();
  }

  /**
   * ADMIN ONLY
   * Get all students with programme, cohort,
   * enrollment, subscription, payment and request information.
   */
  @Get('students')
  @Roles('ADMIN')
  students() {
    return this.usersService.getStudents();
  }

  /**
   * ADMIN ONLY
   * Change user role.
   *
   * An administrator cannot change their own role.
   */
  @Patch(':id/role/:role')
  @Roles('ADMIN')
  updateRole(
    @Param('id') id: string,
    @Param('role') role: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    if (currentUser.id === id) {
      throw new ForbiddenException(
        'You cannot change your own administrator role.',
      );
    }

    return this.usersService.updateRole(id, role);
  }

  /**
   * ADMIN ONLY
   * Activate user.
   */
  @Patch(':id/activate')
  @Roles('ADMIN')
  activate(@Param('id') id: string) {
    return this.usersService.activate(id);
  }

  /**
   * ADMIN ONLY
   * Deactivate user.
   *
   * Administrator accounts are protected inside the service.
   */
  @Patch(':id/deactivate')
  @Roles('ADMIN')
  deactivate(@Param('id') id: string) {
    return this.usersService.deactivate(id);
  }

  /**
   * AUTHENTICATED USER
   * Get own profile.
   */
  @Get('me')
  findMe(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.findById(user.id);
  }

  /**
   * AUTHENTICATED USER
   * Update own profile.
   */
  @Patch('me')
  updateMyProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body()
    body: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      school?: string;
      classLevel?: string;
      bio?: string;
      profileImage?: string;
    },
  ) {
    return this.usersService.updateProfile(user.id, body);
  }

  /**
   * ADMIN ONLY
   * Platform statistics.
   */
  @Get('stats')
  @Roles('ADMIN')
  getStats() {
    return this.usersService.getStats();
  }
}
