import { useRouter } from "next/router";
import { useAuth } from "../contexts/AuthContext";

interface LogoutButtonProps {
  className?: string;
}

export default function LogoutButton({ className = "" }: LogoutButtonProps) {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      // Clear authentication/session
      await logout();

      // Explicitly redirect to the login page
      await router.replace("/login");
    } catch (error) {
      console.error("Logout failed:", error);

      // Even if logout encounters an error,
      // send the user back to login.
      router.replace("/login");
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className={`flex items-center gap-2 ${className}`}
    >
      <span>🚪</span>
      <span>Sign Out</span>
    </button>
  );
}
