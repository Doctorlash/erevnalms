import { useState } from "react";
import { useRouter } from "next/router";

import { useAuth } from "../contexts/AuthContext";

interface LogoutButtonProps {
  className?: string;
}

export default function LogoutButton({ className = "" }: LogoutButtonProps) {
  const router = useRouter();

  const { user, logout } = useAuth();

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);

    const role = user?.role;

    logout();

    if (role === "ADMIN") {
      router.replace("/admin-login");
      return;
    }

    if (role === "TEACHER") {
      router.replace("/teacher-login");
      return;
    }

    router.replace("/login");
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isLoggingOut}
      aria-label="Sign out"
      className={`
        group
        flex w-full items-center gap-3
        rounded-xl
        px-4 py-3
        text-left
        font-semibold
        text-slate-300
        transition-all duration-200
        hover:bg-red-500/10
        hover:text-red-300
        disabled:cursor-not-allowed
        disabled:opacity-60
        ${className}
      `}
    >
      <span
        className="
          flex h-9 w-9 shrink-0
          items-center justify-center
          rounded-lg
          bg-slate-800
          text-base
          transition-colors
          group-hover:bg-red-500/20
        "
      >
        {isLoggingOut ? "⏳" : "🚪"}
      </span>

      <span>{isLoggingOut ? "Signing out..." : "Sign Out"}</span>
    </button>
  );
}
