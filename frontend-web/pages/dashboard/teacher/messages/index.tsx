import { useEffect, useState } from "react";
import Link from "next/link";

import TeacherLayout from "../../../../layouts/TeacherLayout";
import useTeacherAuth from "../../../../hooks/useTeacherAuth";
import { useAuth } from "../../../../contexts/AuthContext";
import api from "../../../../services/api";
import socket from "../../../../services/socket";

interface MessageUser {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  role: "ADMIN" | "TEACHER" | "STUDENT";
  profileImage?: string;
  classLevel?: string;
  school?: string;
  bio?: string;
  isOnline?: boolean;
  lastSeen?: string | null;
}

interface Conversation {
  id: string;
  participantOneId: string;
  participantTwoId: string;
  participantOne: MessageUser;
  participantTwo: MessageUser;
  messages: {
    id: string;
    content: string;
    createdAt: string;
  }[];
}

interface MessageContacts {
  teachers: MessageUser[];
  students: MessageUser[];
}

export default function TeacherMessages() {
  useTeacherAuth();

  const { user } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [contacts, setContacts] = useState<MessageContacts>({
    teachers: [],
    students: [],
  });

  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  const [search, setSearch] = useState("");
  const [contactSearch, setContactSearch] = useState("");

  const [loading, setLoading] = useState(false);
  const [contactsLoading, setContactsLoading] = useState(false);

  const [showContacts, setShowContacts] = useState(false);

  /*
   * ============================================================
   * REGISTER TEACHER WITH SOCKET.IO
   * ============================================================
   */

  useEffect(() => {
    if (!user?.id) return;

    const register = () => {
      socket.emit("register", user.id);
    };

    if (socket.connected) {
      register();
    } else {
      socket.once("connect", register);
    }

    return () => {
      socket.off("connect", register);
    };
  }, [user?.id]);

  /*
   * ============================================================
   * PRESENCE
   * ============================================================
   */

  useEffect(() => {
    const handleOnlineUsers = (data: { users: string[] }) => {
      setOnlineUsers(data.users);
    };

    const handleUserOnline = ({ userId }: { userId: string }) => {
      setOnlineUsers((previous) =>
        previous.includes(userId) ? previous : [...previous, userId],
      );
    };

    const handleUserOffline = ({ userId }: { userId: string }) => {
      setOnlineUsers((previous) => previous.filter((id) => id !== userId));
    };

    socket.on("onlineUsers", handleOnlineUsers);
    socket.on("userOnline", handleUserOnline);
    socket.on("userOffline", handleUserOffline);

    const requestOnlineUsers = () => {
      socket.emit("onlineUsers");
    };

    if (socket.connected) {
      requestOnlineUsers();
    } else {
      socket.once("connect", requestOnlineUsers);
    }

    return () => {
      socket.off("onlineUsers", handleOnlineUsers);
      socket.off("userOnline", handleUserOnline);
      socket.off("userOffline", handleUserOffline);
      socket.off("connect", requestOnlineUsers);
    };
  }, []);

  /*
   * ============================================================
   * LOAD TEACHER CONVERSATIONS
   * ============================================================
   */

  useEffect(() => {
    if (!user?.id) return;

    const loadConversations = async () => {
      setLoading(true);

      try {
        const response = await api.get(`/messages/teacher/${user.id}`);

        setConversations(response.data);
      } catch (error) {
        console.error("Failed to load teacher conversations:", error);
      } finally {
        setLoading(false);
      }
    };

    loadConversations();
  }, [user?.id]);

  /*
   * ============================================================
   * LOAD MESSAGE CONTACTS
   * ============================================================
   */

  const loadContacts = async () => {
    if (!user?.id) return;

    setContactsLoading(true);

    try {
      const response = await api.get(`/messages/contacts/${user.id}`);

      setContacts(response.data);
    } catch (error) {
      console.error("Failed to load message contacts:", error);
    } finally {
      setContactsLoading(false);
    }
  };

  /*
   * ============================================================
   * OPEN CONTACT PICKER
   * ============================================================
   */

  const handleOpenContacts = async () => {
    setShowContacts(true);

    if (contacts.teachers.length === 0 && contacts.students.length === 0) {
      await loadContacts();
    }
  };

  /*
   * ============================================================
   * START CHAT
   * ============================================================
   */

  const startChat = async (contact: MessageUser) => {
    if (!user?.id) return;

    try {
      const response = await api.post("/messages/conversation", {
        participantOneId: user.id,
        participantTwoId: contact.id,
      });

      const conversationId = response.data.id;

      window.location.href = `/dashboard/teacher/messages/${conversationId}`;
    } catch (error) {
      console.error("Failed to start conversation:", error);
    }
  };

  /*
   * ============================================================
   * SEARCH CONVERSATIONS
   * ============================================================
   */

  const filteredConversations = conversations.filter((conversation) => {
    const query = search.trim().toLowerCase();

    if (!query) return true;

    const otherUser =
      conversation.participantOneId === user?.id
        ? conversation.participantTwo
        : conversation.participantOne;

    const fullName =
      `${otherUser.firstName} ${otherUser.lastName}`.toLowerCase();

    const latestMessage =
      conversation.messages?.[0]?.content?.toLowerCase() || "";

    return fullName.includes(query) || latestMessage.includes(query);
  });

  /*
   * ============================================================
   * SEARCH CONTACTS
   * ============================================================
   */

  const filteredStudents = contacts.students.filter((student) => {
    const query = contactSearch.trim().toLowerCase();

    if (!query) return true;

    const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();

    const email = student.email?.toLowerCase() || "";

    const classLevel = student.classLevel?.toLowerCase() || "";

    const school = student.school?.toLowerCase() || "";

    return (
      fullName.includes(query) ||
      email.includes(query) ||
      classLevel.includes(query) ||
      school.includes(query)
    );
  });

  /*
   * ============================================================
   * CONTACT CARD
   * ============================================================
   */

  const ContactCard = ({ contact }: { contact: MessageUser }) => {
    const isOnline =
      onlineUsers.includes(contact.id) || contact.isOnline === true;

    return (
      <button
        type="button"
        onClick={() => startChat(contact)}
        className="flex w-full items-center gap-4 rounded-xl bg-white p-4 text-left shadow-sm transition hover:bg-indigo-50 hover:shadow-md"
      >
        <div className="relative">
          <img
            src={contact.profileImage || "/images/default-avatar.png"}
            alt={`${contact.firstName} ${contact.lastName}`}
            className="h-12 w-12 rounded-full object-cover"
          />

          <span
            className={`absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white ${
              isOnline ? "bg-green-500" : "bg-gray-300"
            }`}
          />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-gray-900">
            {contact.firstName} {contact.lastName}
          </h3>

          <p className="text-sm text-gray-500">
            {contact.classLevel ? `Student • ${contact.classLevel}` : "Student"}
          </p>
        </div>

        <span className="text-indigo-600">→</span>
      </button>
    );
  };

  return (
    <TeacherLayout>
      <div className="mb-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold text-indigo-700">Messages</h1>

            <p className="text-gray-500">
              Chat with your students and teaching colleagues
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenContacts}
            className="rounded-xl bg-indigo-600 px-5 py-3 font-semibold text-white transition hover:bg-indigo-700"
          >
            + New Message
          </button>
        </div>

        <div className="mt-6">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search conversations..."
            className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/*
       * ========================================================
       * NEW MESSAGE PANEL
       * ========================================================
       */}

      {showContacts && (
        <div className="mb-8 rounded-2xl bg-gray-50 p-5 shadow-inner">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">New Message</h2>

              <p className="text-sm text-gray-500">
                Students connected to your subjects
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowContacts(false);
                setContactSearch("");
              }}
              className="rounded-lg px-3 py-2 text-gray-500 hover:bg-gray-200"
            >
              ✕
            </button>
          </div>

          <input
            value={contactSearch}
            onChange={(event) => setContactSearch(event.target.value)}
            placeholder="Search students..."
            className="mb-6 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
          />

          {contactsLoading && (
            <div className="rounded-xl bg-white p-5 text-center text-gray-500">
              Loading students...
            </div>
          )}

          {!contactsLoading && (
            <section>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-indigo-700">
                Students
              </h3>

              {filteredStudents.length === 0 ? (
                <div className="rounded-xl bg-white p-5 text-sm text-gray-500">
                  No students found in your subjects.
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredStudents.map((student) => (
                    <ContactCard key={student.id} contact={student} />
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      )}

      {/*
       * ========================================================
       * CONVERSATIONS
       * ========================================================
       */}

      {loading && (
        <div className="mb-4 rounded-lg bg-indigo-50 p-3 text-indigo-700">
          Loading messages...
        </div>
      )}

      {!loading && filteredConversations.length === 0 && (
        <div className="rounded-xl bg-white p-6 text-center shadow">
          <p className="font-medium text-gray-700">
            {search
              ? "No conversations found."
              : "No student conversations yet."}
          </p>

          {!search && (
            <button
              type="button"
              onClick={handleOpenContacts}
              className="mt-3 text-sm font-semibold text-indigo-600 hover:underline"
            >
              Start a new conversation
            </button>
          )}
        </div>
      )}

      <div className="space-y-4">
        {filteredConversations.map((conversation) => {
          const student =
            conversation.participantOneId === user?.id
              ? conversation.participantTwo
              : conversation.participantOne;

          const latestMessage = conversation.messages?.[0];

          const isOnline =
            onlineUsers.includes(student.id) || student.isOnline === true;

          return (
            <Link
              key={conversation.id}
              href={`/dashboard/teacher/messages/${conversation.id}`}
            >
              <div className="flex cursor-pointer items-center justify-between rounded-xl bg-white p-5 shadow transition hover:shadow-xl">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img
                      src={student.profileImage || "/images/default-avatar.png"}
                      alt={`${student.firstName} ${student.lastName}`}
                      className="h-14 w-14 rounded-full object-cover"
                    />

                    <span
                      className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white ${
                        isOnline ? "bg-green-500" : "bg-gray-300"
                      }`}
                    />
                  </div>

                  <div>
                    <h2 className="font-bold">
                      {student.firstName} {student.lastName}
                    </h2>

                    <p className="text-gray-500">
                      {latestMessage?.content ?? "No messages yet"}
                    </p>
                  </div>
                </div>

                <span className="text-gray-400">→</span>
              </div>
            </Link>
          );
        })}
      </div>
    </TeacherLayout>
  );
}
