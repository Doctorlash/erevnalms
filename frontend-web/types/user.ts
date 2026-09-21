export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "ADMIN" | "TEACHER" | "STUDENT";
  profileImage?: string | null;
}
