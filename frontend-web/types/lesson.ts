export interface Lesson {
  id: string;
  title: string;
  description?: string;
  content: string;
  videoUrl?: string;
  duration?: number;
  topicId: string;
}
