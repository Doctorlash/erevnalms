import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreateExamDto } from './dto/create-exam.dto';

@Injectable()
export class ExamsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateExamDto) {
    return this.prisma.exam.create({
      data: {
        title: dto.title,
        subjectId: dto.subjectId,
        cohortId: dto.cohortId,
        duration: dto.duration,
        totalMarks: dto.totalMarks,
        isPublished: dto.isPublished,
        isFinalExam: dto.isFinalExam ?? false,
      },
    });
  }

  findAll() {
    return this.prisma.exam.findMany({
      select: {
        id: true,
        title: true,
        duration: true,
        totalMarks: true,
        isPublished: true,
        isFinalExam: true,
        subject: true,
        cohort: true,
        examQuestions: {
          select: {
            question: true,
          },
        },
      },
    });
  }

  findOne(id: string) {
    return this.prisma.exam.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        duration: true,
        totalMarks: true,
        isPublished: true,
        isFinalExam: true,
        subject: true,
        cohort: true,
        examQuestions: {
          select: {
            question: true,
          },
        },
      },
    });
  }

  async addQuestion(examId: string, questionId: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    return this.prisma.examQuestion.create({
      data: {
        examId,
        questionId,
      },
    });
  }
}
