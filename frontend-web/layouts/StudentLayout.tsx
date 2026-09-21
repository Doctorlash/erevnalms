/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @next/next/no-img-element */

import { ReactNode, useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";

import MessageWidget from "../components/messaging/MessageWidget";
import StudentSidebar from "../components/sidebar/StudentSidebar";
import LogoutButton from "../components/LogoutButton";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";

interface Props {
  children: ReactNode;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function StudentLayout({ children }: Props) {
  const { user } = useAuth();
  const router = useRouter();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  const firstName = user?.firstName || "Student";
  const lastName = user?.lastName || "";
  const userId = user?.id;

  const initials =
    `${user?.firstName?.charAt(0) || ""}${user?.lastName?.charAt(0) || ""}`
      .trim()
      .toUpperCase() || "S";

  const profileImage = user?.profileImage || "";

  const loadNotificationCount = useCallback(async () => {
    if (!userId) {
      setUnreadCount(0);
      return;
    }

    try {
      setNotificationsLoading(true);

      const response = await api.get<Notification[]>(
        `/notifications/user/${userId}`,
      );

      const notifications = Array.isArray(response.data) ? response.data : [];

      const count = notifications.filter(
        (notification) => !notification.isRead,
      ).length;

      setUnreadCount(count);
    } catch (error) {
      console.error("Failed to load notification count:", error);
    } finally {
      setNotificationsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId) {
      setUnreadCount(0);
      return;
    }

    loadNotificationCount();

    const interval = window.setInterval(() => {
      loadNotificationCount();
    }, 30000);

    return () => {
      window.clearInterval(interval);
    };
  }, [userId, loadNotificationCount]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadNotificationCount();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [loadNotificationCount]);

  const openNotifications = () => {
    setMobileMenuOpen(false);
    router.push("/dashboard/notifications");
  };

  return (
    <div className="h-screen overflow-hidden bg-slate-100 flex">
      {/* DESKTOP SIDEBAR */}

      <aside className="hidden lg:flex h-screen w-72 shrink-0 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 text-white shadow-2xl flex-col relative">
        <div className="pointer-events-none absolute top-0 left-0 right-0 h-40 bg-blue-500/10 blur-3xl" />

        {/* LOGO */}

        <div className="relative shrink-0 px-6 py-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="absolute inset-0 rounded-2xl bg-blue-500/30 blur-md" />

              <Image
                src="/logo.png"
                alt="Erevna Logo"
                width={52}
                height={52}
                className="relative rounded-2xl object-cover ring-1 ring-white/10"
              />
            </div>

            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold tracking-tight">Erevna</h1>

              <p className="text-[11px] text-slate-400 mt-0.5 tracking-wide">
                Learning Management System
              </p>
            </div>
          </div>
        </div>

        {/* STUDENT PROFILE */}

        <div className="relative shrink-0 p-5">
          <div className="group rounded-2xl bg-white/[0.06] border border-white/10 p-4 transition-all duration-200 hover:bg-white/[0.09] hover:border-white/15">
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt={`${firstName} ${lastName}`.trim() || "Student"}
                    className="h-12 w-12 rounded-full object-cover shadow-lg shadow-blue-900/30 ring-2 ring-white/10"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-cyan-400 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-900/30">
                    {initials}
                  </div>
                )}

                <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-emerald-400 border-2 border-slate-900" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="font-semibold text-white truncate">
                  {firstName} {lastName}
                </p>

                <div className="flex items-center gap-2 mt-1.5">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/15 border border-blue-400/10 px-2.5 py-0.5 text-[11px] font-semibold text-blue-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                    Student
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* NAVIGATION */}

        <div className="relative min-h-0 flex-1 overflow-y-auto px-4 pb-6 custom-scrollbar">
          <p className="px-3 mb-3 text-[10px] uppercase tracking-[0.18em] text-slate-500 font-bold">
            My Learning
          </p>

          <div className="rounded-2xl">
            <StudentSidebar />
          </div>
        </div>

        {/* FOOTER */}

        <div className="relative shrink-0 border-t border-white/10 px-5 py-4">
          <div className="flex items-center justify-center gap-2">
            <div className="h-1 w-1 rounded-full bg-blue-400" />

            <p className="text-[11px] text-slate-500 font-medium">
              © {new Date().getFullYear()} Erevna LMS
            </p>

            <div className="h-1 w-1 rounded-full bg-blue-400" />
          </div>
        </div>
      </aside>

      {/* MOBILE SIDEBAR OVERLAY */}

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-[60] bg-slate-950/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* MOBILE SIDEBAR */}

      <aside
        className={`fixed inset-y-0 left-0 z-[70] w-[290px] max-w-[85vw] bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 text-white shadow-2xl transform transition-transform duration-300 ease-out lg:hidden ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Student navigation"
      >
        <div className="h-full flex flex-col">
          <div className="shrink-0 px-5 py-5 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Image
                  src="/logo.png"
                  alt="Erevna Logo"
                  width={46}
                  height={46}
                  className="rounded-2xl object-cover"
                />

                <div>
                  <h2 className="text-xl font-extrabold tracking-tight">
                    Erevna
                  </h2>

                  <p className="text-[10px] text-slate-400">Student Portal</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 hover:bg-white/10 hover:text-white transition"
                aria-label="Close navigation menu"
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          <div className="shrink-0 p-5">
            <div className="rounded-2xl bg-white/[0.06] border border-white/10 p-4">
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt={`${firstName} ${lastName}`.trim() || "Student"}
                      className="h-11 w-11 rounded-full object-cover ring-1 ring-white/10"
                    />
                  ) : (
                    <div className="h-11 w-11 rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-cyan-400 flex items-center justify-center text-white font-bold">
                      {initials}
                    </div>
                  )}

                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-400 border-2 border-slate-900" />
                </div>

                <div className="min-w-0">
                  <p className="font-semibold truncate">
                    {firstName} {lastName}
                  </p>

                  <p className="text-xs text-slate-400 mt-0.5">
                    Student account
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6 custom-scrollbar">
            <p className="px-3 mb-3 text-[10px] uppercase tracking-[0.18em] text-slate-500 font-bold">
              My Learning
            </p>

            <div onClick={() => setMobileMenuOpen(false)}>
              <StudentSidebar />
            </div>
          </div>

          <div className="shrink-0 border-t border-white/10 px-5 py-4">
            <p className="text-[11px] text-slate-500 text-center">
              © {new Date().getFullYear()} Erevna LMS
            </p>
          </div>
        </div>
      </aside>

      {/* MAIN APPLICATION */}

      <div className="min-w-0 min-h-0 flex-1 flex flex-col">
        <header className="shrink-0 sticky top-0 z-30 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_1px_12px_rgba(15,23,42,0.04)]">
          <div className="min-h-[72px] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
            {/* LEFT */}

            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden h-11 w-11 shrink-0 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center hover:bg-slate-200 transition"
                aria-label="Open navigation menu"
              >
                <MenuIcon />
              </button>

              <div className="min-w-0">
                <p className="hidden sm:block text-[11px] uppercase tracking-[0.16em] font-bold text-indigo-600 mb-0.5">
                  Student Portal
                </p>

                <h1 className="text-base sm:text-xl font-bold text-slate-900 truncate">
                  Welcome back, {firstName}{" "}
                  <span className="hidden sm:inline">👋</span>
                </h1>
              </div>
            </div>

            {/* RIGHT */}

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* NOTIFICATIONS */}

              <button
                type="button"
                onClick={openNotifications}
                className={`group relative h-11 w-11 rounded-xl border flex items-center justify-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                  unreadCount > 0
                    ? "bg-indigo-50 border-indigo-200 text-indigo-600 hover:bg-indigo-100 hover:border-indigo-300"
                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600"
                }`}
                title={
                  unreadCount > 0
                    ? `${unreadCount} unread notification${
                        unreadCount === 1 ? "" : "s"
                      }`
                    : "Notifications"
                }
                aria-label={
                  unreadCount > 0
                    ? `${unreadCount} unread notification${
                        unreadCount === 1 ? "" : "s"
                      }. Open notifications`
                    : "Open notifications"
                }
              >
                <BellIcon />

                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 min-w-[21px] h-[21px] px-1 rounded-full bg-red-500 text-white text-[10px] font-extrabold flex items-center justify-center border-2 border-white shadow-sm">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}

                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-indigo-50" />
                )}

                {notificationsLoading && unreadCount === 0 && (
                  <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-slate-300 animate-pulse" />
                )}
              </button>

              <div className="hidden sm:block h-8 w-px bg-slate-200 mx-1" />

              {/* DESKTOP USER */}

              <div className="hidden sm:flex items-center gap-3">
                <div className="text-right hidden md:block">
                  <p className="text-sm font-semibold text-slate-800 leading-tight">
                    {firstName} {lastName}
                  </p>

                  <p className="text-[11px] text-slate-400 mt-0.5">Student</p>
                </div>

                <div className="relative">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt={`${firstName} ${lastName}`.trim() || "Student"}
                      className="h-10 w-10 rounded-full object-cover shadow-sm ring-2 ring-indigo-100"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-cyan-400 flex items-center justify-center text-white font-bold shadow-sm">
                      {initials}
                    </div>
                  )}

                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-white" />
                </div>
              </div>

              {/* MOBILE USER */}

              <div className="sm:hidden relative">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt={`${firstName} ${lastName}`.trim() || "Student"}
                    className="h-10 w-10 rounded-full object-cover ring-2 ring-indigo-100"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-cyan-400 flex items-center justify-center text-white font-bold">
                    {initials}
                  </div>
                )}

                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-white" />
              </div>

              {/* LOGOUT */}

              <div className="ml-1">
                <LogoutButton className="group h-11 w-11 sm:w-auto px-3 sm:px-4 rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition-all duration-200 flex items-center justify-center gap-2 font-semibold text-sm" />
              </div>
            </div>
          </div>
        </header>

        {/* CONTENT */}

        <main className="min-h-0 flex-1 overflow-y-auto bg-slate-100 p-4 sm:p-6 lg:p-8 custom-scrollbar">
          <div className="max-w-[1600px] mx-auto w-full">{children}</div>
        </main>
      </div>

      <MessageWidget />

      <style jsx global>{`
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: rgba(100, 116, 139, 0.35) transparent;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(100, 116, 139, 0.35);
          border-radius: 999px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(71, 85, 105, 0.55);
        }
      `}</style>
    </div>
  );
}

function BellIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5 transition-transform duration-200 group-hover:scale-105"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9a6 6 0 0 0-12 0v.75a8.967 8.967 0 0 1-2.312 6.022 23.848 23.848 0 0 0 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
      />
    </svg>
  );
}

function MenuIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 6h16M4 12h16M4 18h16"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 6l12 12M18 6L6 18"
      />
    </svg>
  );
}
