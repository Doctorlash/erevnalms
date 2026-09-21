import { useEffect } from "react";
import { useRouter } from "next/router";

import { useAuth } from "../contexts/AuthContext";

export default function useAdminAuth() {
  const router = useRouter();

  const { user, token, isHydrated } = useAuth();

  useEffect(() => {
    if (!router.isReady || !isHydrated) {
      return;
    }

    if (!token || !user) {
      router.replace("/admin-login");
      return;
    }

    if (user.role === "ADMIN") {
      return;
    }

    if (user.role === "TEACHER") {
      router.replace("/dashboard/teacher");
      return;
    }

    if (user.role === "STUDENT") {
      router.replace("/dashboard");
      return;
    }

    router.replace("/admin-login");
  }, [router.isReady, isHydrated, token, user, router]);

  return {
    user,
    token,
    isHydrated,
    isAuthorized: isHydrated && Boolean(token && user?.role === "ADMIN"),
  };
}
