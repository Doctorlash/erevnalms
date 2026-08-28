import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommunityService {
  constructor(private prisma: PrismaService) {}

  // =========================================================
  // COMMUNITY POSTS
  // =========================================================

  async createPost(data: {
    userId: string;
    title: string;
    content: string;
    subjectId?: string;
  }) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: data.userId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (data.subjectId) {
      const subject = await this.prisma.subject.findUnique({
        where: {
          id: data.subjectId,
        },
      });

      if (!subject) {
        throw new NotFoundException('Subject not found');
      }
    }

    return this.prisma.communityPost.create({
      data,
      include: {
        user: true,
        subject: true,
      },
    });
  }

  async getAllPosts() {
    return this.prisma.communityPost.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            role: true,
          },
        },

        subject: true,

        comments: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profileImage: true,
                role: true,
              },
            },
          },
        },

        likes: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getPost(id: string) {
    const post = await this.prisma.communityPost.findUnique({
      where: {
        id,
      },

      include: {
        user: true,
        subject: true,

        comments: {
          include: {
            user: true,
          },
        },

        likes: true,
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    // Keep comments in chronological order
    post.comments.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

    return post;
  }

  async getSubjectPosts(subjectId: string) {
    const subject = await this.prisma.subject.findUnique({
      where: {
        id: subjectId,
      },
    });

    if (!subject) {
      throw new NotFoundException('Subject not found');
    }

    return this.prisma.communityPost.findMany({
      where: {
        subjectId,
      },

      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            role: true,
          },
        },

        subject: true,

        comments: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profileImage: true,
                role: true,
              },
            },
          },
        },

        likes: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  // =========================================================
  // COMMENTS
  // =========================================================

  async addComment(data: { postId: string; userId: string; content: string }) {
    const post = await this.prisma.communityPost.findUnique({
      where: {
        id: data.postId,
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const user = await this.prisma.user.findUnique({
      where: {
        id: data.userId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!data.content.trim()) {
      throw new BadRequestException('Comment cannot be empty');
    }

    return this.prisma.communityComment.create({
      data: {
        postId: data.postId,
        userId: data.userId,
        content: data.content.trim(),
      },

      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            role: true,
          },
        },
      },
    });
  }

  // =========================================================
  // LIKES
  // =========================================================

  async likePost(postId: string, userId: string) {
    const post = await this.prisma.communityPost.findUnique({
      where: {
        id: postId,
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found');
    }

    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existing = await this.prisma.communityLike.findFirst({
      where: {
        postId,
        userId,
      },
    });

    if (existing) {
      throw new BadRequestException('Already liked');
    }

    return this.prisma.communityLike.create({
      data: {
        postId,
        userId,
      },
    });
  }

  async unlikePost(postId: string, userId: string) {
    const result = await this.prisma.communityLike.deleteMany({
      where: {
        postId,
        userId,
      },
    });

    return {
      success: true,
      removed: result.count > 0,
    };
  }

  // =========================================================
  // DISCUSSION THREADS
  // =========================================================

  async createDiscussion(data: {
    userId: string;
    title: string;
    content: string;
    subjectId?: string;
  }) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: data.userId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!data.title.trim()) {
      throw new BadRequestException('Discussion title is required');
    }

    if (!data.content.trim()) {
      throw new BadRequestException('Discussion content is required');
    }

    if (data.subjectId) {
      const subject = await this.prisma.subject.findUnique({
        where: {
          id: data.subjectId,
        },
      });

      if (!subject) {
        throw new NotFoundException('Subject not found');
      }
    }

    return this.prisma.discussionThread.create({
      data: {
        userId: data.userId,
        title: data.title.trim(),
        content: data.content.trim(),
        subjectId: data.subjectId,
      },

      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            role: true,
          },
        },

        subject: true,

        replies: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profileImage: true,
                role: true,
              },
            },
          },
        },
      },
    });
  }

  async getAllDiscussions() {
    return this.prisma.discussionThread.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            role: true,
          },
        },

        subject: true,

        replies: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profileImage: true,
                role: true,
              },
            },
          },
        },
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getDiscussion(id: string) {
    const discussion = await this.prisma.discussionThread.findUnique({
      where: {
        id,
      },

      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            role: true,
          },
        },

        subject: true,

        replies: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profileImage: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!discussion) {
      throw new NotFoundException('Discussion not found');
    }

    // Keep replies in chronological order
    discussion.replies.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

    return discussion;
  }

  async addDiscussionReply(data: {
    threadId: string;
    userId: string;
    content: string;
  }) {
    const discussion = await this.prisma.discussionThread.findUnique({
      where: {
        id: data.threadId,
      },
    });

    if (!discussion) {
      throw new NotFoundException('Discussion thread not found');
    }

    const user = await this.prisma.user.findUnique({
      where: {
        id: data.userId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!data.content.trim()) {
      throw new BadRequestException('Reply cannot be empty');
    }

    return this.prisma.discussionReply.create({
      data: {
        threadId: data.threadId,
        userId: data.userId,
        content: data.content.trim(),
      },

      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            role: true,
          },
        },
      },
    });
  }

  // =========================================================
  // STUDY GROUPS
  // =========================================================

  async createStudyGroup(data: {
    name: string;
    description?: string;
    createdBy: string;
  }) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: data.createdBy,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!data.name.trim()) {
      throw new BadRequestException('Group name is required');
    }

    const group = await this.prisma.studyGroup.create({
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        createdBy: data.createdBy,
      },

      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profileImage: true,
                role: true,
              },
            },
          },
        },
      },
    });

    // Automatically make the creator the first member.
    await this.prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId: data.createdBy,
      },
    });

    return this.prisma.studyGroup.findUnique({
      where: {
        id: group.id,
      },

      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profileImage: true,
                role: true,
              },
            },
          },
        },
      },
    });
  }

  async getAllStudyGroups() {
    return this.prisma.studyGroup.findMany({
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profileImage: true,
                role: true,
              },
            },
          },

          orderBy: {
            joinedAt: 'asc',
          },
        },
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getStudyGroup(id: string) {
    const group = await this.prisma.studyGroup.findUnique({
      where: {
        id,
      },

      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profileImage: true,
                role: true,
              },
            },
          },
        },
      },
    });

    if (!group) {
      throw new NotFoundException('Study group not found');
    }

    return group;
  }

  async joinStudyGroup(groupId: string, userId: string) {
    const group = await this.prisma.studyGroup.findUnique({
      where: {
        id: groupId,
      },
    });

    if (!group) {
      throw new NotFoundException('Study group not found');
    }

    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existing = await this.prisma.groupMember.findFirst({
      where: {
        groupId,
        userId,
      },
    });

    if (existing) {
      throw new BadRequestException('You are already a member of this group');
    }

    return this.prisma.groupMember.create({
      data: {
        groupId,
        userId,
      },

      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            role: true,
          },
        },

        group: true,
      },
    });
  }

  async leaveStudyGroup(groupId: string, userId: string) {
    const group = await this.prisma.studyGroup.findUnique({
      where: {
        id: groupId,
      },
    });

    if (!group) {
      throw new NotFoundException('Study group not found');
    }

    const membership = await this.prisma.groupMember.findFirst({
      where: {
        groupId,
        userId,
      },
    });

    if (!membership) {
      throw new BadRequestException('You are not a member of this group');
    }

    // Prevent the group creator from accidentally leaving
    // their own group.
    if (group.createdBy === userId) {
      throw new BadRequestException('The group creator cannot leave the group');
    }

    await this.prisma.groupMember.delete({
      where: {
        id: membership.id,
      },
    });

    return {
      success: true,
      message: 'You have left the study group',
    };
  }

  async getStudyGroupMembers(groupId: string) {
    const group = await this.prisma.studyGroup.findUnique({
      where: {
        id: groupId,
      },
    });

    if (!group) {
      throw new NotFoundException('Study group not found');
    }

    return this.prisma.groupMember.findMany({
      where: {
        groupId,
      },

      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profileImage: true,
            role: true,
          },
        },
      },

      orderBy: {
        joinedAt: 'asc',
      },
    });
  }
}
