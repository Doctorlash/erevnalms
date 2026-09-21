import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { SubscriptionsService } from './subscriptions.service';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    role?: string;
  };
}

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(private readonly service: SubscriptionsService) {}

  // =========================================================
  // GET ALL SUBSCRIPTIONS
  // ADMIN ONLY
  // =========================================================

  @Get()
  findAll(@Req() req: AuthenticatedRequest) {
    return this.service.findAll(req.user);
  }

  // =========================================================
  // GET MY SUBSCRIPTIONS
  // =========================================================

  @Get('my')
  findMySubscriptions(@Req() req: AuthenticatedRequest) {
    return this.service.findMySubscriptions(req.user);
  }

  // =========================================================
  // GET MY SUBSCRIPTION FOR A COHORT
  // =========================================================

  @Get('my/cohort/:cohortId')
  findMyCohortSubscription(
    @Param('cohortId') cohortId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.service.findMyCohortSubscription(cohortId, req.user);
  }

  // =========================================================
  // GET ONE SUBSCRIPTION
  // =========================================================

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.service.findOne(id, req.user);
  }
}
