/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Req,
  UseGuards,
} from '@nestjs/common';

import { SubjectRequestsService } from './subject-requests.service';
import { ReviewSubjectRequestDto } from './dto/review-subject-request.dto';
import { BulkReviewSubjectRequestDto } from './dto/bulk-review-subject-request.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('subject-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SubjectRequestsController {
  constructor(
    private readonly subjectRequestsService: SubjectRequestsService,
  ) {}

  // ============================================================
  // STUDENT
  // ============================================================

  /**
   * Get the authenticated student's own subject requests.
   */
  @Get('my-requests')
  @Roles('STUDENT')
  getMyRequests(@Req() req: any) {
    return this.subjectRequestsService.getStudentRequests(req.user.id);
  }

  /**
   * Resubmit a rejected subject request.
   *
   * The service verifies that the request belongs to the
   * authenticated student.
   */
  @Patch('my-requests/:id/resubmit')
  @Roles('STUDENT')
  resubmitRequest(@Req() req: any, @Param('id') requestId: string) {
    return this.subjectRequestsService.resubmitRequest(requestId, req.user.id);
  }

  // ============================================================
  // ADMIN
  // ============================================================

  /**
   * Get all subject requests.
   */
  @Get('admin/all')
  @Roles('ADMIN')
  getAllRequests() {
    return this.subjectRequestsService.getAllRequests();
  }

  /**
   * Get all pending subject requests.
   */
  @Get('admin/pending')
  @Roles('ADMIN')
  getPendingRequests() {
    return this.subjectRequestsService.getPendingRequests();
  }

  /**
   * Get one subject request.
   */
  @Get('admin/:id')
  @Roles('ADMIN')
  getOneRequest(@Param('id') requestId: string) {
    return this.subjectRequestsService.getOneRequest(requestId);
  }

  /**
   * Review one subject request.
   *
   * APPROVE:
   *   - Creates enrollment
   *   - Marks request APPROVED
   *
   * REJECT:
   *   - Requires rejectionReason
   *   - Marks request REJECTED
   */
  @Patch('admin/:id/review')
  @Roles('ADMIN')
  reviewRequest(
    @Param('id') requestId: string,
    @Body() dto: ReviewSubjectRequestDto,
  ) {
    return this.subjectRequestsService.reviewRequest(requestId, dto);
  }

  /**
   * Bulk review subject requests.
   *
   * APPROVE:
   *   Approves all selected pending requests and creates
   *   the corresponding enrollments.
   *
   * REJECT:
   *   Rejects all selected pending requests using the supplied
   *   rejection reason.
   */
  @Patch('admin/bulk-review')
  @Roles('ADMIN')
  bulkReviewRequests(@Body() dto: BulkReviewSubjectRequestDto) {
    return this.subjectRequestsService.bulkReviewRequests(dto);
  }
}
