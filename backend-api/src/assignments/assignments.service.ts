import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { SubmitAssignmentDto } from './dto/submit-assignment.dto';
import { GradeAssignmentDto } from './dto/grade-assignment.dto';

@Injectable()
export class AssignmentsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateAssignmentDto) {
    return this.prisma.assignment.create({
      data: {
        title: dto.title,
        description: dto.description,
        subjectId: dto.subjectId,
        teacherId: dto.teacherId,
        cohortId: dto.cohortId,
        dueDate: new Date(dto.dueDate),
        maxScore: dto.maxScore,
      },
    });
  }

  async findAll() {
    return this.prisma.assignment.findMany({
      include: {
        subject: true,
        teacher: true,
        cohort: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const assignment = await this.prisma.assignment.findUnique({
      where: { id },
      include: {
        subject: true,
        teacher: true,
        cohort: true,
        submissions: true,
      },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    return assignment;
  }

  async submit(assignmentId: string, dto: SubmitAssignmentDto) {
    const assignment = await this.prisma.assignment.findUnique({
      where: {
        id: assignmentId,
      },
    });

    if (!assignment) {
      throw new NotFoundException('Assignment not found');
    }

    return this.prisma.assignmentSubmission.create({
      data: {
        assignmentId,
        studentId: dto.studentId,
        content: dto.content,
      },
    });
  }

  async gradeSubmission(submissionId: string, dto: GradeAssignmentDto) {
    return this.prisma.assignmentSubmission.update({
      where: {
        id: submissionId,
      },
      data: {
        score: dto.score,
        feedback: dto.feedback,
        gradedAt: new Date(),
      },
    });
  }

  async studentAssignments(studentId: string) {
    return this.prisma.assignmentSubmission.findMany({
      where: {
        studentId,
      },
      include: {
        assignment: {
          include: {
            subject: true,
            cohort: true,
          },
        },
      },
    });
  }

  async teacherAssignments(teacherId: string) {
    return this.prisma.assignment.findMany({
      where: {
        teacherId,
      },
      include: {
        subject: true,
        cohort: true,
        submissions: {
          include: {
            student: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getSubmissions(assignmentId: string) {
    return this.prisma.assignmentSubmission.findMany({
      where: {
        assignmentId,
      },
      include: {
        student: true,
      },
      orderBy: {
        submittedAt: 'desc',
      },
    });
  }
}
