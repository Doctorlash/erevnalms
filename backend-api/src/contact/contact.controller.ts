import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { CreateSupportDto } from './dto/create-support.dto';

@Controller('contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  /**
   * PUBLIC
   *
   * Landing-page contact form.
   *
   * This endpoint intentionally remains unauthenticated.
   */
  @Post()
  create(@Body() dto: CreateContactDto) {
    return this.contactService.create(dto);
  }

  /**
   * STUDENT ONLY
   *
   * Submit a support request from the authenticated
   * student's dashboard.
   *
   * The student ID is taken from the JWT.
   */
  @Post('support')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('STUDENT')
  createSupport(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateSupportDto,
  ) {
    return this.contactService.createSupport(user.id, dto);
  }

  /**
   * ADMIN ONLY
   *
   * Get all contact messages and support requests.
   */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  findAll() {
    return this.contactService.findAll();
  }

  /**
   * ADMIN ONLY
   *
   * Get one contact message/support request.
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  findOne(@Param('id') id: string) {
    return this.contactService.findOne(id);
  }

  /**
   * ADMIN ONLY
   *
   * Update message status.
   */
  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  updateStatus(
    @Param('id') id: string,
    @Body()
    body: {
      status: 'UNREAD' | 'READ' | 'RESOLVED';
    },
  ) {
    return this.contactService.updateStatus(id, body.status);
  }

  /**
   * ADMIN ONLY
   *
   * Delete a contact message/support request.
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.contactService.remove(id);
  }
}
