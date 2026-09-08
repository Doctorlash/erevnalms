import { Module } from '@nestjs/common';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SubjectsModule } from './subjects/subjects.module';
import { LessonsModule } from './lessons/lessons.module';
import { TopicsModule } from './topics/topics.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { ProgressModule } from './progress/progress.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { QuestionsModule } from './questions/questions.module';
import { MailModule } from './mail/mail.module';
import { ExamsModule } from './exams/exams.module';
import { TeacherApplicationsModule } from './teacher-applications/teacher-applications.module';
import { ExamAttemptsModule } from './exam-attempts/exam-attempts.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { PaymentsModule } from './payments/payments.module';
import { LiveClassesModule } from './live-classes/live-classes.module';
import { AssignmentsModule } from './assignments/assignments.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { NotificationsModule } from './notifications/notifications.module';
import { TeacherDashboardModule } from './teacher-dashboard/teacher-dashboard.module';
import { StudentDashboardModule } from './student-dashboard/student-dashboard.module';
import { AdminDashboardModule } from './admin-dashboard/admin-dashboard.module';
import { CertificatesModule } from './certificates/certificates.module';
import { LeaderboardsModule } from './leaderboards/leaderboards.module';
import { AiRecommendationsModule } from './ai-recommendations/ai-recommendations.module';
import { CommunityModule } from './community/community.module';
import { MessagesModule } from './messages/messages.module';
import { PresenceModule } from './presence/presence.module';
import { ProfileModule } from './profile/profile.module';
import { ContactModule } from './contact/contact.module';
import { ResourcesModule } from './resources/resources.module';
import { SubjectRequestsService } from './subject-requests/subject-requests.service';
import { SubjectRequestsModule } from './subject-requests/subject-requests.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    SubjectsModule,
    LessonsModule,
    TopicsModule,
    EnrollmentsModule,
    ProgressModule,
    DashboardModule,
    QuestionsModule,
    TeacherApplicationsModule,
    ExamsModule,
    ExamAttemptsModule,
    AnalyticsModule,
    SubscriptionsModule,
    PaymentsModule,
    LiveClassesModule,
    AssignmentsModule,
    AnnouncementsModule,
    NotificationsModule,
    TeacherDashboardModule,
    StudentDashboardModule,
    AdminDashboardModule,
    CertificatesModule,
    LeaderboardsModule,
    AiRecommendationsModule,
    CommunityModule,
    MessagesModule,
    PresenceModule,
    ProfileModule,
    MailModule,
    ContactModule,
    ResourcesModule,
    SubjectRequestsModule,
  ],
  providers: [SubjectRequestsService],
})
export class AppModule {}
