import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SubjectsService {
  constructor(private prisma: PrismaService) {}

  async create(data: { name: string; description?: string }) {
    return this.prisma.subject.create({
      data,
    });
  }

  async findAll() {
    return this.prisma.subject.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.subject.findUnique({
      where: { id },
    });
  }

  async delete(id: string) {
    return this.prisma.subject.delete({
      where: { id },
    });
  }

  async assignTeacher(subjectId: string, teacherId: string) {
    return this.prisma.subject.update({
      where: {
        id: subjectId,
      },
      data: {
        teacherId,
      },
    });
  }

  async teacherSubjects(teacherId: string) {
    return this.prisma.subject.findMany({
      where: {
        teacherId,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }
}
