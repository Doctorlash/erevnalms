import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../contexts/AuthContext";

export default function useTeacherAuth() {
  const router = useRouter();
  const { user, token } = useAuth();

  useEffect(() => {
    if (!router.isReady) return;

    if (!token || !user) {
      router.replace("/teacher-login");
      return;
    }

    if (user.role !== "TEACHER") {
      if (user.role === "ADMIN") {
        router.replace("/admin");
        return;
      }

      if (user.role === "STUDENT") {
        router.replace("/dashboard");
        return;
      }

      router.replace("/teacher-login");
    }
  }, [user, token, router]);

  return { user };
}
