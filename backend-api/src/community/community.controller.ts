import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';

import { CommunityService } from './community.service';

@Controller('community')
export class CommunityController {
  constructor(private readonly service: CommunityService) {}

  // =========================================================
  // COMMUNITY POSTS
  // =========================================================

  @Post()
  createPost(
    @Body()
    body: {
      userId: string;
      title: string;
      content: string;
      subjectId?: string;
    },
  ) {
    return this.service.createPost(body);
  }

  @Get()
  getPosts() {
    return this.service.getAllPosts();
  }

  @Get('subject/:subjectId')
  getSubjectPosts(@Param('subjectId') subjectId: string) {
    return this.service.getSubjectPosts(subjectId);
  }

  @Get(':id')
  getPost(@Param('id') id: string) {
    return this.service.getPost(id);
  }

  // =========================================================
  // COMMENTS
  // =========================================================

  @Post('comment')
  addComment(
    @Body()
    body: {
      postId: string;
      userId: string;
      content: string;
    },
  ) {
    return this.service.addComment(body);
  }

  // =========================================================
  // LIKES
  // =========================================================

  @Post('like')
  likePost(
    @Body()
    body: {
      postId: string;
      userId: string;
    },
  ) {
    return this.service.likePost(body.postId, body.userId);
  }

  @Delete('like')
  unlikePost(
    @Body()
    body: {
      postId: string;
      userId: string;
    },
  ) {
    return this.service.unlikePost(body.postId, body.userId);
  }

  // =========================================================
  // DISCUSSION THREADS
  // =========================================================

  @Post('discussions')
  createDiscussion(
    @Body()
    body: {
      userId: string;
      title: string;
      content: string;
      subjectId?: string;
    },
  ) {
    return this.service.createDiscussion(body);
  }

  @Get('discussions')
  getDiscussions() {
    return this.service.getAllDiscussions();
  }

  @Get('discussions/:id')
  getDiscussion(@Param('id') id: string) {
    return this.service.getDiscussion(id);
  }

  @Post('discussions/reply')
  addDiscussionReply(
    @Body()
    body: {
      threadId: string;
      userId: string;
      content: string;
    },
  ) {
    return this.service.addDiscussionReply(body);
  }

  // =========================================================
  // STUDY GROUPS
  // =========================================================

  @Post('groups')
  createStudyGroup(
    @Body()
    body: {
      name: string;
      description?: string;
      createdBy: string;
    },
  ) {
    return this.service.createStudyGroup(body);
  }

  @Get('groups')
  getStudyGroups() {
    return this.service.getAllStudyGroups();
  }

  @Get('groups/:id')
  getStudyGroup(@Param('id') id: string) {
    return this.service.getStudyGroup(id);
  }

  @Post('groups/:id/join')
  joinStudyGroup(
    @Param('id') groupId: string,
    @Body()
    body: {
      userId: string;
    },
  ) {
    return this.service.joinStudyGroup(groupId, body.userId);
  }

  @Delete('groups/:id/leave')
  leaveStudyGroup(
    @Param('id') groupId: string,
    @Body()
    body: {
      userId: string;
    },
  ) {
    return this.service.leaveStudyGroup(groupId, body.userId);
  }

  @Get('groups/:id/members')
  getStudyGroupMembers(@Param('id') groupId: string) {
    return this.service.getStudyGroupMembers(groupId);
  }
}
