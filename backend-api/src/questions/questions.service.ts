import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateQuestionDto } from './dto/create-question.dto';

@Injectable()
export class QuestionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * ============================================================
   * CREATE QUESTION
   * ============================================================
   *
   * The caller's role/ownership is enforced by the controller.
   *
   * Programme rules:
   * JAMB subject -> JAMB question
   * WAEC subject -> WAEC question
   *
   * If a topic is supplied, the topic must belong to the
   * selected subject.
   */
  async create(dto: CreateQuestionDto, userId: string, role: string) {
    const question = dto.question?.trim();
    const optionA = dto.optionA?.trim();
    const optionB = dto.optionB?.trim();
    const optionC = dto.optionC?.trim();
    const optionD = dto.optionD?.trim();
    const correctAnswer = dto.correctAnswer?.trim();
    const explanation = dto.explanation?.trim();

    if (
      !question ||
      !optionA ||
      !optionB ||
      !optionC ||
      !optionD ||
      !correctAnswer
    ) {
      throw new BadRequestException(
        'Question, all four options, and the correct answer are required.',
      );
    }

    const subject = await this.prisma.subject.findUnique({
      where: {
        id: dto.subjectId,
      },
    });

    if (!subject) {
      throw new NotFoundException('Subject not found.');
    }

    if (!subject.isActive) {
      throw new ConflictException(
        'This subject is inactive and cannot receive new questions.',
      );
    }

    /**
     * Ensure the question exam type matches the subject programme.
     */
    if (dto.examType !== subject.programme) {
      throw new BadRequestException(
        `This is a ${subject.programme} subject. The question exam type must also be ${subject.programme}.`,
      );
    }

    /**
     * Teachers may only create questions for subjects assigned
     * to them.
     */
    if (role === 'TEACHER' && subject.teacherId !== userId) {
      throw new ForbiddenException('You are not assigned to this subject.');
    }

    /**
     * If a topic was supplied, verify that it belongs to the
     * selected subject.
     */
    if (dto.topicId) {
      const topic = await this.prisma.topic.findUnique({
        where: {
          id: dto.topicId,
        },
      });

      if (!topic) {
        throw new NotFoundException('Topic not found.');
      }

      if (topic.subjectId !== dto.subjectId) {
        throw new BadRequestException(
          'The selected topic does not belong to the selected subject.',
        );
      }
    }

    return this.prisma.question.create({
      data: {
        question,
        optionA,
        optionB,
        optionC,
        optionD,
        correctAnswer,
        explanation: explanation || undefined,
        difficulty: dto.difficulty,
        examType: dto.examType,
        subjectId: dto.subjectId,
        topicId: dto.topicId || undefined,
      },
      include: {
        subject: true,
        topic: true,
      },
    });
  }

  /**
   * ============================================================
   * ADMIN
   * GET ALL QUESTIONS
   * ============================================================
   */
  async findAll() {
    return this.prisma.question.findMany({
      include: {
        subject: true,
        topic: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * ============================================================
   * TEACHER
   * GET QUESTIONS FOR ASSIGNED SUBJECTS
   * ============================================================
   */
  async teacherQuestions(teacherId: string) {
    return this.prisma.question.findMany({
      where: {
        subject: {
          teacherId,
          isActive: true,
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

  /**
   * ============================================================
   * GET ONE QUESTION
   * ============================================================
   */
  async findOne(id: string) {
    const question = await this.prisma.question.findUnique({
      where: {
        id,
      },
      include: {
        subject: true,
        topic: true,
      },
    });

    if (!question) {
      throw new NotFoundException('Question not found.');
    }

    return question;
  }

  /**
   * ============================================================
   * DELETE QUESTION
   * ============================================================
   *
   * A question that has already been used in an exam must not be
   * physically deleted because ExamQuestion and ExamAnswer may
   * contain historical records referencing it.
   */
  async remove(id: string) {
    const question = await this.prisma.question.findUnique({
      where: {
        id,
      },
      include: {
        _count: {
          select: {
            examQuestions: true,
            examAnswers: true,
          },
        },
      },
    });

    if (!question) {
      throw new NotFoundException('Question not found.');
    }

    if (question._count.examQuestions > 0 || question._count.examAnswers > 0) {
      throw new ConflictException(
        'This question cannot be deleted because it is already associated with exam data.',
      );
    }

    return this.prisma.question.delete({
      where: {
        id,
      },
    });
  }
}
