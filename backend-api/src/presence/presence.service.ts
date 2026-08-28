import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PresenceService {
  constructor(private prisma: PrismaService) {}

  async goOnline(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        isOnline: true,
      },
    });
  }

  async goOffline(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        isOnline: false,
        lastSeen: new Date(),
      },
    });
  }

  async status(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        isOnline: true,
        lastSeen: true,
      },
    });
  }
}
