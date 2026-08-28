import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../contexts/AuthContext";

export default function useAdminAuth() {
  const router = useRouter();
  const { user, token } = useAuth();

  useEffect(() => {
    if (!router.isReady) return;

    if (!token || !user) {
      router.replace("/admin-login");
      return;
    }

    if (user.role !== "ADMIN") {
      if (user.role === "TEACHER") {
        router.replace("/teacher");
        return;
      }

      if (user.role === "STUDENT") {
        router.replace("/dashboard");
        return;
      }

      router.replace("/admin-login");
    }
  }, [user, token, router]);

  return { user };
}
