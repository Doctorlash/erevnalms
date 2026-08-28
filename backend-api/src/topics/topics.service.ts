import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TopicsService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    name: string;
    description?: string;
    subjectId: string;
  }): Promise<any> {
    return this.prisma.topic.create({
      data,
    });
  }

  async findAll(): Promise<any> {
    return this.prisma.topic.findMany({
      include: {
        subject: true,
      },
    });
  }

  async findBySubject(subjectId: string): Promise<any> {
    return this.prisma.topic.findMany({
      where: {
        subjectId,
      },
    });
  }

  async findOne(id: string): Promise<any> {
    return this.prisma.topic.findUnique({
      where: { id },
      include: {
        subject: true,
      },
    });
  }

  async teacherTopics(teacherId: string) {
    return this.prisma.topic.findMany({
      where: {
        subject: {
          teacherId,
        },
      },
      include: {
        subject: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }
}
