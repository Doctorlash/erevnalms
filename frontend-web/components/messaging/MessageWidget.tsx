/* eslint-disable @typescript-eslint/no-explicit-any */

import { useCallback, useEffect, useRef, useState } from "react";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";

import { useAuth } from "../../contexts/AuthContext";
import api from "../../services/api";
import socket from "../../services/socket";

interface ConversationUser {
  id: string;
  firstName: string;
  lastName: string;
  role: "ADMIN" | "TEACHER" | "STUDENT";
  profileImage?: string;
  isOnline?: boolean;
  lastSeen?: string;
}

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

interface Conversation {
  id: string;
  participantOneId: string;
  participantTwoId: string;
  participantOne: ConversationUser;
  participantTwo: ConversationUser;
  messages: Message[];
}

export default function MessageWidget() {
  const { user, token } = useAuth();

  const [open, setOpen] = useState(false);

  const [conversations, setConversations] = useState<Conversation[]>([]);

  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);

  const [message, setMessage] = useState("");

  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(false);

  const [chatLoading, setChatLoading] = useState(false);

  const [typing, setTyping] = useState(false);

  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);

  const [lastSeen, setLastSeen] = useState<Record<string, string>>({});

  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  /*
   * Only students and teachers should see
   * the dashboard messaging widget.
   */
  if (!token || !user || (user.role !== "STUDENT" && user.role !== "TEACHER")) {
    return null;
  }

  /*
   * ============================================================
   * REGISTER USER WITH SOCKET
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
   * LOAD CONVERSATIONS
   * ============================================================
   */

  const loadConversations = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      const res = await api.get(`/messages/user/${user.id}`);

      setConversations(res.data || []);
    } catch (error) {
      console.error("Failed to load conversations:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  /*
   * Load conversations when widget opens.
   */

  useEffect(() => {
    if (!open) return;

    loadConversations();
  }, [open, loadConversations]);

  /*
   * ============================================================
   * ONLINE USERS
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
   * ============================================================
   * OPEN CONVERSATION
   * ============================================================
   */

  const openConversation = async (conversation: Conversation) => {
    try {
      setChatLoading(true);

      setSelectedConversation(conversation);

      const res = await api.get(`/messages/conversation/${conversation.id}`);

      const data: Conversation = res.data;

      setSelectedConversation(data);

      setMessages(data.messages || []);

      socket.emit("join", conversation.id);
    } catch (error) {
      console.error("Failed to load conversation:", error);
    } finally {
      setChatLoading(false);
    }
  };

  /*
   * ============================================================
   * CLOSE CONVERSATION
   * ============================================================
   */

  const closeConversation = () => {
    if (selectedConversation) {
      socket.emit("leave", selectedConversation.id);
    }

    setSelectedConversation(null);
    setMessages([]);
    setMessage("");
    setShowEmojiPicker(false);
    setTyping(false);
  };

  /*
   * ============================================================
   * RECEIVE NEW MESSAGE
   * ============================================================
   */

  useEffect(() => {
    const handleNewMessage = (newMessage: Message) => {
      /*
       * If the message belongs to the currently open conversation,
       * display it immediately.
       */
      if (selectedConversation) {
        setMessages((previous) => {
          if (previous.some((item) => item.id === newMessage.id)) {
            return previous;
          }

          return [...previous, newMessage];
        });
      }

      /*
       * Refresh the conversation list so the latest message
       * appears in the widget.
       */
      if (open) {
        loadConversations();
      }
    };

    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.off("newMessage", handleNewMessage);
    };
  }, [selectedConversation, open, loadConversations]);

  /*
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
      if (!selectedConversation) return;

      if (
        data.senderId === user.id ||
        data.conversationId !== selectedConversation.id
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
  }, [selectedConversation, user.id]);

  /*
   * ============================================================
   * AUTO SCROLL
   * ============================================================
   */

  useEffect(() => {
    if (!selectedConversation) return;

    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, selectedConversation]);

  /*
   * ============================================================
   * MARK MESSAGES AS READ
   * ============================================================
   */

  useEffect(() => {
    if (!selectedConversation || !messages.length) return;

    const markUnreadMessages = async () => {
      const unreadMessages = messages.filter(
        (msg) => msg.senderId !== user.id && !msg.isRead,
      );

      for (const msg of unreadMessages) {
        try {
          await api.patch(`/messages/${msg.id}/read`, {
            userId: user.id,
          });

          setMessages((previous) =>
            previous.map((item) =>
              item.id === msg.id
                ? {
                    ...item,
                    isRead: true,
                  }
                : item,
            ),
          );
        } catch (error) {
          console.error("Failed to mark message as read:", error);
        }
      }
    };

    markUnreadMessages();
  }, [messages, selectedConversation, user.id]);

  /*
   * ============================================================
   * SEND MESSAGE
   * ============================================================
   */

  const sendMessage = async () => {
    if (!message.trim() || !selectedConversation || !user) {
      return;
    }

    try {
      await api.post("/messages/send", {
        conversationId: selectedConversation.id,
        senderId: user.id,
        content: message.trim(),
      });

      setMessage("");
      setShowEmojiPicker(false);
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  /*
   * ============================================================
   * TYPING
   * ============================================================
   */

  const handleTyping = (value: string) => {
    setMessage(value);

    if (!selectedConversation || !user) return;

    socket.emit("typing", {
      conversationId: selectedConversation.id,
      senderId: user.id,
    });
  };

  /*
   * ============================================================
   * EMOJI
   * ============================================================
   */

  const addEmoji = (emoji: EmojiClickData) => {
    setMessage((previous) => previous + emoji.emoji);
    setShowEmojiPicker(false);
  };

  /*
   * ============================================================
   * REACTION
   * ============================================================
   */

  const reactToMessage = async (messageId: string, emoji: string) => {
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

  /*
   * ============================================================
   * REACTION UPDATES
   * ============================================================
   */

  useEffect(() => {
    const handleReactionUpdated = (data: {
      messageId: string;
      reactions: Reaction[];
    }) => {
      setMessages((previous) =>
        previous.map((msg) =>
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

  /*
   * ============================================================
   * FILTER CONVERSATIONS
   * ============================================================
   */

  const filteredConversations = conversations.filter((conversation) => {
    const otherUser =
      conversation.participantOneId === user.id
        ? conversation.participantTwo
        : conversation.participantOne;

    const latestMessage = conversation.messages?.[0];

    const name = `${otherUser.firstName} ${otherUser.lastName}`.toLowerCase();

    const latestText = latestMessage?.content?.toLowerCase() || "";

    const query = search.toLowerCase().trim();

    if (!query) return true;

    return name.includes(query) || latestText.includes(query);
  });

  /*
   * ============================================================
   * GET OTHER USER
   * ============================================================
   */

  const getOtherUser = (conversation: Conversation) => {
    return conversation.participantOneId === user.id
      ? conversation.participantTwo
      : conversation.participantOne;
  };

  /*
   * ============================================================
   * UNREAD COUNT
   * ============================================================
   */

  const unreadCount = conversations.reduce((total, conversation) => {
    const count =
      conversation.messages?.filter(
        (msg) => msg.senderId !== user.id && !msg.isRead,
      ).length || 0;

    return total + count;
  }, 0);

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <>
      {/* ========================================================
          CHAT WINDOW
      ======================================================== */}

      {open && (
        <div className="fixed bottom-24 right-5 z-[9999] w-[380px] max-w-[calc(100vw-2rem)]">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            {/* HEADER */}

            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {selectedConversation ? (
                  <button
                    onClick={closeConversation}
                    className="text-white/90 hover:text-white text-xl"
                    type="button"
                  >
                    ←
                  </button>
                ) : (
                  <span className="text-xl">💬</span>
                )}

                <div>
                  <h3 className="font-bold">
                    {selectedConversation
                      ? `${getOtherUser(selectedConversation).firstName} ${getOtherUser(selectedConversation).lastName}`
                      : "Messages"}
                  </h3>

                  {selectedConversation && (
                    <p className="text-xs text-indigo-100">
                      {onlineUsers.includes(
                        getOtherUser(selectedConversation).id,
                      )
                        ? "Online"
                        : "Offline"}
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={() => {
                  closeConversation();
                  setOpen(false);
                }}
                className="text-white/80 hover:text-white text-xl"
                type="button"
              >
                ✕
              </button>
            </div>

            {/* ==================================================
                CONVERSATION LIST
            ================================================== */}

            {!selectedConversation && (
              <>
                <div className="p-3 border-b">
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search conversations..."
                    className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="h-[430px] overflow-y-auto">
                  {loading && (
                    <div className="p-8 text-center text-slate-500">
                      Loading messages...
                    </div>
                  )}

                  {!loading && filteredConversations.length === 0 && (
                    <div className="p-8 text-center">
                      <div className="text-4xl mb-3">💬</div>

                      <p className="font-semibold text-slate-700">
                        No conversations
                      </p>

                      <p className="text-sm text-slate-500 mt-1">
                        Your messages will appear here.
                      </p>
                    </div>
                  )}

                  {!loading &&
                    filteredConversations.map((conversation) => {
                      const otherUser = getOtherUser(conversation);

                      const latestMessage = conversation.messages?.[0];

                      const isOnline =
                        onlineUsers.includes(otherUser.id) ||
                        !!otherUser.isOnline;

                      const unread =
                        conversation.messages?.filter(
                          (msg) => msg.senderId !== user.id && !msg.isRead,
                        ).length || 0;

                      return (
                        <button
                          key={conversation.id}
                          onClick={() => openConversation(conversation)}
                          className="w-full text-left px-4 py-4 border-b hover:bg-indigo-50 transition"
                          type="button"
                        >
                          <div className="flex items-center gap-3">
                            {/* AVATAR */}

                            <div className="relative shrink-0">
                              {otherUser.profileImage ? (
                                <img
                                  src={otherUser.profileImage}
                                  alt=""
                                  className="w-11 h-11 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-11 h-11 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold">
                                  {otherUser.firstName?.charAt(0)}
                                  {otherUser.lastName?.charAt(0)}
                                </div>
                              )}

                              <span
                                className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                                  isOnline ? "bg-green-500" : "bg-slate-300"
                                }`}
                              />
                            </div>

                            {/* INFO */}

                            <div className="min-w-0 flex-1">
                              <div className="flex justify-between gap-2">
                                <h4 className="font-semibold text-slate-800 truncate">
                                  {otherUser.firstName} {otherUser.lastName}
                                </h4>

                                {unread > 0 && (
                                  <span className="shrink-0 bg-indigo-600 text-white text-[10px] font-bold rounded-full min-w-5 h-5 px-1 flex items-center justify-center">
                                    {unread > 9 ? "9+" : unread}
                                  </span>
                                )}
                              </div>

                              <p className="text-xs text-slate-500">
                                {otherUser.role}
                              </p>

                              <p className="text-sm text-slate-500 truncate mt-1">
                                {latestMessage?.content || "No messages yet"}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </>
            )}

            {/* ==================================================
                CHAT
            ================================================== */}

            {selectedConversation && (
              <>
                <div className="h-[390px] overflow-y-auto bg-slate-50 p-4 space-y-3">
                  {chatLoading && (
                    <div className="text-center text-slate-500 py-10">
                      Loading conversation...
                    </div>
                  )}

                  {!chatLoading &&
                    messages.map((msg) => {
                      const own = msg.senderId === user.id;

                      return (
                        <div
                          key={msg.id}
                          className={`flex ${
                            own ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[78%] rounded-2xl px-4 py-3 shadow-sm ${
                              own
                                ? "bg-indigo-600 text-white rounded-br-md"
                                : "bg-white text-slate-800 rounded-bl-md"
                            }`}
                          >
                            {msg.content && (
                              <p className="text-sm whitespace-pre-wrap break-words">
                                {msg.content}
                              </p>
                            )}

                            {msg.fileUrl && (
                              <a
                                href={msg.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="underline text-xs block mt-2"
                              >
                                📎 {msg.fileName || "Attachment"}
                              </a>
                            )}

                            {/* REACTIONS */}

                            <div className="flex gap-1 mt-2 flex-wrap">
                              {["👍", "❤️", "😂", "🔥", "👏", "😮"].map(
                                (emoji) => {
                                  const count =
                                    msg.reactions?.filter(
                                      (reaction) => reaction.emoji === emoji,
                                    ).length || 0;

                                  return (
                                    <button
                                      key={emoji}
                                      onClick={() =>
                                        reactToMessage(msg.id, emoji)
                                      }
                                      type="button"
                                      className="text-xs opacity-80 hover:opacity-100"
                                    >
                                      {emoji}
                                      {count > 0 && ` ${count}`}
                                    </button>
                                  );
                                },
                              )}
                            </div>

                            <div className="text-[10px] opacity-60 mt-2">
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}

                              {own && msg.isRead && (
                                <span className="ml-1">✓✓</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                  {typing && (
                    <p className="text-xs italic text-slate-500">
                      {getOtherUser(selectedConversation).firstName} is
                      typing...
                    </p>
                  )}

                  <div ref={bottomRef} />
                </div>

                {/* INPUT */}

                <div className="border-t bg-white p-3 relative">
                  {showEmojiPicker && (
                    <div className="absolute bottom-16 left-2 z-50">
                      <EmojiPicker
                        onEmojiClick={addEmoji}
                        width={320}
                        height={350}
                      />
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="text-xl hover:scale-110 transition"
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
                      placeholder="Type a message..."
                      className="flex-1 min-w-0 border border-slate-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />

                    <button
                      type="button"
                      onClick={sendMessage}
                      disabled={!message.trim()}
                      className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white px-4 py-2.5 rounded-xl font-semibold text-sm"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          FLOATING BUTTON
      ======================================================== */}

      <button
        type="button"
        onClick={() => {
          setOpen((previous) => !previous);

          if (!open) {
            loadConversations();
          }
        }}
        className="fixed bottom-5 right-5 z-[9998] h-14 w-14 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xl flex items-center justify-center text-2xl transition-all hover:scale-105"
        title="Messages"
      >
        {open ? "✕" : "💬"}

        {!open && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold min-w-5 h-5 px-1 rounded-full flex items-center justify-center border-2 border-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>
    </>
  );
}
