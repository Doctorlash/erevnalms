import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";

export default function StudentSidebar() {
  const router = useRouter();
  const { user } = useAuth();

  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const menuItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: "🏠",
    },
    {
      name: "Profile",
      href: "/dashboard/profile",
      icon: "👤",
    },
    {
      name: "Subscription",
      href: "/dashboard/subscription",
      icon: "💳",
    },
    {
      name: "Community",
      href: "/dashboard/community",
      icon: "🌍",
    },
    {
      name: "Messages",
      href: "/dashboard/messages",
      icon: "💬",
    },
    {
      name: "Subjects",
      href: "/dashboard/subjects",
      icon: "📚",
    },
    {
      name: "Lessons",
      href: "/dashboard/lessons",
      icon: "📖",
    },
    {
      name: "Assignments",
      href: "/dashboard/assignments",
      icon: "📝",
    },
    {
      name: "CBT Exams",
      href: "/dashboard/cbt",
      icon: "🎯",
    },
    {
      name: "Results",
      href: "/dashboard/results",
      icon: "📊",
    },
    {
      name: "Resources",
      href: "/dashboard/resources",
      icon: "📚",
    },
    {
      name: "Certificates",
      href: "/dashboard/certificates",
      icon: "🏆",
    },
    {
      name: "Notifications",
      href: "/dashboard/notifications",
      icon: "🔔",
    },
  ];

  useEffect(() => {
    if (!user?.id) return;

    const loadUnreadNotifications = async () => {
      try {
        const response = await api.get(`/notifications/user/${user.id}/unread`);

        setUnreadNotifications(response.data?.unread ?? 0);
      } catch (error) {
        console.error("Failed to load notification count:", error);
      }
    };

    loadUnreadNotifications();

    // Refresh the badge periodically.
    const interval = setInterval(loadUnreadNotifications, 30000);

    return () => clearInterval(interval);
  }, [user?.id, router.pathname]);

  return (
    <nav className="flex flex-col gap-2">
      {menuItems.map((item) => {
        const active = router.pathname === item.href;
        const isNotificationItem = item.href === "/dashboard/notifications";

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`
              flex items-center gap-3
              px-4 py-3 rounded-xl
              transition-all duration-200
              font-medium
              ${
                active
                  ? "bg-blue-600 text-white shadow-lg"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }
            `}
          >
            <span className="text-lg">{item.icon}</span>

            <span>{item.name}</span>
            {isNotificationItem && unreadNotifications > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {unreadNotifications}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
