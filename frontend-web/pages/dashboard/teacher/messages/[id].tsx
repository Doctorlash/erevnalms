import { useRouter } from "next/router";
import { useState, useEffect, useRef, useCallback } from "react";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";

import TeacherLayout from "../../../../layouts/TeacherLayout";
import useTeacherAuth from "../../../../hooks/useTeacherAuth";
import { useAuth } from "../../../../contexts/AuthContext";

import api from "../../../../services/api";
import socket from "../../../../services/socket";

interface Reaction {
  id: string;
  emoji: string;
  userId: string;
}

interface Message {
  id: string;
  conversationId?: string;
  senderId: string;
  content: string;
  createdAt: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: number;
  isRead?: boolean;
  reactions: Reaction[];
}

interface ChatUser {
  id: string;
  firstName: string;
  lastName: string;
  role: "ADMIN" | "TEACHER" | "STUDENT";
  profileImage?: string;
}

interface Conversation {
  id: string;
  participantOneId: string;
  participantTwoId: string;
  participantOne: ChatUser;
  participantTwo: ChatUser;
  messages: Message[];
}

export default function TeacherConversationPage() {
  useTeacherAuth();

  const { user } = useAuth();
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

  const bottomRef = useRef<HTMLDivElement>(null);

  /*
   * Load conversation.
   */
  const loadConversation = useCallback(async () => {
    if (!conversationId) return;

    try {
      const response = await api.get(
        `/messages/conversation/${conversationId}`,
      );

      const data: Conversation = response.data;

      setConversation(data);
      setMessages(data.messages ?? []);
    } catch (error) {
      console.error("Failed to load conversation:", error);
    }
  }, [conversationId]);

  useEffect(() => {
    loadConversation();
  }, [loadConversation]);

  /*
   * Register teacher with Socket.IO.
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
   * Join conversation room.
   */
  useEffect(() => {
    if (!conversationId) return;

    const joinConversation = () => {
      socket.emit("join", conversationId);
    };

    if (socket.connected) {
      joinConversation();
    } else {
      socket.once("connect", joinConversation);
    }

    return () => {
      socket.off("connect", joinConversation);
      socket.emit("leave", conversationId);
    };
  }, [conversationId]);

  /*
   * Receive new messages.
   */
  useEffect(() => {
    const handleNewMessage = (newMessage: Message) => {
      if (
        newMessage.conversationId &&
        newMessage.conversationId !== conversationId
      ) {
        return;
      }

      setMessages((previous) => {
        /*
         * Prevent duplicate messages.
         */
        if (previous.some((message) => message.id === newMessage.id)) {
          return previous;
        }

        return [...previous, newMessage];
      });
    };

    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.off("newMessage", handleNewMessage);
    };
  }, [conversationId]);

  /*
   * Typing indicator.
   */
  useEffect(() => {
    let timer: NodeJS.Timeout;

    const handleTyping = (data: {
      conversationId: string;
      senderId: string;
    }) => {
      if (data.conversationId !== conversationId) return;
      if (data.senderId === user?.id) return;

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
  }, [conversationId, user?.id]);

  /*
   * Online/offline users.
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

    const handleUserOffline = ({
      userId,
      lastSeen,
    }: {
      userId: string;
      lastSeen: string;
    }) => {
      setOnlineUsers((previous) => previous.filter((id) => id !== userId));

      setLastSeen((previous) => ({
        ...previous,
        [userId]: lastSeen,
      }));
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
   * Auto-scroll.
   */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages]);

  /*
   * Send message.
   */
  const sendMessage = async () => {
    if (!message.trim() || !user?.id || !conversationId) {
      return;
    }

    try {
      await api.post("/messages/send", {
        conversationId,
        senderId: user.id,
        content: message.trim(),
      });

      setMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  /*
   * Typing.
   */
  const handleTyping = (value: string) => {
    setMessage(value);

    if (!conversationId || !user?.id) return;

    socket.emit("typing", {
      conversationId,
      senderId: user.id,
    });
  };

  /*
   * Emoji.
   */
  const addEmoji = (emoji: EmojiClickData) => {
    setMessage((previous) => previous + emoji.emoji);

    setShowEmojiPicker(false);
  };

  /*
   * Reaction.
   */
  const reactToMessage = async (messageId: string, emoji: string) => {
    if (!user?.id) return;

    try {
      await api.post("/messages/reaction", {
        messageId,
        userId: user.id,
        emoji,
      });
    } catch (error) {
      console.error("Failed to react to message:", error);
    }
  };

  if (!conversation) {
    return (
      <TeacherLayout>
        <div className="flex h-[80vh] items-center justify-center">
          <p className="text-lg text-gray-500">Loading conversation...</p>
        </div>
      </TeacherLayout>
    );
  }

  const otherUser =
    conversation.participantOneId === user?.id
      ? conversation.participantTwo
      : conversation.participantOne;

  const isOnline = onlineUsers.includes(otherUser.id);

  return (
    <TeacherLayout>
      <div className="flex h-[82vh] flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        {/* HEADER */}

        <div className="flex items-center justify-between border-b px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-lg font-bold text-white">
              {otherUser.firstName?.charAt(0)}
              {otherUser.lastName?.charAt(0)}
            </div>

            <div>
              <h2 className="text-xl font-bold text-indigo-700">
                {otherUser.firstName} {otherUser.lastName}
              </h2>

              {isOnline ? (
                <p className="text-sm text-green-600">● Online</p>
              ) : (
                <p className="text-sm text-gray-500">
                  Last seen{" "}
                  {lastSeen[otherUser.id]
                    ? new Date(lastSeen[otherUser.id]).toLocaleString()
                    : "recently"}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* CHAT */}

        <div className="flex-1 space-y-5 overflow-y-auto bg-gray-50 p-6">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${
                msg.senderId === user?.id ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-lg rounded-2xl px-5 py-3 shadow ${
                  msg.senderId === user?.id
                    ? "bg-indigo-600 text-white"
                    : "bg-white"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>

                {msg.fileUrl && (
                  <a
                    href={msg.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 block text-sm underline"
                  >
                    📎 {msg.fileName}
                  </a>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {["👍", "❤️", "😂", "🔥", "👏", "😮"].map((emoji) => {
                    const count =
                      msg.reactions?.filter(
                        (reaction) => reaction.emoji === emoji,
                      ).length || 0;

                    return (
                      <button
                        key={emoji}
                        onClick={() => reactToMessage(msg.id, emoji)}
                        className="rounded-full bg-white/20 px-2 py-1 text-sm transition hover:bg-white/30"
                      >
                        {emoji}
                        {count > 0 && ` ${count}`}
                      </button>
                    );
                  })}
                </div>

                <small className="mt-3 block text-xs opacity-70">
                  {new Date(msg.createdAt).toLocaleString()}
                </small>
              </div>
            </div>
          ))}

          {typing && (
            <p className="text-sm italic text-gray-500">
              {otherUser.firstName} is typing...
            </p>
          )}

          <div ref={bottomRef} />
        </div>

        {/* INPUT */}

        <div className="border-t p-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowEmojiPicker((previous) => !previous)}
              className="text-2xl transition hover:scale-110"
            >
              😊
            </button>

            <input
              value={message}
              onChange={(event) => handleTyping(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Type your reply..."
              className="flex-1 rounded-xl border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <button
              onClick={sendMessage}
              className="rounded-xl bg-indigo-600 px-7 py-3 font-semibold text-white transition hover:bg-indigo-700"
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
    </TeacherLayout>
  );
}
