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

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* SIDEBAR */}
      <aside className="hidden lg:flex w-72 shrink-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 text-white shadow-2xl flex-col">
        {/* Logo */}
        <div className="px-6 py-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Erevna Logo"
              width={52}
              height={52}
              className="rounded-full"
            />

            <div>
              <h1 className="text-2xl font-bold">Erevna</h1>

              <p className="text-xs text-slate-400">
                Learning Management System
              </p>
            </div>
          </div>
        </div>

        {/* Teacher profile */}
        <div className="p-5">
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold text-lg">
                {user?.firstName?.charAt(0)?.toUpperCase() || "T"}
              </div>

              <div className="min-w-0">
                <p className="font-semibold truncate">
                  {user?.firstName} {user?.lastName}
                </p>

                <span className="inline-flex mt-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-medium">
                  Teacher
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-4 pb-6 overflow-y-auto">
          <p className="px-3 mb-3 text-[11px] uppercase tracking-widest text-slate-500 font-semibold">
            Teaching
          </p>

          <TeacherSidebar />
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 px-5 py-4">
          <p className="text-xs text-slate-500 text-center">
            © {new Date().getFullYear()} Erevna LMS
          </p>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* HEADER */}
        <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm">
          <div className="h-20 px-6 lg:px-8 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Teacher Portal</p>

              <h1 className="text-xl font-bold text-slate-800">
                Welcome back, {user?.firstName || "Teacher"} 👋
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <button
                className="h-10 w-10 rounded-xl bg-slate-100 hover:bg-slate-200 transition"
                title="Notifications"
              >
                🔔
              </button>

              <div className="h-8 w-px bg-slate-200" />

              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white font-bold">
                {user?.firstName?.charAt(0)?.toUpperCase() || "T"}
              </div>
              <LogoutButton className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 rounded-lg" />
            </div>
          </div>
        </header>

        {/* CONTENT */}
        <main className="flex-1 p-5 sm:p-6 lg:p-8">
          <div className="max-w-[1600px] mx-auto">{children}</div>
        </main>
      </div>
      <MessageWidget />
    </div>
  );
}
