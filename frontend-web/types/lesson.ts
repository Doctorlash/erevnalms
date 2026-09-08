export interface Lesson {
  id: string;
  title: string;
  description?: string | null;
  content: string;
  videoUrl?: string | null;
  duration?: number | null;

  topicId: string;
  subjectId?: string | null;

  isPublished?: boolean;
  isPremium?: boolean;

  status?: "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "REJECTED";

  createdAt?: string;
  updatedAt?: string;

  approvedAt?: string | null;
  rejectionReason?: string | null;
}
