import { useRouter } from "next/router";
import { useState, useEffect, useRef, useCallback } from "react";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";

import StudentLayout from "../../../layouts/StudentLayout";
import TeacherLayout from "../../../layouts/TeacherLayout";

import { useAuth } from "../../../contexts/AuthContext";

import api from "../../../services/api";
import socket from "../../../services/socket";

interface Reaction {
  id: string;
  emoji: string;
  userId: string;
}

interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  isRead?: boolean;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  reactions: Reaction[];
}

interface ChatUser {
  id: string;
  firstName: string;
  lastName: string;
  role: "ADMIN" | "TEACHER" | "STUDENT";
  profileImage?: string;
  isOnline?: boolean;
  lastSeen?: string;
}

interface Conversation {
  id: string;
  participantOneId: string;
  participantTwoId: string;
  participantOne: ChatUser;
  participantTwo: ChatUser;
  messages: Message[];
}

export default function ConversationPage() {
  const { user, token } = useAuth();
  const router = useRouter();

  const conversationId =
    typeof router.query.id === "string" ? router.query.id : undefined;

  const [conversation, setConversation] = useState<Conversation | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);

  const [message, setMessage] = useState("");

  const [typing, setTyping] = useState(false);

  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  const [lastSeen, setLastSeen] = useState<Record<string, string>>({});

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const [loading, setLoading] = useState(true);

  const bottomRef = useRef<HTMLDivElement>(null);

  /**
   * ============================================================
   * AUTHORIZATION
   * ============================================================
   *
   * This page is shared by STUDENT and TEACHER.
   */

  useEffect(() => {
    if (!router.isReady) return;

    if (!token || !user) {
      router.replace("/login");
      return;
    }

    if (user.role !== "STUDENT" && user.role !== "TEACHER") {
      router.replace("/");
    }
  }, [router, token, user]);

  /**
   * ============================================================
   * LOAD CONVERSATION
   * ============================================================
   */

  const loadConversation = useCallback(async () => {
    if (!conversationId) return;

    try {
      setLoading(true);

      const res = await api.get(`/messages/conversation/${conversationId}`);

      const data: Conversation = res.data;

      setConversation(data);
      setMessages(data.messages ?? []);
    } catch (err) {
      console.error("Failed to load conversation:", err);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    if (!user || !conversationId) return;

    loadConversation();
  }, [user, conversationId, loadConversation]);

  /**
   * ============================================================
   * REGISTER SOCKET USER
   * ============================================================
   */

  useEffect(() => {
    if (!user) return;

    socket.emit("register", user.id);
  }, [user]);

  /**
   * ============================================================
   * JOIN CONVERSATION ROOM
   * ============================================================
   */

  useEffect(() => {
    if (!conversationId) return;

    socket.emit("join", conversationId);

    return () => {
      socket.emit("leave", conversationId);
    };
  }, [conversationId]);

  /**
   * ============================================================
   * RECEIVE NEW MESSAGES
   * ============================================================
   */

  useEffect(() => {
    const handleNewMessage = (newMessage: Message) => {
      /**
       * Prevent duplicate messages.
       */
      setMessages((prev) => {
        if (prev.some((message) => message.id === newMessage.id)) {
          return prev;
        }

        return [...prev, newMessage];
      });
    };

    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.off("newMessage", handleNewMessage);
    };
  }, []);

  /**
   * ============================================================
   * REACTION UPDATES
   * ============================================================
   */

  useEffect(() => {
    const handleReactionUpdated = (data: {
      messageId: string;
      reactions: Reaction[];
    }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === data.messageId
            ? {
                ...msg,
                reactions: data.reactions,
              }
            : msg,
        ),
      );
    };

    socket.on("reactionUpdated", handleReactionUpdated);

    return () => {
      socket.off("reactionUpdated", handleReactionUpdated);
    };
  }, []);

  /**
   * ============================================================
   * TYPING INDICATOR
   * ============================================================
   */

  useEffect(() => {
    let timer: NodeJS.Timeout;

    const handleTyping = (data: {
      senderId: string;
      conversationId: string;
    }) => {
      if (
        data.senderId === user?.id ||
        data.conversationId !== conversationId
      ) {
        return;
      }

      setTyping(true);

      clearTimeout(timer);

      timer = setTimeout(() => {
        setTyping(false);
      }, 2000);
    };

    socket.on("typing", handleTyping);

    return () => {
      clearTimeout(timer);

      socket.off("typing", handleTyping);
    };
  }, [user, conversationId]);

  /**
   * ============================================================
   * ONLINE USERS
   * ============================================================
   */

  useEffect(() => {
    socket.emit("onlineUsers");

    const handleOnlineUsers = (data: { users: string[] }) => {
      setOnlineUsers(data.users);
    };

    const handleUserOnline = ({ userId }: { userId: string }) => {
      setOnlineUsers((prev) =>
        prev.includes(userId) ? prev : [...prev, userId],
      );
    };

    const handleUserOffline = ({
      userId,
      lastSeen,
    }: {
      userId: string;
      lastSeen: string;
    }) => {
      setOnlineUsers((prev) => prev.filter((id) => id !== userId));

      setLastSeen((prev) => ({
        ...prev,
        [userId]: lastSeen,
      }));
    };

    socket.on("onlineUsers", handleOnlineUsers);

    socket.on("userOnline", handleUserOnline);

    socket.on("userOffline", handleUserOffline);

    return () => {
      socket.off("onlineUsers", handleOnlineUsers);

      socket.off("userOnline", handleUserOnline);

      socket.off("userOffline", handleUserOffline);
    };
  }, []);

  /**
   * ============================================================
   * AUTO SCROLL
   * ============================================================
   */

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  /**
   * ============================================================
   * MARK RECEIVED MESSAGES AS READ
   * ============================================================
   */

  useEffect(() => {
    if (!user || !messages.length) return;

    const markUnreadMessages = async () => {
      const unreadMessages = messages.filter(
        (msg) => msg.senderId !== user.id && !msg.isRead,
      );

      for (const msg of unreadMessages) {
        try {
          await api.patch(`/messages/${msg.id}/read`, {
            userId: user.id,
          });

          setMessages((prev) =>
            prev.map((item) =>
              item.id === msg.id
                ? {
                    ...item,
                    isRead: true,
                  }
                : item,
            ),
          );
        } catch (err) {
          console.error("Failed to mark message as read:", err);
        }
      }
    };

    markUnreadMessages();
  }, [messages, user]);

  /**
   * ============================================================
   * SEND MESSAGE
   * ============================================================
   */

  const sendMessage = async () => {
    if (!message.trim() || !user || !conversationId) {
      return;
    }

    try {
      await api.post("/messages/send", {
        conversationId,
        senderId: user.id,
        content: message.trim(),
      });

      setMessage("");
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  /**
   * ============================================================
   * TYPING
   * ============================================================
   */

  const handleTyping = (value: string) => {
    setMessage(value);

    if (!conversationId || !user) {
      return;
    }

    socket.emit("typing", {
      conversationId,
      senderId: user.id,
    });
  };

  /**
   * ============================================================
   * EMOJI
   * ============================================================
   */

  const addEmoji = (emoji: EmojiClickData) => {
    setMessage((prev) => prev + emoji.emoji);

    setShowEmojiPicker(false);
  };

  /**
   * ============================================================
   * REACTION
   * ============================================================
   */

  const reactToMessage = async (messageId: string, emoji: string) => {
    if (!user) return;

    try {
      await api.post("/messages/reaction", {
        messageId,
        userId: user.id,
        emoji,
      });
    } catch (err) {
      console.error("Failed to react to message:", err);
    }
  };

  /**
   * ============================================================
   * LOADING / AUTH STATE
   * ============================================================
   */

  if (!user || !token) {
    return null;
  }

  if (user.role !== "STUDENT" && user.role !== "TEACHER") {
    return null;
  }

  /**
   * ============================================================
   * LOADING
   * ============================================================
   */

  if (loading || !conversation) {
    const LoadingLayout =
      user.role === "TEACHER" ? TeacherLayout : StudentLayout;

    return (
      <LoadingLayout>
        <div className="flex items-center justify-center h-[80vh]">
          <p className="text-lg text-gray-500">Loading conversation...</p>
        </div>
      </LoadingLayout>
    );
  }

  /**
   * ============================================================
   * OTHER PARTICIPANT
   * ============================================================
   */

  const otherUser =
    conversation.participantOneId === user.id
      ? conversation.participantTwo
      : conversation.participantOne;

  const isOnline = onlineUsers.includes(otherUser.id) || !!otherUser.isOnline;

  /**
   * ============================================================
   * CHAT UI
   * ============================================================
   */

  const chatContent = (
    <div className="bg-white rounded-2xl shadow-xl h-[82vh] flex flex-col overflow-hidden">
      {/* HEADER */}

      <div className="border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center text-lg font-bold">
            {otherUser?.firstName?.charAt(0)}
            {otherUser?.lastName?.charAt(0)}
          </div>

          <div>
            <h2 className="text-xl font-bold text-indigo-700">
              {otherUser?.firstName} {otherUser?.lastName}
            </h2>

            {isOnline ? (
              <p className="text-green-600 text-sm">● Online</p>
            ) : (
              <p className="text-sm text-gray-500">
                Last seen{" "}
                {lastSeen[otherUser.id] || otherUser.lastSeen
                  ? new Date(
                      lastSeen[otherUser.id] || otherUser.lastSeen!,
                    ).toLocaleString()
                  : "recently"}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* CHAT */}

      <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-gray-50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.senderId === user.id ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`rounded-2xl px-5 py-3 max-w-lg shadow ${
                msg.senderId === user.id
                  ? "bg-indigo-600 text-white"
                  : "bg-white"
              }`}
            >
              {msg.content && (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              )}

              {/* ATTACHMENT */}

              {msg.fileUrl && (
                <a
                  href={msg.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline text-sm mt-3 block"
                >
                  📎 {msg.fileName || "Attachment"}
                </a>
              )}

              {/* REACTIONS */}

              <div className="flex flex-wrap gap-2 mt-4">
                {["👍", "❤️", "😂", "🔥", "👏", "😮"].map((emoji) => {
                  const count =
                    msg.reactions?.filter(
                      (reaction) => reaction.emoji === emoji,
                    ).length || 0;

                  return (
                    <button
                      key={emoji}
                      onClick={() => reactToMessage(msg.id, emoji)}
                      className="px-2 py-1 rounded-full bg-white/20 hover:bg-white/30 transition text-sm"
                    >
                      {emoji}
                      {count > 0 && ` ${count}`}
                    </button>
                  );
                })}
              </div>

              {/* TIME / READ */}

              <small className="block mt-3 opacity-70 text-xs">
                {new Date(msg.createdAt).toLocaleString()}

                {msg.senderId === user.id && msg.isRead && (
                  <span className="ml-2">✓✓</span>
                )}
              </small>
            </div>
          </div>
        ))}

        {typing && (
          <p className="italic text-gray-500 text-sm">
            {otherUser?.firstName} is typing...
          </p>
        )}

        <div ref={bottomRef} />
      </div>

      {/* INPUT */}

      <div className="border-t p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="text-2xl hover:scale-110 transition"
            type="button"
          >
            😊
          </button>

          <input
            value={message}
            onChange={(e) => handleTyping(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Type your message..."
            className="flex-1 border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />

          <button
            onClick={sendMessage}
            className="bg-indigo-600 hover:bg-indigo-700 transition text-white px-7 py-3 rounded-xl font-semibold"
            type="button"
          >
            Send
          </button>
        </div>

        {showEmojiPicker && (
          <div className="mt-4">
            <EmojiPicker onEmojiClick={addEmoji} width="100%" />
          </div>
        )}
      </div>
    </div>
  );

  /**
   * ============================================================
   * ROLE-SPECIFIC LAYOUT
   * ============================================================
   */

  if (user.role === "TEACHER") {
    return <TeacherLayout>{chatContent}</TeacherLayout>;
  }

  return <StudentLayout>{chatContent}</StudentLayout>;
}
