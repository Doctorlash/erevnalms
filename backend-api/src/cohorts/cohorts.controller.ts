import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { CohortsService } from './cohorts.service';
import { CreateCohortDto } from './dto/create-cohort.dto';
import { UpdateCohortDto } from './dto/update-cohort.dto';
import { AssignStudentDto } from './dto/assign-student.dto';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    role: string;
  };
}

@Controller('cohorts')
@UseGuards(AuthGuard('jwt'))
export class CohortsController {
  constructor(private readonly cohortsService: CohortsService) {}

  private requireAdmin(req: AuthenticatedRequest): void {
    if (req.user?.role !== 'ADMIN') {
      throw new ForbiddenException(
        'Only administrators can perform this action.',
      );
    }
  }

  @Post()
  create(@Req() req: AuthenticatedRequest, @Body() dto: CreateCohortDto) {
    this.requireAdmin(req);

    return this.cohortsService.create(dto);
  }

  @Get()
  findAll(@Req() req: AuthenticatedRequest) {
    this.requireAdmin(req);

    return this.cohortsService.findAll();
  }

  @Get('my')
  findMyCohorts(@Req() req: AuthenticatedRequest) {
    return this.cohortsService.findMyCohorts(req.user.id);
  }

  @Get('my/current')
  findMyCurrentCohorts(@Req() req: AuthenticatedRequest) {
    return this.cohortsService.findMyCurrentCohorts(req.user.id);
  }

  @Get(':id')
  findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    this.requireAdmin(req);

    return this.cohortsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateCohortDto,
  ) {
    this.requireAdmin(req);

    return this.cohortsService.update(id, dto);
  }

  @Patch(':id/cancel')
  cancel(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    this.requireAdmin(req);

    return this.cohortsService.cancel(id);
  }

  @Post(':id/students')
  assignStudent(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: AssignStudentDto,
  ) {
    this.requireAdmin(req);

    return this.cohortsService.assignStudent(id, dto);
  }

  @Delete(':id/students/:studentId')
  removeStudent(
    @Req() req: AuthenticatedRequest,
    @Param('id') cohortId: string,
    @Param('studentId') studentId: string,
  ) {
    this.requireAdmin(req);

    return this.cohortsService.removeStudent(cohortId, studentId);
  }
}
