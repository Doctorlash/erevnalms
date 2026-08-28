import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../contexts/AuthContext";

export default function useRequireAuth() {
  const { user, token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!router.isReady) return;

    if (!token || !user) {
      router.replace("/login");
      return;
    }

    if (user.role !== "STUDENT") {
      if (user.role === "TEACHER") {
        router.replace("/teacher");
        return;
      }

      if (user.role === "ADMIN") {
        router.replace("/admin");
        return;
      }

      router.replace("/login");
    }
  }, [user, token, router]);

  return { user };
}
