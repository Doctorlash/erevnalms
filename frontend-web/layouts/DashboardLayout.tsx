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

  return (
    <div className="h-screen overflow-hidden flex bg-slate-100">
      {/* ============================================================
          SIDEBAR
          ============================================================ */}
      <aside className="hidden lg:flex w-72 shrink-0 h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 text-white shadow-2xl flex-col">
        {/* LOGO */}
        <div className="shrink-0 p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Erevna Logo"
              width={55}
              height={55}
              className="rounded-full object-cover"
            />

            <div className="min-w-0">
              <h2 className="text-2xl font-bold">Erevna</h2>

              <p className="text-xs text-slate-300">Leadership Academy</p>
            </div>
          </div>
        </div>

        {/* USER CARD */}
        <div className="shrink-0 p-5">
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 shrink-0 rounded-full bg-yellow-500 flex items-center justify-center text-black font-bold text-lg">
                {user?.firstName?.charAt(0)?.toUpperCase() || "U"}
              </div>

              <div className="min-w-0">
                <p className="font-semibold truncate">
                  {user?.firstName} {user?.lastName}
                </p>

                <p className="text-sm text-slate-300">{user?.role}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================
            SIDEBAR NAVIGATION
            THIS AREA SCROLLS INDEPENDENTLY
            ============================================================ */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-6 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent">
          {renderSidebar()}
        </div>

        {/* FOOTER */}
        <div className="shrink-0 border-t border-slate-700 p-4 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} Erevna LMS
        </div>
      </aside>

      {/* ============================================================
          MAIN AREA
          ============================================================ */}
      <div className="flex-1 min-w-0 h-screen flex flex-col overflow-hidden">
        {/* TOP HEADER */}
        <header className="shrink-0 h-20 bg-white shadow-sm px-6 lg:px-8 border-b border-slate-200">
          <div className="h-full flex justify-between items-center">
            {/* LEFT */}
            <div>
              <h1 className="font-bold text-xl text-slate-800">Welcome Back</h1>

              <p className="text-sm text-slate-500">Learn. Lead. Succeed.</p>
            </div>

            {/* RIGHT */}
            <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">
              {user?.role}
            </div>
          </div>
        </header>

        {/* ============================================================
            PAGE CONTENT
            THIS AREA SCROLLS INDEPENDENTLY FROM SIDEBAR
            ============================================================ */}
        <main className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 lg:p-8">
          <div className="max-w-[1600px] mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
