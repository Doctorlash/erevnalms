import { ReactNode } from "react";
import Image from "next/image";

import MessageWidget from "../components/messaging/MessageWidget";
import TeacherSidebar from "../components/sidebar/TeacherSidebar";
import { useAuth } from "../contexts/AuthContext";
import LogoutButton from "../components/LogoutButton";

interface Props {
  children: ReactNode;
}

export default function TeacherLayout({ children }: Props) {
  const { user } = useAuth();

  const initials =
    `${user?.firstName?.charAt(0) || ""}${user?.lastName?.charAt(0) || ""}`.toUpperCase() ||
    "T";

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      {/* SIDEBAR */}
      <aside className="hidden h-screen w-72 shrink-0 flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 text-white shadow-2xl lg:flex">
        {/* BRAND */}
        <div className="shrink-0 border-b border-white/10 px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-md" />

              <Image
                src="/logo.png"
                alt="Erevna Logo"
                width={50}
                height={50}
                className="relative rounded-full object-cover ring-2 ring-white/10"
              />
            </div>

            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight">Erevna</h1>

              <p className="truncate text-xs text-slate-400">
                Learning Management System
              </p>
            </div>
          </div>
        </div>

        {/* TEACHER PROFILE */}
        <div className="shrink-0 px-5 py-5">
          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-lg font-bold text-white shadow-lg ring-2 ring-white/10">
                {initials}
              </div>

              <div className="min-w-0">
                <p className="truncate font-semibold text-white">
                  {user?.firstName || "Teacher"} {user?.lastName || ""}
                </p>

                <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Teacher
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* NAVIGATION */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 [scrollbar-color:#475569_transparent] [scrollbar-width:thin]">
          <div className="mb-3 flex items-center gap-2 px-3">
            <span className="h-px flex-1 bg-white/10" />

            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
              Teaching
            </p>

            <span className="h-px flex-1 bg-white/10" />
          </div>

          <TeacherSidebar />
        </div>

        {/* FOOTER */}
        <div className="shrink-0 border-t border-white/10 px-5 py-4">
          <p className="text-center text-xs text-slate-500">
            © {new Date().getFullYear()} Erevna LMS
          </p>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {/* HEADER */}
        <header className="sticky top-0 z-30 shrink-0 border-b border-slate-200 bg-white/90 shadow-sm backdrop-blur-xl">
          <div className="flex h-20 items-center justify-between px-5 sm:px-6 lg:px-8">
            {/* WELCOME */}
            <div className="min-w-0">
              <p className="mb-0.5 text-xs font-semibold uppercase tracking-wider text-emerald-600 sm:text-sm">
                Teacher Portal
              </p>

              <h1 className="truncate text-lg font-bold text-slate-800 sm:text-xl">
                Welcome back, {user?.firstName || "Teacher"} 👋
              </h1>
            </div>

            {/* HEADER ACTIONS */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* NOTIFICATIONS */}
              <button
                type="button"
                aria-label="Notifications"
                title="Notifications"
                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition-all hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14.857 17.082a23.848 23.848 0 0 1-5.714 0A2.25 2.25 0 0 1 7.25 14.85V11a4.75 4.75 0 1 1 9.5 0v3.85a2.25 2.25 0 0 1-1.893 2.232ZM9.75 20h4.5"
                  />
                </svg>
              </button>

              <div className="hidden h-8 w-px bg-slate-200 sm:block" />

              {/* USER */}
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-sm font-bold text-white shadow-md ring-2 ring-emerald-100">
                  {initials}
                </div>

                <div className="hidden min-w-0 md:block">
                  <p className="max-w-[150px] truncate text-sm font-semibold text-slate-700">
                    {user?.firstName || "Teacher"} {user?.lastName || ""}
                  </p>

                  <p className="text-xs text-slate-400">Teacher</p>
                </div>

                <LogoutButton className="rounded-xl px-3 py-2.5 text-left text-red-600 transition-colors hover:bg-red-50" />
              </div>
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-[1600px]">{children}</div>
        </main>
      </div>

      <MessageWidget />
    </div>
  );
}
