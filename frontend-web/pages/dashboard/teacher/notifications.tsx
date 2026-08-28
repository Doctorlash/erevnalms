import { useEffect, useState } from "react";

import TeacherLayout from "../../../layouts/TeacherLayout";
import useRequireAuth from "../../../hooks/useRequireAuth";
import { useAuth } from "../../../contexts/AuthContext";

import api from "../../../services/api";

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function TeacherNotificationsPage() {
  useRequireAuth();

  const { user } = useAuth();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      const response = await api.get(`/notifications/user/${user.id}`);

      setNotifications(response.data);
    } catch (error) {
      console.error("Failed to load notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadNotifications();
    }
  }, [user?.id]);

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);

      setNotifications((previous) =>
        previous.map((notification) =>
          notification.id === id
            ? {
                ...notification,
                isRead: true,
              }
            : notification,
        ),
      );
    } catch (error) {
      console.error(error);
    }
  };

  const markAllAsRead = async () => {
    if (!user?.id) return;

    try {
      await api.patch(`/notifications/user/${user.id}/read-all`);

      setNotifications((previous) =>
        previous.map((notification) => ({
          ...notification,
          isRead: true,
        })),
      );
    } catch (error) {
      console.error(error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`);

      setNotifications((previous) =>
        previous.filter((notification) => notification.id !== id),
      );
    } catch (error) {
      console.error(error);
    }
  };

  const unreadCount = notifications.filter(
    (notification) => !notification.isRead,
  ).length;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("en-NG", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  return (
    <TeacherLayout>
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-indigo-700">Notifications</h1>

          <p className="text-gray-500 mt-2">
            Stay updated with your teaching activities.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={markAllAsRead}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-xl font-semibold"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5 mb-6">
        <p className="text-indigo-700 font-semibold">
          {unreadCount === 0
            ? "You have no unread notifications."
            : `You have ${unreadCount} unread notification${
                unreadCount === 1 ? "" : "s"
              }.`}
        </p>
      </div>

      {loading && (
        <div className="bg-white rounded-2xl shadow p-8 text-center">
          <p className="text-gray-500">Loading notifications...</p>
        </div>
      )}

      {!loading && notifications.length === 0 && (
        <div className="bg-white rounded-2xl shadow p-10 text-center">
          <div className="text-5xl mb-4">🔔</div>

          <h2 className="text-xl font-bold text-gray-800">No notifications</h2>

          <p className="text-gray-500 mt-2">You are all caught up.</p>
        </div>
      )}

      {!loading && notifications.length > 0 && (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`rounded-2xl border p-5 shadow-sm ${
                notification.isRead
                  ? "bg-white border-gray-200"
                  : "bg-indigo-50 border-indigo-200"
              }`}
            >
              <div className="flex gap-4">
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center ${
                    notification.isRead ? "bg-gray-100" : "bg-indigo-600"
                  }`}
                >
                  🔔
                </div>

                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:justify-between gap-2">
                    <div>
                      <h2 className="font-bold text-gray-900 text-lg">
                        {notification.title}
                      </h2>

                      <p className="text-gray-600 mt-1">
                        {notification.message}
                      </p>
                    </div>

                    {!notification.isRead && (
                      <span className="w-fit bg-indigo-600 text-white text-xs px-3 py-1 rounded-full">
                        New
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-4 mt-4">
                    <span className="text-xs text-gray-400">
                      {formatDate(notification.createdAt)}
                    </span>

                    {!notification.isRead && (
                      <button
                        type="button"
                        onClick={() => markAsRead(notification.id)}
                        className="text-sm text-indigo-600 font-semibold"
                      >
                        Mark as read
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => deleteNotification(notification.id)}
                      className="text-sm text-red-500 font-semibold"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </TeacherLayout>
  );
}
