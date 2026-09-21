/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @next/next/no-img-element */

import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/router";

import MessageWidget from "../components/messaging/MessageWidget";
import StudentSidebar from "../components/sidebar/StudentSidebar";
import LogoutButton from "../components/LogoutButton";
import { useAuth } from "../contexts/AuthContext";
import api from "../services/api";
import useSidebarScroll from "../hooks/useSidebarScroll";

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

  const desktopSidebarRef = useRef<HTMLDivElement | null>(null);

  const mobileSidebarRef = useRef<HTMLDivElement | null>(null);

  useSidebarScroll(desktopSidebarRef, "erevna-student-sidebar-desktop-scroll");

  useSidebarScroll(mobileSidebarRef, "erevna-student-sidebar-mobile-scroll");

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
    <div className="flex h-screen overflow-hidden bg-slate-100">
      {/* DESKTOP SIDEBAR */}

      <aside className="relative hidden h-screen w-72 shrink-0 flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 text-white shadow-2xl lg:flex">
        <div className="pointer-events-none absolute left-0 right-0 top-0 h-40 bg-blue-500/10 blur-3xl" />

        {/* LOGO */}

        <div className="relative shrink-0 border-b border-white/10 px-6 py-6">
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

              <p className="mt-0.5 text-[11px] tracking-wide text-slate-400">
                Learning Management System
              </p>
            </div>
          </div>
        </div>

        {/* STUDENT PROFILE */}

        <div className="relative shrink-0 p-5">
          <div className="group rounded-2xl border border-white/10 bg-white/[0.06] p-4 transition-all duration-200 hover:border-white/15 hover:bg-white/[0.09]">
            <div className="flex items-center gap-3">
              <div className="relative shrink-0">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt={`${firstName} ${lastName}`.trim() || "Student"}
                    className="h-12 w-12 rounded-full object-cover shadow-lg shadow-blue-900/30 ring-2 ring-white/10"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-cyan-400 text-lg font-bold text-white shadow-lg shadow-blue-900/30">
                    {initials}
                  </div>
                )}

                <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-slate-900 bg-emerald-400" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-white">
                  {firstName} {lastName}
                </p>

                <div className="mt-1.5 flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-400/10 bg-blue-500/15 px-2.5 py-0.5 text-[11px] font-semibold text-blue-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                    Student
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* NAVIGATION */}

        <div
          ref={desktopSidebarRef}
          className="custom-scrollbar relative min-h-0 flex-1 overflow-y-auto px-4 pb-6"
        >
          <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
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

            <p className="text-[11px] font-medium text-slate-500">
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
        className={`fixed inset-y-0 left-0 z-[70] w-[290px] max-w-[85vw] transform bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 text-white shadow-2xl transition-transform duration-300 ease-out lg:hidden ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Student navigation"
      >
        <div className="flex h-full flex-col">
          {/* MOBILE HEADER */}

          <div className="shrink-0 border-b border-white/10 px-5 py-5">
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
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
                aria-label="Close navigation menu"
              >
                <CloseIcon />
              </button>
            </div>
          </div>

          {/* MOBILE PROFILE */}

          <div className="shrink-0 p-5">
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt={`${firstName} ${lastName}`.trim() || "Student"}
                      className="h-11 w-11 rounded-full object-cover ring-1 ring-white/10"
                    />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-cyan-400 font-bold text-white">
                      {initials}
                    </div>
                  )}

                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-slate-900 bg-emerald-400" />
                </div>

                <div className="min-w-0">
                  <p className="truncate font-semibold">
                    {firstName} {lastName}
                  </p>

                  <p className="mt-0.5 text-xs text-slate-400">
                    Student account
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* MOBILE NAVIGATION */}

          <div
            ref={mobileSidebarRef}
            className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-6"
          >
            <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
              My Learning
            </p>

            <div onClick={() => setMobileMenuOpen(false)}>
              <StudentSidebar />
            </div>
          </div>

          {/* MOBILE FOOTER */}

          <div className="shrink-0 border-t border-white/10 px-5 py-4">
            <p className="text-center text-[11px] text-slate-500">
              © {new Date().getFullYear()} Erevna LMS
            </p>
          </div>
        </div>
      </aside>

      {/* MAIN APPLICATION */}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {/* HEADER */}

        <header className="sticky top-0 z-30 shrink-0 border-b border-slate-200/80 bg-white/90 shadow-[0_1px_12px_rgba(15,23,42,0.04)] backdrop-blur-xl">
          <div className="flex min-h-[72px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            {/* LEFT */}

            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-700 transition hover:bg-slate-200 lg:hidden"
                aria-label="Open navigation menu"
              >
                <MenuIcon />
              </button>

              <div className="min-w-0">
                <p className="mb-0.5 hidden text-[11px] font-bold uppercase tracking-[0.16em] text-indigo-600 sm:block">
                  Student Portal
                </p>

                <h1 className="truncate text-base font-bold text-slate-900 sm:text-xl">
                  Welcome back, {firstName}{" "}
                  <span className="hidden sm:inline">👋</span>
                </h1>
              </div>
            </div>

            {/* RIGHT */}

            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
              {/* NOTIFICATIONS */}

              <button
                type="button"
                onClick={openNotifications}
                className={`group relative flex h-11 w-11 items-center justify-center rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                  unreadCount > 0
                    ? "border-indigo-200 bg-indigo-50 text-indigo-600 hover:border-indigo-300 hover:bg-indigo-100"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
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
                  <span className="absolute -right-2 -top-2 flex h-[21px] min-w-[21px] items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[10px] font-extrabold text-white shadow-sm">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}

                {unreadCount > 0 && (
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-indigo-50" />
                )}

                {notificationsLoading && unreadCount === 0 && (
                  <span className="absolute right-2 top-2 h-2 w-2 animate-pulse rounded-full bg-slate-300" />
                )}
              </button>

              <div className="mx-1 hidden h-8 w-px bg-slate-200 sm:block" />

              {/* DESKTOP USER */}

              <div className="hidden items-center gap-3 sm:flex">
                <div className="hidden text-right md:block">
                  <p className="leading-tight text-sm font-semibold text-slate-800">
                    {firstName} {lastName}
                  </p>

                  <p className="mt-0.5 text-[11px] text-slate-400">Student</p>
                </div>

                <div className="relative">
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt={`${firstName} ${lastName}`.trim() || "Student"}
                      className="h-10 w-10 rounded-full object-cover shadow-sm ring-2 ring-indigo-100"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-cyan-400 font-bold text-white shadow-sm">
                      {initials}
                    </div>
                  )}

                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-400" />
                </div>
              </div>

              {/* MOBILE USER */}

              <div className="relative sm:hidden">
                {profileImage ? (
                  <img
                    src={profileImage}
                    alt={`${firstName} ${lastName}`.trim() || "Student"}
                    className="h-10 w-10 rounded-full object-cover ring-2 ring-indigo-100"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-indigo-500 to-cyan-400 font-bold text-white">
                    {initials}
                  </div>
                )}

                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-emerald-400" />
              </div>

              {/* LOGOUT */}

              <div className="ml-1">
                <LogoutButton className="group flex h-11 w-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-600 transition-all duration-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600 sm:w-auto sm:px-4" />
              </div>
            </div>
          </div>
        </header>

        {/* CONTENT */}

        <main className="custom-scrollbar min-h-0 flex-1 overflow-y-auto bg-slate-100 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-[1600px]">{children}</div>
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
