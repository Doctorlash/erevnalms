import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "../contexts/AuthContext";

export default function useStudentAuth() {
  const router = useRouter();
  const { user, token } = useAuth();

  useEffect(() => {
    if (!user) {
      router.replace("/login");
      return;
    }

    if (user.role !== "STUDENT") {
      router.replace("/");
    }
  }, [user, router]);

  return {
    user,
    token,
  };
}
