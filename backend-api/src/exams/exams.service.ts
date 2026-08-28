/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreateExamDto } from './dto/create-exam.dto';

@Injectable()
export class ExamsService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateExamDto) {
    return this.prisma.exam.create({
      data: dto,
    });
  }

  findAll() {
    return this.prisma.exam.findMany({
      select: {
        id: true,
        subject: true,
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
        subject: true,
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
