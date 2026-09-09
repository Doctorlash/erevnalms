import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { MessagesGateway } from './messages.gateway';

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: MessagesGateway,
  ) {}

  /**
   * ============================================================
   * INTERNAL AUTHORIZATION HELPERS
   * ============================================================
   */

  private async getActiveUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        role: true,
        isActive: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found.');
    }

    if (!user.isActive) {
      throw new ForbiddenException('Your account is inactive.');
    }

    return user;
  }

  private async ensureConversationParticipant(
    conversationId: string,
    userId: string,
  ) {
    const conversation = await this.prisma.conversation.findUnique({
      where: {
        id: conversationId,
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found.');
    }

    const isParticipant =
      conversation.participantOneId === userId ||
      conversation.participantTwoId === userId;

    if (!isParticipant) {
      throw new ForbiddenException(
        'You are not a participant in this conversation.',
      );
    }

    return conversation;
  }

  /**
   * Verify that two users have an existing messaging relationship.
   *
   * STUDENT:
   * - teacher teaching an enrolled subject
   * - student enrolled in at least one common subject
   *
   * TEACHER:
   * - student enrolled in a subject taught by the teacher
   *
   * NOTE:
   * The current Prisma schema assigns one teacher to each Subject
   * through Subject.teacherId. Therefore two different teachers
   * cannot currently teach the same Subject. Teacher-to-teacher
   * messaging is consequently not authorized by a shared subject.
   */
  private async canUsersMessage(
    userOneId: string,
    userTwoId: string,
  ): Promise<boolean> {
    const users = await this.prisma.user.findMany({
      where: {
        id: {
          in: [userOneId, userTwoId],
        },
      },
      select: {
        id: true,
        role: true,
        isActive: true,
      },
    });

    if (users.length !== 2 || users.some((user) => !user.isActive)) {
      return false;
    }

    const userOne = users.find((user) => user.id === userOneId);
    const userTwo = users.find((user) => user.id === userTwoId);

    if (!userOne || !userTwo) {
      return false;
    }

    /**
     * Student <-> Teacher
     */
    if (
      (userOne.role === 'STUDENT' && userTwo.role === 'TEACHER') ||
      (userOne.role === 'TEACHER' && userTwo.role === 'STUDENT')
    ) {
      const studentId = userOne.role === 'STUDENT' ? userOneId : userTwoId;

      const teacherId = userOne.role === 'TEACHER' ? userOneId : userTwoId;

      const relationship = await this.prisma.enrollment.findFirst({
        where: {
          userId: studentId,
          subject: {
            teacherId,
            isActive: true,
          },
        },
        select: {
          id: true,
        },
      });

      return !!relationship;
    }

    /**
     * Student <-> Student
     */
    if (userOne.role === 'STUDENT' && userTwo.role === 'STUDENT') {
      const commonSubject = await this.prisma.enrollment.findFirst({
        where: {
          userId: userOneId,
          subject: {
            isActive: true,
            enrollments: {
              some: {
                userId: userTwoId,
              },
            },
          },
        },
        select: {
          id: true,
        },
      });

      return !!commonSubject;
    }

    /**
     * Teacher <-> Teacher
     *
     * Subject.teacherId supports only one teacher per subject.
     * Therefore two different teachers cannot currently share
     * the same subject assignment.
     */
    if (userOne.role === 'TEACHER' && userTwo.role === 'TEACHER') {
      return false;
    }

    return false;
  }

  /**
   * ============================================================
   * CREATE / GET CONVERSATION
   * ============================================================
   */

  async createConversation(
    actorId: string,
    participantOneId: string,
    participantTwoId: string,
  ) {
    if (!participantOneId || !participantTwoId) {
      throw new BadRequestException('Both participants are required.');
    }

    if (participantOneId === participantTwoId) {
      throw new BadRequestException(
        'A user cannot have a conversation with themselves.',
      );
    }

    if (actorId !== participantOneId && actorId !== participantTwoId) {
      throw new ForbiddenException(
        'You can only create a conversation involving your own account.',
      );
    }

    await this.getActiveUser(actorId);

    const users = await this.prisma.user.findMany({
      where: {
        id: {
          in: [participantOneId, participantTwoId],
        },
      },
      select: {
        id: true,
        role: true,
        isActive: true,
      },
    });

    if (users.length !== 2) {
      throw new NotFoundException('One or both participants do not exist.');
    }

    if (users.some((user) => !user.isActive)) {
      throw new ForbiddenException('One or both participants are inactive.');
    }

    const permitted = await this.canUsersMessage(
      participantOneId,
      participantTwoId,
    );

    if (!permitted) {
      throw new ForbiddenException(
        'These users are not permitted to start a conversation.',
      );
    }

    const existing = await this.prisma.conversation.findFirst({
      where: {
        OR: [
          {
            participantOneId,
            participantTwoId,
          },
          {
            participantOneId: participantTwoId,
            participantTwoId: participantOneId,
          },
        ],
      },
    });

    if (existing) {
      const isParticipant =
        existing.participantOneId === actorId ||
        existing.participantTwoId === actorId;

      if (!isParticipant) {
        throw new ForbiddenException(
          'You are not a participant in this conversation.',
        );
      }

      return existing;
    }

    return this.prisma.conversation.create({
      data: {
        participantOneId,
        participantTwoId,
      },
      include: {
        participantOne: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            profileImage: true,
          },
        },
        participantTwo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            profileImage: true,
          },
        },
      },
    });
  }

  /**
   * Student -> Teacher conversation
   */

  async startConversation(studentId: string, teacherId: string) {
    const student = await this.prisma.user.findFirst({
      where: {
        id: studentId,
        role: 'STUDENT',
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    if (!student) {
      throw new ForbiddenException(
        'Only an active student can start a student-teacher conversation.',
      );
    }

    const teacher = await this.prisma.user.findFirst({
      where: {
        id: teacherId,
        role: 'TEACHER',
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found or inactive.');
    }

    return this.createConversation(studentId, studentId, teacherId);
  }

  /**
   * ============================================================
   * SEND MESSAGE
   * ============================================================
   */

  async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    fileUrl?: string,
    fileName?: string,
    fileType?: string,
    fileSize?: number,
  ) {
    await this.getActiveUser(senderId);

    const conversation = await this.ensureConversationParticipant(
      conversationId,
      senderId,
    );

    if (!content?.trim() && !fileUrl) {
      throw new BadRequestException(
        'A message must contain text or an attachment.',
      );
    }

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId,
        content: content?.trim() || '',
        fileUrl: fileUrl || null,
        fileName: fileName || null,
        fileType: fileType || null,
        fileSize: fileSize ?? null,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            profileImage: true,
          },
        },
        reactions: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    this.gateway.sendMessage(conversation.id, message);

    return message;
  }

  /**
   * ============================================================
   * GET SINGLE CONVERSATION
   * ============================================================
   */

  async getConversation(conversationId: string, userId: string) {
    await this.ensureConversationParticipant(conversationId, userId);

    const conversation = await this.prisma.conversation.findUnique({
      where: {
        id: conversationId,
      },
      include: {
        participantOne: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            profileImage: true,
            isOnline: true,
            lastSeen: true,
          },
        },
        participantTwo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            profileImage: true,
            isOnline: true,
            lastSeen: true,
          },
        },
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                role: true,
                profileImage: true,
              },
            },
            reactions: {
              include: {
                user: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found.');
    }

    return conversation;
  }

  /**
   * ============================================================
   * USER CONVERSATIONS
   * ============================================================
   */

  async getUserConversations(userId: string) {
    await this.getActiveUser(userId);

    return this.prisma.conversation.findMany({
      where: {
        OR: [
          {
            participantOneId: userId,
          },
          {
            participantTwoId: userId,
          },
        ],
      },
      include: {
        participantOne: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            profileImage: true,
            isOnline: true,
            lastSeen: true,
          },
        },
        participantTwo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            profileImage: true,
            isOnline: true,
            lastSeen: true,
          },
        },
        messages: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * ============================================================
   * TEACHER INBOX
   * ============================================================
   */

  async teacherInbox(teacherId: string) {
    const teacher = await this.prisma.user.findFirst({
      where: {
        id: teacherId,
        role: 'TEACHER',
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    if (!teacher) {
      throw new ForbiddenException(
        'Only an active teacher can access the teacher inbox.',
      );
    }

    return this.prisma.conversation.findMany({
      where: {
        OR: [
          {
            participantOneId: teacherId,
          },
          {
            participantTwoId: teacherId,
          },
        ],
      },
      include: {
        participantOne: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            role: true,
            isOnline: true,
            lastSeen: true,
          },
        },
        participantTwo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            role: true,
            isOnline: true,
            lastSeen: true,
          },
        },
        messages: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * ============================================================
   * SEARCH CONVERSATIONS
   * ============================================================
   */

  async searchConversations(userId: string, search: string) {
    await this.getActiveUser(userId);

    const term = search.trim();

    if (!term) {
      return this.getUserConversations(userId);
    }

    return this.prisma.conversation.findMany({
      where: {
        AND: [
          {
            OR: [
              {
                participantOneId: userId,
              },
              {
                participantTwoId: userId,
              },
            ],
          },
          {
            OR: [
              {
                participantOne: {
                  firstName: {
                    contains: term,
                    mode: 'insensitive',
                  },
                },
              },
              {
                participantOne: {
                  lastName: {
                    contains: term,
                    mode: 'insensitive',
                  },
                },
              },
              {
                participantTwo: {
                  firstName: {
                    contains: term,
                    mode: 'insensitive',
                  },
                },
              },
              {
                participantTwo: {
                  lastName: {
                    contains: term,
                    mode: 'insensitive',
                  },
                },
              },
              {
                messages: {
                  some: {
                    content: {
                      contains: term,
                      mode: 'insensitive',
                    },
                  },
                },
              },
            ],
          },
        ],
      },
      include: {
        participantOne: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            profileImage: true,
            isOnline: true,
            lastSeen: true,
          },
        },
        participantTwo: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
            profileImage: true,
            isOnline: true,
            lastSeen: true,
          },
        },
        messages: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * ============================================================
   * MARK MESSAGE AS READ
   * ============================================================
   */

  async markAsRead(messageId: string, userId: string) {
    const message = await this.prisma.message.findUnique({
      where: {
        id: messageId,
      },
      include: {
        conversation: true,
      },
    });

    if (!message) {
      throw new NotFoundException('Message not found.');
    }

    const isParticipant =
      message.conversation.participantOneId === userId ||
      message.conversation.participantTwoId === userId;

    if (!isParticipant) {
      throw new ForbiddenException(
        'You are not a participant in this conversation.',
      );
    }

    if (message.senderId === userId) {
      throw new BadRequestException(
        'You cannot mark your own message as read.',
      );
    }

    const updated = await this.prisma.message.update({
      where: {
        id: messageId,
      },
      data: {
        isRead: true,
      },
    });

    this.gateway.server.to(message.conversationId).emit('messageRead', {
      messageId,
      userId,
    });

    return updated;
  }

  /**
   * ============================================================
   * UNREAD COUNT
   * ============================================================
   */

  async unreadCount(userId: string) {
    await this.getActiveUser(userId);

    const unread = await this.prisma.message.count({
      where: {
        isRead: false,
        senderId: {
          not: userId,
        },
        conversation: {
          OR: [
            {
              participantOneId: userId,
            },
            {
              participantTwoId: userId,
            },
          ],
        },
      },
    });

    return {
      unread,
    };
  }

  /**
   * ============================================================
   * GET TEACHERS
   * ============================================================
   */

  async getTeachers() {
    return this.prisma.user.findMany({
      where: {
        role: 'TEACHER',
        isActive: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        profileImage: true,
        school: true,
        bio: true,
        isOnline: true,
        lastSeen: true,
        teacherProfile: {
          select: {
            qualification: true,
            specialization: true,
            experience: true,
            officeHours: true,
            about: true,
          },
        },
      },
      orderBy: {
        firstName: 'asc',
      },
    });
  }

  /**
   * ============================================================
   * MESSAGE CONTACTS
   * ============================================================
   */

  async getMessageContacts(userId: string) {
    const currentUser = await this.getActiveUser(userId);

    if (currentUser.role === 'STUDENT') {
      const enrollments = await this.prisma.enrollment.findMany({
        where: {
          userId,
        },
        select: {
          subjectId: true,
        },
      });

      const subjectIds = enrollments.map((enrollment) => enrollment.subjectId);

      if (subjectIds.length === 0) {
        return {
          teachers: [],
          students: [],
        };
      }

      const subjects = await this.prisma.subject.findMany({
        where: {
          id: {
            in: subjectIds,
          },
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          teacherId: true,
        },
      });

      const teacherIds = [
        ...new Set(
          subjects
            .map((subject) => subject.teacherId)
            .filter((id): id is string => Boolean(id)),
        ),
      ];

      const classmates = await this.prisma.user.findMany({
        where: {
          id: {
            not: userId,
          },
          role: 'STUDENT',
          isActive: true,
          enrollments: {
            some: {
              subjectId: {
                in: subjectIds,
              },
            },
          },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          profileImage: true,
          classLevel: true,
          school: true,
          isOnline: true,
          lastSeen: true,
        },
        orderBy: {
          firstName: 'asc',
        },
      });

      const teachers = await this.prisma.user.findMany({
        where: {
          id: {
            in: teacherIds,
          },
          role: 'TEACHER',
          isActive: true,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          profileImage: true,
          school: true,
          bio: true,
          isOnline: true,
          lastSeen: true,
          teacherProfile: {
            select: {
              qualification: true,
              specialization: true,
              experience: true,
              officeHours: true,
              about: true,
            },
          },
        },
        orderBy: {
          firstName: 'asc',
        },
      });

      return {
        teachers,
        students: classmates,
      };
    }

    if (currentUser.role === 'TEACHER') {
      const subjects = await this.prisma.subject.findMany({
        where: {
          teacherId: userId,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
        },
      });

      const subjectIds = subjects.map((subject) => subject.id);

      if (subjectIds.length === 0) {
        return {
          teachers: [],
          students: [],
        };
      }

      const students = await this.prisma.user.findMany({
        where: {
          role: 'STUDENT',
          isActive: true,
          enrollments: {
            some: {
              subjectId: {
                in: subjectIds,
              },
            },
          },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          profileImage: true,
          classLevel: true,
          school: true,
          isOnline: true,
          lastSeen: true,
        },
        orderBy: {
          firstName: 'asc',
        },
      });

      const teachers = await this.prisma.user.findMany({
        where: {
          id: {
            not: userId,
          },
          role: 'TEACHER',
          isActive: true,
          teachingSubjects: {
            some: {
              id: {
                in: subjectIds,
              },
            },
          },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          profileImage: true,
          school: true,
          bio: true,
          isOnline: true,
          lastSeen: true,
          teacherProfile: {
            select: {
              qualification: true,
              specialization: true,
              experience: true,
              officeHours: true,
              about: true,
            },
          },
        },
        orderBy: {
          firstName: 'asc',
        },
      });

      return {
        teachers,
        students,
      };
    }

    return {
      teachers: [],
      students: [],
    };
  }

  /**
   * ============================================================
   * MESSAGE REACTIONS
   * ============================================================
   */

  async toggleReaction(messageId: string, userId: string, emoji: string) {
    if (!emoji?.trim()) {
      throw new BadRequestException('Emoji is required.');
    }

    const message = await this.prisma.message.findUnique({
      where: {
        id: messageId,
      },
      include: {
        conversation: true,
      },
    });

    if (!message) {
      throw new NotFoundException('Message not found.');
    }

    const isParticipant =
      message.conversation.participantOneId === userId ||
      message.conversation.participantTwoId === userId;

    if (!isParticipant) {
      throw new ForbiddenException(
        'You are not a participant in this conversation.',
      );
    }

    const existing = await this.prisma.messageReaction.findFirst({
      where: {
        messageId,
        userId,
        emoji,
      },
    });

    if (existing) {
      await this.prisma.messageReaction.delete({
        where: {
          id: existing.id,
        },
      });
    } else {
      await this.prisma.messageReaction.create({
        data: {
          messageId,
          userId,
          emoji,
        },
      });
    }

    const reactions = await this.prisma.messageReaction.findMany({
      where: {
        messageId,
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    this.gateway.server.to(message.conversationId).emit('reactionUpdated', {
      messageId,
      reactions,
    });

    return reactions;
  }
}
