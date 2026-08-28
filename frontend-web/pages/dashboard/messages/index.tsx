import { useEffect, useState } from "react";
import Link from "next/link";

import StudentLayout from "../../../layouts/StudentLayout";
import useStudentAuth from "../../../hooks/useStudentAuth";
import { useAuth } from "../../../contexts/AuthContext";

import api from "../../../services/api";
import socket from "../../../services/socket";

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

export default function MessagesPage() {
  useStudentAuth();

  const { user } = useAuth();

  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  const [contacts, setContacts] = useState<MessageContacts>({
    teachers: [],
    students: [],
  });

  const [search, setSearch] = useState("");
  const [contactSearch, setContactSearch] = useState("");

  const [loading, setLoading] = useState(false);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [showContacts, setShowContacts] = useState(false);

  /*
   * ============================================================
   * REGISTER USER WITH SOCKET.IO
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
   * LOAD CONVERSATIONS
   * ============================================================
   */

  useEffect(() => {
    if (!user?.id) return;

    const loadConversations = async () => {
      setLoading(true);

      try {
        const response = await api.get(`/messages/user/${user.id}`);

        const results: Conversation[] = response.data;

        if (search.trim()) {
          const query = search.toLowerCase().trim();

          const filtered = results.filter((conversation) => {
            const otherUser =
              conversation.participantOneId === user.id
                ? conversation.participantTwo
                : conversation.participantOne;

            const latestMessage = conversation.messages?.[0];

            const fullName =
              `${otherUser.firstName} ${otherUser.lastName}`.toLowerCase();

            const messageText = latestMessage?.content?.toLowerCase() || "";

            return fullName.includes(query) || messageText.includes(query);
          });

          setConversations(filtered);
        } else {
          setConversations(results);
        }
      } catch (error) {
        console.error("Failed to load conversations:", error);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(loadConversations, 300);

    return () => clearTimeout(debounce);
  }, [user?.id, search]);

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
      let response;

      if (contact.role === "TEACHER") {
        response = await api.post("/messages/start", {
          studentId: user.id,
          teacherId: contact.id,
        });
      } else {
        response = await api.post("/messages/conversation", {
          participantOneId: user.id,
          participantTwoId: contact.id,
        });
      }

      const conversationId = response.data.id;

      window.location.href = `/dashboard/messages/${conversationId}`;
    } catch (error) {
      console.error("Failed to start conversation:", error);
    }
  };

  /*
   * ============================================================
   * CONTACT SEARCH
   * ============================================================
   */

  const filterContacts = (users: MessageUser[]) => {
    const query = contactSearch.trim().toLowerCase();

    if (!query) return users;

    return users.filter((contact) => {
      const name = `${contact.firstName} ${contact.lastName}`.toLowerCase();

      const email = contact.email?.toLowerCase() || "";

      const school = contact.school?.toLowerCase() || "";

      const classLevel = contact.classLevel?.toLowerCase() || "";

      return (
        name.includes(query) ||
        email.includes(query) ||
        school.includes(query) ||
        classLevel.includes(query)
      );
    });
  };

  const filteredTeachers = filterContacts(contacts.teachers);
  const filteredStudents = filterContacts(contacts.students);

  /*
   * ============================================================
   * USER CARD
   * ============================================================
   */

  const ContactCard = ({ contact }: { contact: MessageUser }) => {
    const isOnline =
      onlineUsers.includes(contact.id) || contact.isOnline === true;

    return (
      <button
        type="button"
        onClick={() => startChat(contact)}
        className="flex w-full items-center gap-4 rounded-xl bg-white p-4 text-left shadow-sm transition hover:shadow-md hover:bg-indigo-50"
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
            {contact.role === "TEACHER"
              ? "Teacher"
              : contact.classLevel
                ? `Student • ${contact.classLevel}`
                : "Student"}
          </p>
        </div>

        <span className="text-indigo-600">→</span>
      </button>
    );
  };

  return (
    <StudentLayout>
      <div className="mb-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold text-indigo-700">Messages</h1>

            <p className="text-gray-500">
              Chat with your teachers and classmates
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
       * NEW MESSAGE CONTACT PANEL
       * ========================================================
       */}

      {showContacts && (
        <div className="mb-8 rounded-2xl bg-gray-50 p-5 shadow-inner">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">New Message</h2>

              <p className="text-sm text-gray-500">
                People you can message based on your subjects
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
            placeholder="Search teachers or classmates..."
            className="mb-6 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
          />

          {contactsLoading && (
            <div className="rounded-xl bg-white p-5 text-center text-gray-500">
              Loading people you can message...
            </div>
          )}

          {!contactsLoading && (
            <div className="space-y-8">
              {/*
               * TEACHERS
               */}

              <section>
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-indigo-700">
                  Teachers
                </h3>

                {filteredTeachers.length === 0 ? (
                  <div className="rounded-xl bg-white p-4 text-sm text-gray-500">
                    No teachers found.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredTeachers.map((teacher) => (
                      <ContactCard key={teacher.id} contact={teacher} />
                    ))}
                  </div>
                )}
              </section>

              {/*
               * CLASSMATES
               */}

              <section>
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-indigo-700">
                  Classmates
                </h3>

                {filteredStudents.length === 0 ? (
                  <div className="rounded-xl bg-white p-4 text-sm text-gray-500">
                    No classmates found.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredStudents.map((student) => (
                      <ContactCard key={student.id} contact={student} />
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      )}

      {/*
       * ========================================================
       * CONVERSATIONS
       * ========================================================
       */}

      <div className="mt-6 space-y-4">
        {loading && (
          <div className="rounded-lg bg-indigo-50 p-3 text-indigo-700">
            Loading conversations...
          </div>
        )}

        {!loading && conversations.length === 0 && (
          <div className="rounded-xl bg-white p-6 text-center shadow">
            <p className="font-medium text-gray-700">
              {search ? "No conversations found." : "No conversations yet."}
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

        {conversations.map((conversation) => {
          const otherUser =
            conversation.participantOneId === user?.id
              ? conversation.participantTwo
              : conversation.participantOne;

          const latestMessage = conversation.messages?.[0];

          const isOnline =
            onlineUsers.includes(otherUser.id) || otherUser.isOnline === true;

          return (
            <Link
              key={conversation.id}
              href={`/dashboard/messages/${conversation.id}`}
            >
              <div className="cursor-pointer rounded-xl bg-white p-5 shadow transition hover:shadow-lg">
                <div className="flex justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img
                        src={
                          otherUser.profileImage || "/images/default-avatar.png"
                        }
                        alt={`${otherUser.firstName} ${otherUser.lastName}`}
                        className="h-12 w-12 rounded-full object-cover"
                      />

                      <span
                        className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
                          isOnline ? "bg-green-500" : "bg-gray-300"
                        }`}
                      />
                    </div>

                    <div>
                      <h3 className="text-lg font-bold">
                        {otherUser.firstName} {otherUser.lastName}
                      </h3>

                      <p className="text-sm text-gray-500">{otherUser.role}</p>
                    </div>
                  </div>

                  <div className="text-xs text-gray-400">
                    {latestMessage
                      ? new Date(latestMessage.createdAt).toLocaleDateString()
                      : ""}
                  </div>
                </div>

                <p className="mt-3 truncate text-gray-600">
                  {latestMessage?.content || "No messages yet"}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </StudentLayout>
  );
}
