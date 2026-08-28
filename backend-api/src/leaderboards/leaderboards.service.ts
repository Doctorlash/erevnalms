import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LeaderboardsService {
  constructor(private prisma: PrismaService) {}

  async overallLeaderboard() {
    const students = await this.prisma.user.findMany({
      where: {
        role: 'STUDENT',
      },
      include: {
        examAttempts: true,
      },
    });

    const leaderboard = students.map((student) => {
      const attempts = student.examAttempts.filter((a) => a.completed);

      const averageScore =
        attempts.length > 0
          ? Math.round(
              attempts.reduce((sum, item) => sum + item.score, 0) /
                attempts.length,
            )
          : 0;

      return {
        id: student.id,
        firstName: student.firstName,
        lastName: student.lastName,
        averageScore,
        examsTaken: attempts.length,
      };
    });

    return leaderboard.sort((a, b) => b.averageScore - a.averageScore);
  }

  async topStudents() {
    return this.overallLeaderboard();
  }
}
