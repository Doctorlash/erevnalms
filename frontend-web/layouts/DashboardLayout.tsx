import { ReactNode } from "react";
import Image from "next/image";

import { useAuth } from "../contexts/AuthContext";

import StudentSidebar from "../components/sidebar/StudentSidebar";
import TeacherSidebar from "../components/sidebar/TeacherSidebar";
import AdminSidebar from "../components/sidebar/AdminSidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  const renderSidebar = () => {
    if (!user) return null;

    switch (user.role) {
      case "ADMIN":
        return <AdminSidebar />;

      case "TEACHER":
        return <TeacherSidebar />;

      default:
        return <StudentSidebar />;
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-100">
      {/* Sidebar */}

      <aside className="w-72 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 text-white shadow-2xl flex flex-col">
        {/* Logo Section */}

        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Erevna Logo"
              width={55}
              height={55}
              className="rounded-full"
            />

            <div>
              <h2 className="text-2xl font-bold">Erevna</h2>

              <p className="text-xs text-slate-300">Leadership Academy</p>
            </div>
          </div>
        </div>

        {/* User Card */}

        <div className="p-5">
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-yellow-500 flex items-center justify-center text-black font-bold text-lg">
                {user?.firstName?.charAt(0)}
              </div>

              <div>
                <p className="font-semibold">
                  {user?.firstName} {user?.lastName}
                </p>

                <p className="text-sm text-slate-300">{user?.role}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Links */}

        <div className="flex-1 px-4 pb-6 overflow-y-auto">
          {renderSidebar()}
        </div>

        {/* Footer */}

        <div className="border-t border-slate-700 p-4 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} Erevna LMS
        </div>
      </aside>

      {/* Main Content */}

      <div className="flex-1 flex flex-col">
        {/* Top Header */}

        <header className="bg-white shadow-sm px-8 py-4 border-b">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="font-bold text-xl text-slate-800">Welcome Back</h1>

              <p className="text-sm text-slate-500">Learn. Lead. Succeed.</p>
            </div>

            <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium">
              {user?.role}
            </div>
          </div>
        </header>

        {/* Page Content */}

        <main className="flex-1 p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
