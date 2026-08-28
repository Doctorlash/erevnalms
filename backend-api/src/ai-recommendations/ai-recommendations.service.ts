import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AiRecommendationsService {
  constructor(private prisma: PrismaService) {}

  async recommendations(userId: string) {
    const attempts = await this.prisma.examAttempt.findMany({
      where: {
        userId,
        completed: true,
      },
      include: {
        answers: {
          include: {
            question: {
              include: {
                subject: true,
                topic: true,
              },
            },
          },
        },
      },
    });

    const progress = await this.prisma.lessonProgress.findMany({
      where: {
        userId,
      },
      include: {
        lesson: {
          include: {
            topic: true,
          },
        },
      },
    });

    const weakTopics: Record<string, number> = {};

    attempts.forEach((attempt) => {
      attempt.answers.forEach((answer) => {
        if (!answer.isCorrect) {
          const topic = answer.question.topic?.name || 'General';

          weakTopics[topic] = (weakTopics[topic] || 0) + 1;
        }
      });
    });

    const sortedWeakTopics = Object.entries(weakTopics)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const incompleteLessons = progress
      .filter((item) => !item.completed)
      .slice(0, 5);

    return {
      weakTopics: sortedWeakTopics.map(([topic, mistakes]) => ({
        topic,
        mistakes,
      })),

      recommendedLessons: incompleteLessons.map((lesson) => ({
        lessonId: lesson.lessonId,
        topic: lesson.lesson.topic.name,
      })),
    };
  }
}
