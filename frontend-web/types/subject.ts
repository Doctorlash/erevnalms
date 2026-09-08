export interface SubjectTeacher {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

export interface Subject {
  id: string;
  name: string;
  description?: string;
  programme: "JAMB" | "WAEC";
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  teacherId?: string | null;
  teacher?: SubjectTeacher | null;

  _count?: {
    enrollments?: number;
    topics?: number;
  };
}
