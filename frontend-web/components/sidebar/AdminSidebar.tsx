import Link from "next/link";
import { useRouter } from "next/router";

export default function AdminSidebar() {
  const router = useRouter();

  const menuItems = [
    {
      name: "Dashboard",
      href: "/dashboard/admin",
      icon: "🏠",
    },
    {
      name: "Users",
      href: "/dashboard/admin/users",
      icon: "👥",
    },
    {
      name: "Students",
      href: "/dashboard/admin/students",
      icon: "🎓",
    },
    {
      name: "Teachers",
      href: "/dashboard/admin/teachers",
      icon: "👨‍🏫",
    },
    {
      name: "Subscriptions",
      href: "/dashboard/admin/subscriptions",
      icon: "💳",
    },
    {
      name: "Contact Messages",
      href: "/dashboard/admin/contact",
      icon: "📧",
    },
    {
      name: "Subjects",
      href: "/dashboard/admin/subjects",
      icon: "📚",
    },
    {
      name: "Teacher Application",
      href: "/dashboard/admin/teacher-applications",
      icon: "📝",
    },
    {
      name: "subject Requests",
      href: "/dashboard/admin/subject-requests",
      icon: "📩",
    },
    {
      name: "Topics",
      href: "/dashboard/admin/topics",
      icon: "🗂️",
    },
    {
      name: "Lessons",
      href: "/dashboard/admin/lessons",
      icon: "📖",
    },
    {
      name: "Questions",
      href: "/dashboard/admin/questions",
      icon: "❓",
    },
    {
      name: "Exams",
      href: "/dashboard/admin/exams",
      icon: "🎯",
    },
    {
      name: "Results",
      href: "/dashboard/admin/results",
      icon: "📊",
    },
    {
      name: "Analytics",
      href: "/dashboard/admin/analytics",
      icon: "📈",
    },
  ];

  return (
    <nav className="flex flex-col gap-2">
      {menuItems.map((item) => {
        const active = router.pathname === item.href;

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
          </Link>
        );
      })}
    </nav>
  );
}
