import { useEffect, useState } from "react";

import AdminLayout from "../../../layouts/AdminLayout";
import useAdminAuth from "../../../hooks/useAdminAuth";
import api from "../../../services/api";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  status: "UNREAD" | "READ" | "REPLIED";
  createdAt: string;
}

export default function AdminContactPage() {
  useAdminAuth();

  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);

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
    status: "UNREAD" | "READ" | "REPLIED",
  ) => {
    try {
      await api.patch(`/contact/${id}/status`, {
        status,
      });

      await loadMessages();
    } catch (error) {
      console.error("Failed to update message:", error);
    }
  };

  const deleteMessage = async (id: string) => {
    if (!confirm("Delete this contact message?")) {
      return;
    }

    try {
      await api.delete(`/contact/${id}`);

      await loadMessages();
    } catch (error) {
      console.error("Failed to delete message:", error);
    }
  };

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
        <h1 className="text-3xl font-bold text-slate-900">Contact Messages</h1>

        <p className="text-gray-500 mt-2">
          Messages submitted through the Erevna public website.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-5 mb-8">
        <Stat title="Total" value={messages.length} />

        <Stat
          title="Unread"
          value={
            messages.filter((message) => message.status === "UNREAD").length
          }
        />

        <Stat
          title="Replied"
          value={
            messages.filter((message) => message.status === "REPLIED").length
          }
        />
      </div>

      <div className="space-y-5">
        {messages.length === 0 ? (
          <div className="bg-white rounded-3xl shadow p-10 text-center">
            <p className="text-gray-500">No contact messages yet.</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className="bg-white rounded-3xl shadow-lg p-6"
            >
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-xl font-bold">{message.name}</h2>

                    <StatusBadge status={message.status} />
                  </div>

                  <p className="text-gray-500 mt-1">{message.email}</p>

                  {message.phone && (
                    <p className="text-gray-500">{message.phone}</p>
                  )}

                  <p className="text-sm text-gray-400 mt-2">
                    {new Date(message.createdAt).toLocaleString("en-NG")}
                  </p>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => updateStatus(message.id, "READ")}
                    className="bg-blue-100 text-blue-700 px-4 py-2 rounded-lg font-semibold"
                  >
                    Mark Read
                  </button>

                  <button
                    onClick={() => updateStatus(message.id, "REPLIED")}
                    className="bg-green-100 text-green-700 px-4 py-2 rounded-lg font-semibold"
                  >
                    Replied
                  </button>

                  <button
                    onClick={() => deleteMessage(message.id)}
                    className="bg-red-100 text-red-700 px-4 py-2 rounded-lg font-semibold"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {message.subject && (
                <h3 className="font-bold text-lg mt-6">{message.subject}</h3>
              )}

              <div className="bg-gray-50 rounded-xl p-5 mt-3">
                <p className="text-gray-700 whitespace-pre-wrap">
                  {message.message}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
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

function StatusBadge({ status }: { status: ContactMessage["status"] }) {
  const styles = {
    UNREAD: "bg-red-100 text-red-700",
    READ: "bg-blue-100 text-blue-700",
    REPLIED: "bg-green-100 text-green-700",
  };

  return (
    <span
      className={`px-3 py-1 rounded-full text-sm font-semibold ${styles[status]}`}
    >
      {status}
    </span>
  );
}
