import { useEffect, useMemo, useState } from "react";

import AdminLayout from "../../../layouts/AdminLayout";
import useAdminAuth from "../../../hooks/useAdminAuth";
import api from "../../../services/api";

interface ContactUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  role: string;
}

interface ContactMessage {
  id: string;
  userId?: string | null;
  type: "CONTACT" | "SUPPORT";
  name: string;
  email: string;
  phone?: string | null;
  subject?: string | null;
  message: string;
  status: "UNREAD" | "READ" | "RESOLVED";
  createdAt: string;
  updatedAt?: string;
  user?: ContactUser | null;
}

type FilterType = "ALL" | "CONTACT" | "SUPPORT";
type StatusFilter = "ALL" | "UNREAD" | "READ" | "RESOLVED";

export default function AdminContactPage() {
  useAdminAuth();

  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<FilterType>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(
    null,
  );

  const loadMessages = async () => {
    try {
      setLoading(true);

      const response = await api.get("/contact");

      setMessages(response.data);
    } catch (error) {
      console.error("Failed to load contact messages:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
  }, []);

  const updateStatus = async (
    id: string,
    status: "UNREAD" | "READ" | "RESOLVED",
  ) => {
    try {
      await api.patch(`/contact/${id}/status`, {
        status,
      });

      if (selectedMessage?.id === id) {
        setSelectedMessage((current) =>
          current ? { ...current, status } : null,
        );
      }

      await loadMessages();
    } catch (error) {
      console.error("Failed to update message:", error);
      alert("Unable to update the message status.");
    }
  };

  const deleteMessage = async (id: string) => {
    if (
      !confirm("Delete this contact message? This action cannot be undone.")
    ) {
      return;
    }

    try {
      await api.delete(`/contact/${id}`);

      if (selectedMessage?.id === id) {
        setSelectedMessage(null);
      }

      await loadMessages();
    } catch (error) {
      console.error("Failed to delete message:", error);
      alert("Unable to delete this message.");
    }
  };

  const filteredMessages = useMemo(() => {
    return messages.filter((message) => {
      const matchesType = filterType === "ALL" || message.type === filterType;

      const matchesStatus =
        statusFilter === "ALL" || message.status === statusFilter;

      return matchesType && matchesStatus;
    });
  }, [messages, filterType, statusFilter]);

  const totalCount = messages.length;

  const unreadCount = messages.filter(
    (message) => message.status === "UNREAD",
  ).length;

  const resolvedCount = messages.filter(
    (message) => message.status === "RESOLVED",
  ).length;

  const supportCount = messages.filter(
    (message) => message.type === "SUPPORT",
  ).length;

  if (loading) {
    return (
      <AdminLayout>
        <div className="bg-white rounded-3xl shadow-lg p-10">
          Loading contact messages...
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Contact & Support</h1>

        <p className="text-gray-500 mt-2">
          Manage messages from the public website and support requests from
          Erevna students.
        </p>
      </div>

      {/* STATISTICS */}

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <Stat title="Total Messages" value={totalCount} />

        <Stat title="Unread" value={unreadCount} />

        <Stat title="Student Support" value={supportCount} />

        <Stat title="Resolved" value={resolvedCount} />
      </div>

      {/* FILTERS */}

      <div className="bg-white rounded-3xl shadow-lg p-5 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div>
            <h2 className="font-bold text-slate-900">Message Management</h2>

            <p className="text-sm text-gray-500 mt-1">
              Showing {filteredMessages.length} of {messages.length} messages.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={filterType}
              onChange={(event) =>
                setFilterType(event.target.value as FilterType)
              }
              className="border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Types</option>
              <option value="CONTACT">Public Contact</option>
              <option value="SUPPORT">Student Support</option>
            </select>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as StatusFilter)
              }
              className="border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700 outline-none focus:border-indigo-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="UNREAD">Unread</option>
              <option value="READ">Read</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      {/* MESSAGES */}

      <div className="space-y-5">
        {filteredMessages.length === 0 ? (
          <div className="bg-white rounded-3xl shadow p-10 text-center">
            <div className="text-4xl mb-4">📭</div>

            <p className="text-gray-500">
              {messages.length === 0
                ? "No contact messages or support requests yet."
                : "No messages match the selected filters."}
            </p>
          </div>
        ) : (
          filteredMessages.map((message) => (
            <div
              key={message.id}
              className="bg-white rounded-3xl shadow-lg p-6"
            >
              <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6">
                {/* MESSAGE INFORMATION */}

                <div className="min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-xl font-bold text-slate-900">
                      {message.name}
                    </h2>

                    <TypeBadge type={message.type} />

                    <StatusBadge status={message.status} />
                  </div>

                  <p className="text-gray-500 mt-2 break-all">
                    {message.email}
                  </p>

                  {message.phone && (
                    <p className="text-gray-500">{message.phone}</p>
                  )}

                  {message.type === "SUPPORT" && message.user && (
                    <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-700">
                      <span>Student account</span>

                      <span className="font-semibold">
                        {message.user.firstName} {message.user.lastName}
                      </span>
                    </div>
                  )}

                  <p className="text-sm text-gray-400 mt-3">
                    {new Date(message.createdAt).toLocaleString("en-NG")}
                  </p>
                </div>

                {/* ACTIONS */}

                <div className="flex gap-2 flex-wrap shrink-0">
                  {message.status !== "READ" && (
                    <button
                      type="button"
                      onClick={() => updateStatus(message.id, "READ")}
                      className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-semibold hover:bg-blue-200 transition"
                    >
                      Mark Read
                    </button>
                  )}

                  {message.status !== "RESOLVED" && (
                    <button
                      type="button"
                      onClick={() => updateStatus(message.id, "RESOLVED")}
                      className="bg-green-100 text-green-700 px-4 py-2 rounded-lg font-semibold hover:bg-green-200 transition"
                    >
                      Resolve
                    </button>
                  )}

                  {message.status !== "UNREAD" && (
                    <button
                      type="button"
                      onClick={() => updateStatus(message.id, "UNREAD")}
                      className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-lg font-semibold hover:bg-yellow-200 transition"
                    >
                      Mark Unread
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setSelectedMessage(message)}
                    className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg font-semibold hover:bg-indigo-200 transition"
                  >
                    View
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteMessage(message.id)}
                    className="bg-red-100 text-red-700 px-4 py-2 rounded-lg font-semibold hover:bg-red-200 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* SUBJECT */}

              {message.subject && (
                <h3 className="font-bold text-lg text-slate-900 mt-6">
                  {message.subject}
                </h3>
              )}

              {/* MESSAGE */}

              <div className="bg-gray-50 rounded-xl p-5 mt-3">
                <p className="text-gray-700 whitespace-pre-wrap line-clamp-5">
                  {message.message}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* DETAIL MODAL */}

      {selectedMessage && (
        <div
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
          onClick={() => setSelectedMessage(null)}
        >
          <div
            className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="p-6 md:p-8">
              {/* MODAL HEADER */}

              <div className="flex items-start justify-between gap-5">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <TypeBadge type={selectedMessage.type} />

                    <StatusBadge status={selectedMessage.status} />
                  </div>

                  <h2 className="text-2xl font-bold text-slate-900 mt-3">
                    {selectedMessage.subject || "No subject"}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedMessage(null)}
                  className="w-10 h-10 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition text-xl"
                  aria-label="Close"
                >
                  ×
                </button>
              </div>

              {/* SENDER */}

              <div className="bg-gray-50 rounded-2xl p-5 mt-6">
                <h3 className="font-bold text-slate-900 mb-3">
                  Sender Information
                </h3>

                <div className="grid sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Name</p>
                    <p className="font-semibold text-gray-800 mt-1">
                      {selectedMessage.name}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-400">Email</p>
                    <p className="font-semibold text-gray-800 mt-1 break-all">
                      {selectedMessage.email}
                    </p>
                  </div>

                  {selectedMessage.phone && (
                    <div>
                      <p className="text-gray-400">Phone</p>
                      <p className="font-semibold text-gray-800 mt-1">
                        {selectedMessage.phone}
                      </p>
                    </div>
                  )}

                  <div>
                    <p className="text-gray-400">Submitted</p>
                    <p className="font-semibold text-gray-800 mt-1">
                      {new Date(selectedMessage.createdAt).toLocaleString(
                        "en-NG",
                      )}
                    </p>
                  </div>
                </div>

                {selectedMessage.type === "SUPPORT" && selectedMessage.user && (
                  <div className="mt-5 pt-5 border-t border-gray-200">
                    <p className="text-gray-400 text-sm">
                      Linked Student Account
                    </p>

                    <p className="font-semibold text-indigo-700 mt-1">
                      {selectedMessage.user.firstName}{" "}
                      {selectedMessage.user.lastName}
                    </p>

                    <p className="text-sm text-gray-500 mt-1">
                      {selectedMessage.user.email}
                    </p>

                    <p className="text-xs text-gray-400 mt-1">
                      User ID: {selectedMessage.user.id}
                    </p>
                  </div>
                )}
              </div>

              {/* MESSAGE */}

              <div className="mt-6">
                <h3 className="font-bold text-slate-900 mb-3">Message</h3>

                <div className="bg-gray-50 rounded-2xl p-5">
                  <p className="text-gray-700 whitespace-pre-wrap leading-7">
                    {selectedMessage.message}
                  </p>
                </div>
              </div>

              {/* STATUS ACTIONS */}

              <div className="mt-6">
                <h3 className="font-bold text-slate-900 mb-3">Update Status</h3>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => updateStatus(selectedMessage.id, "UNREAD")}
                    className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-lg font-semibold hover:bg-yellow-200 transition"
                  >
                    Unread
                  </button>

                  <button
                    type="button"
                    onClick={() => updateStatus(selectedMessage.id, "READ")}
                    className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-semibold hover:bg-blue-200 transition"
                  >
                    Read
                  </button>

                  <button
                    type="button"
                    onClick={() => updateStatus(selectedMessage.id, "RESOLVED")}
                    className="bg-green-100 text-green-700 px-4 py-2 rounded-lg font-semibold hover:bg-green-200 transition"
                  >
                    Resolved
                  </button>
                </div>
              </div>

              {/* CLOSE */}

              <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedMessage(null)}
                  className="px-5 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

function Stat({ title, value }: { title: string; value: number }) {
  return (
    <div className="bg-white rounded-3xl shadow-lg p-6">
      <p className="text-gray-500">{title}</p>

      <p className="text-4xl font-bold text-indigo-700 mt-2">{value}</p>
    </div>
  );
}

function TypeBadge({ type }: { type: ContactMessage["type"] }) {
  const styles = {
    CONTACT: "bg-gray-100 text-gray-700",
    SUPPORT: "bg-indigo-100 text-indigo-700",
  };

  const labels = {
    CONTACT: "PUBLIC CONTACT",
    SUPPORT: "STUDENT SUPPORT",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-xs font-bold ${styles[type]}`}
    >
      {labels[type]}
    </span>
  );
}

function StatusBadge({ status }: { status: ContactMessage["status"] }) {
  const styles = {
    UNREAD: "bg-red-100 text-red-700",
    READ: "bg-blue-100 text-blue-700",
    RESOLVED: "bg-green-100 text-green-700",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-sm font-semibold ${styles[status]}`}
    >
      {status}
    </span>
  );
}
