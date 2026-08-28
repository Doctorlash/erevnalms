import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

import { CreateQuestionDto } from './dto/create-question.dto';

@Injectable()
export class QuestionsService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateQuestionDto) {
    return this.prisma.question.create({
      data: dto,
    });
  }

  findAll() {
    return this.prisma.question.findMany({
      include: {
        subject: true,
        topic: true,
      },
    });
  }
  async teacherQuestions(teacherId: string) {
    return this.prisma.question.findMany({
      where: {
        subject: {
          teacherId,
        },
      },
      include: {
        subject: true,
        topic: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findOne(id: string) {
    return this.prisma.question.findUnique({
      where: { id },
      include: {
        subject: true,
        topic: true,
      },
    });
  }

  remove(id: string) {
    return this.prisma.question.delete({
      where: { id },
    });
  }
}
