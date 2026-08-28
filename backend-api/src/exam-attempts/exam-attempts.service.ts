import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CertificatesService } from '../certificates/certificates.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExamAttemptsService {
  constructor(
    private prisma: PrismaService,
    private certificatesService: CertificatesService,
  ) {}

  async startExam(examId: string, userId: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    return this.prisma.examAttempt.create({
      data: {
        examId,
        userId,
      },
    });
  }

  async submitAnswer(
    attemptId: string,
    questionId: string,
    selectedAnswer: string,
  ) {
    const question = await this.prisma.question.findUnique({
      where: { id: questionId },
    });

    if (!question) {
      throw new NotFoundException('Question not found');
    }

    const isCorrect = question.correctAnswer === selectedAnswer;

    return this.prisma.examAnswer.upsert({
      where: {
        attemptId_questionId: {
          attemptId,
          questionId,
        },
      },
      create: {
        attemptId,
        questionId,
        selectedAnswer,
        isCorrect,
      },
      update: {
        selectedAnswer,
        isCorrect,
      },
    });
  }

  async finishExam(attemptId: string) {
    const attempt = await this.prisma.examAttempt.findUnique({
      where: {
        id: attemptId,
      },
      include: {
        answers: true,
      },
    });

    if (!attempt) {
      throw new NotFoundException('Attempt not found');
    }

    if (attempt.completed) {
      throw new BadRequestException('Exam already submitted');
    }

    const correctAnswers = attempt.answers.filter(
      (answer) => answer.isCorrect,
    ).length;

    const score = correctAnswers;

    const completedAttempt = await this.prisma.examAttempt.update({
      where: {
        id: attemptId,
      },
      data: {
        score,
        completed: true,
        submittedAt: new Date(),
      },
      include: {
        exam: true,
        user: true,
      },
    });

    // =========================================================
    // AUTOMATIC CERTIFICATE GENERATION
    // =========================================================

    const certificate =
      await this.certificatesService.generateForPassedExam(attemptId);

    return {
      ...completedAttempt,
      certificate,
    };
  }

  async findAllAttempts() {
    return this.prisma.examAttempt.findMany({
      include: {
        user: true,
        exam: true,
      },
      orderBy: {
        startedAt: 'desc',
      },
    });
  }

  async getAttemptsByExam(examId: string) {
    return this.prisma.examAttempt.findMany({
      where: {
        examId,
      },
      include: {
        user: true,
        exam: true,
      },
      orderBy: {
        startedAt: 'desc',
      },
    });
  }
  async getTeacherAnalytics(teacherId: string) {
    const attempts = await this.prisma.examAttempt.findMany({
      where: {
        exam: {
          subject: {
            teacherId,
          },
        },
        completed: true,
      },

      include: {
        user: true,

        exam: {
          include: {
            subject: true,
          },
        },
      },
    });

    const totalAttempts = attempts.length;

    const scores = attempts.map((a) => a.score);

    const averageScore =
      scores.length > 0
        ? Math.round(
            scores.reduce((sum, score) => sum + score, 0) / scores.length,
          )
        : 0;

    const highestScore = scores.length > 0 ? Math.max(...scores) : 0;

    const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;

    const passRate =
      totalAttempts > 0
        ? Math.round(
            (attempts.filter((a) => a.score >= 50).length / totalAttempts) *
              100,
          )
        : 0;

    const topStudents = [...attempts]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((attempt) => ({
        studentId: attempt.user.id,
        name: `${attempt.user.firstName} ${attempt.user.lastName}`,
        score: attempt.score,
        exam: attempt.exam.title,
      }));

    const weakStudents = [...attempts]
      .filter((attempt) => attempt.score < 50)
      .sort((a, b) => a.score - b.score)
      .slice(0, 10)
      .map((attempt) => ({
        studentId: attempt.user.id,
        name: `${attempt.user.firstName} ${attempt.user.lastName}`,
        score: attempt.score,
        exam: attempt.exam.title,
      }));

    const subjectMap = new Map<
      string,
      {
        total: number;
        count: number;
      }
    >();

    attempts.forEach((attempt) => {
      const subjectName = attempt.exam.subject.name;

      if (!subjectMap.has(subjectName)) {
        subjectMap.set(subjectName, {
          total: 0,
          count: 0,
        });
      }

      const current = subjectMap.get(subjectName)!;

      current.total += attempt.score;
      current.count += 1;
    });

    const subjectPerformance = Array.from(subjectMap.entries()).map(
      ([subject, data]) => ({
        subject,
        average: Math.round(data.total / data.count),
      }),
    );

    const examMap = new Map<
      string,
      {
        title: string;
        total: number;
        count: number;
      }
    >();

    attempts.forEach((attempt) => {
      const examId = attempt.exam.id;

      if (!examMap.has(examId)) {
        examMap.set(examId, {
          title: attempt.exam.title,
          total: 0,
          count: 0,
        });
      }

      const current = examMap.get(examId)!;

      current.total += attempt.score;
      current.count += 1;
    });

    const examPerformance = Array.from(examMap.values()).map((exam) => ({
      title: exam.title,
      average: Math.round(exam.total / exam.count),
    }));

    const bestExam =
      examPerformance.length > 0
        ? [...examPerformance].sort((a, b) => b.average - a.average)[0]
        : null;

    const worstExam =
      examPerformance.length > 0
        ? [...examPerformance].sort((a, b) => a.average - b.average)[0]
        : null;

    return {
      totalAttempts,
      averageScore,
      highestScore,
      lowestScore,
      passRate,

      topStudents,
      weakStudents,

      subjectPerformance,

      bestExam,
      worstExam,

      attempts,
    };
  }
}
