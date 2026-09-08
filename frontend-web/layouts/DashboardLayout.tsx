import { ReactNode } from "react";
import Image from "next/image";

import { useAuth } from "../contexts/AuthContext";

import StudentSidebar from "../components/sidebar/StudentSidebar";
import TeacherSidebar from "../components/sidebar/TeacherSidebar";
import AdminSidebar from "../components/sidebar/AdminSidebar";

interface Props {
  children: ReactNode;
}

export default function DashboardLayout({ children }: Props) {
  const { user } = useAuth();

  const initials =
    `${user?.firstName?.charAt(0) || ""}${user?.lastName?.charAt(0) || ""}`.toUpperCase() ||
    "U";

  const renderSidebar = () => {
    if (!user) return null;

    switch (user.role) {
      case "ADMIN":
        return <AdminSidebar />;

      case "TEACHER":
        return <TeacherSidebar />;

      case "STUDENT":
      default:
        return <StudentSidebar />;
    }
  };

  const roleLabel =
    user?.role === "ADMIN"
      ? "Administrator"
      : user?.role === "TEACHER"
        ? "Teacher"
        : "Student";

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      {/* SIDEBAR */}
      <aside className="hidden h-screen w-72 shrink-0 flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 text-white shadow-2xl lg:flex">
        {/* BRAND */}
        <div className="shrink-0 border-b border-white/10 p-6">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="absolute inset-0 rounded-full bg-yellow-400/20 blur-md" />

              <Image
                src="/logo.png"
                alt="Erevna Logo"
                width={52}
                height={52}
                className="relative rounded-full object-cover ring-2 ring-white/10"
              />
            </div>

            <div className="min-w-0">
              <h2 className="text-2xl font-bold tracking-tight">Erevna</h2>

              <p className="truncate text-xs text-slate-300">
                Leadership Academy
              </p>
            </div>
          </div>
        </div>

        {/* USER CARD */}
        <div className="shrink-0 p-5">
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 text-lg font-bold text-slate-950 shadow-lg ring-2 ring-white/10">
                {initials}
              </div>

              <div className="min-w-0">
                <p className="truncate font-semibold text-white">
                  {user?.firstName || "User"} {user?.lastName || ""}
                </p>

                <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-blue-500/15 px-2.5 py-1 text-xs font-medium text-blue-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                  {roleLabel}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* NAVIGATION */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 [scrollbar-color:#475569_transparent] [scrollbar-width:thin]">
          {renderSidebar()}
        </div>

        {/* FOOTER */}
        <div className="shrink-0 border-t border-white/10 p-4 text-center">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} Erevna LMS
          </p>
        </div>
      </aside>

      {/* MAIN AREA */}
      <div className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
        {/* HEADER */}
        <header className="shrink-0 border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur-xl">
          <div className="flex h-20 items-center justify-between px-5 sm:px-6 lg:px-8">
            {/* WELCOME */}
            <div className="min-w-0">
              <p className="mb-0.5 text-xs font-semibold uppercase tracking-wider text-blue-600 sm:text-sm">
                Erevna Portal
              </p>

              <h1 className="truncate text-lg font-bold text-slate-800 sm:text-xl">
                Welcome back, {user?.firstName || "User"} 👋
              </h1>

              <p className="hidden text-sm text-slate-500 sm:block">
                Learn. Lead. Succeed.
              </p>
            </div>

            {/* ROLE */}
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 sm:flex">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                {roleLabel}
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white shadow-md ring-2 ring-blue-100">
                {initials}
              </div>
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-[1600px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
