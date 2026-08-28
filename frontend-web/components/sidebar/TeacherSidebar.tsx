import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";

export default function TeacherSidebar() {
  const router = useRouter();
  const { user } = useAuth();

  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const menuItems = [
    {
      name: "Dashboard",
      href: "/dashboard/teacher",
      icon: "🏠",
    },
    {
      name: "Profile",
      href: "/dashboard/teacher/profile",
      icon: "👤",
    },
    {
      name: "Subjects",
      href: "/dashboard/teacher/subjects",
      icon: "📚",
    },
    {
      name: "Topics",
      href: "/dashboard/teacher/topics",
      icon: "🗂️",
    },
    {
      name: "Lessons",
      href: "/dashboard/teacher/lessons",
      icon: "📖",
    },
    {
      name: "Community",
      href: "/dashboard/community",
      icon: "🏠",
    },
    {
      name: "Messages",
      href: "/dashboard/messages",
      icon: "💬",
    },
    {
      name: "Questions",
      href: "/dashboard/teacher/questions",
      icon: "❓",
    },
    {
      name: "Exams",
      href: "/dashboard/teacher/exams",
      icon: "🎯",
    },
    {
      name: "Resources",
      href: "/dashboard/teacher/resources",
      icon: "📚",
    },
    {
      name: "Results Analytics",
      href: "/dashboard/teacher/results",
      icon: "📊",
    },
    {
      name: "Assignments",
      href: "/dashboard/teacher/assignments",
      icon: "📝",
    },
    {
      name: "Submissions",
      href: "/dashboard/teacher/submissions",
      icon: "📥",
    },
    {
      name: "Live Classes",
      href: "/dashboard/teacher/live-classes",
      icon: "🎥",
    },
    {
      name: "Announcements",
      href: "/dashboard/teacher/announcements",
      icon: "📢",
    },
    {
      name: "Notifications",
      href: "/dashboard/teacher/notifications",
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

    const interval = setInterval(loadUnreadNotifications, 30000);

    return () => clearInterval(interval);
  }, [user?.id, router.pathname]);

  return (
    <nav className="flex flex-col gap-2">
      {menuItems.map((item) => {
        const active = router.pathname === item.href;

        const isNotificationItem =
          item.href === "/dashboard/teacher/notifications";

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

            <span className="flex-1">{item.name}</span>

            {isNotificationItem && unreadNotifications > 0 && (
              <span
                className={`
                    min-w-[22px]
                    h-[22px]
                    px-1.5
                    rounded-full
                    flex
                    items-center
                    justify-center
                    text-xs
                    font-bold
                    ${
                      active
                        ? "bg-white text-blue-600"
                        : "bg-red-500 text-white"
                    }
                  `}
              >
                {unreadNotifications > 99 ? "99+" : unreadNotifications}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
