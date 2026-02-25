"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useDebouncedCallback } from "use-debounce";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { io, Socket } from "socket.io-client";
import { ErrorBoundary } from "react-error-boundary";
import {
  Loader2,
  Send,
  ArrowLeft,
  Check,
  CheckCheck,
  Circle,
  WifiOff,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  sendMessage,
  getMessages,
  getConversations,
  getChatUserInfo,
  getCurrentUserId,
  getSocketToken,
} from "@/lib/actions/messages";
import { getMySubscription } from "@/lib/actions/subscription";
import { getInitials, formatTimeAgo } from "@/lib/utils";

interface User {
  id: number;
  firstName: string | null;
  lastName: string | null;
  profileImage: string | null;
  isOnline?: boolean;
}

interface Message {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  status?: string | null;
  isRead: boolean | null;
  createdAt: Date | null;
  readAt?: Date | null;
  tempId?: string;
  pending?: boolean;
}

interface Conversation {
  id: number;
  otherUser: User;
  lastMessage?: {
    content: string;
    createdAt: Date;
    isRead?: boolean;
  };
  unreadCount: number;
}

function MessagesErrorFallback() {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <AlertCircle className="text-destructive h-10 w-10" />
        <p className="text-lg font-semibold">Something went wrong</p>
        <p className="text-muted-foreground text-sm">
          We couldn&#39;t load messages right now. Please refresh the page.
        </p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </CardContent>
    </Card>
  );
}

export default function MessagesPage() {
  return (
    <ErrorBoundary FallbackComponent={MessagesErrorFallback}>
      <Suspense
        fallback={
          <div className="flex h-screen items-center justify-center">
            <Loader2 className="text-primary h-8 w-8 animate-spin" />
          </div>
        }
      >
        <MessagesContent />
      </Suspense>
    </ErrorBoundary>
  );
}

function MessagesContent() {
  const searchParams = useSearchParams();
  const userIdParam = searchParams.get("userId");

  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(
    userIdParam ? parseInt(userIdParam) : null
  );
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [subscriptionPlan, setSubscriptionPlan] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());
  const [isTyping, setIsTyping] = useState(false);
  const [announcement, setAnnouncement] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedUserIdRef = useRef<number | null>(selectedUserId);
  const socketRef = useRef<Socket | null>(null);

  // Update refs when values change
  useEffect(() => {
    selectedUserIdRef.current = selectedUserId;
  }, [selectedUserId]);

  useEffect(() => {
    socketRef.current = socket;
  }, [socket]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load subscription and current user ID
  useEffect(() => {
    const loadUserData = async () => {
      const [subResult, userIdResult] = await Promise.all([
        getMySubscription(),
        getCurrentUserId(),
      ]);

      if (subResult.success && subResult.data) {
        setSubscriptionPlan(subResult.data.plan);
      }

      if (userIdResult.success && userIdResult.data) {
        setCurrentUserId(userIdResult.data);
      }
    };
    loadUserData();
  }, []);

  // Initialize Socket.io connection (only once per user)
  // Socket.io is disabled on serverless platforms (Vercel) — set NEXT_PUBLIC_SOCKET_URL to enable
  useEffect(() => {
    if (!currentUserId) return;

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL;
    // Skip Socket.io setup when no socket server is configured (e.g. Vercel deployment)
    if (!socketUrl) {
      setIsConnected(true); // Allow messaging via server actions alone
      return;
    }

    let socketInstance: Socket | null = null;

    const initSocket = async () => {
      // Get a JWT token for Socket.IO authentication
      const tokenResult = await getSocketToken();
      if (!tokenResult.success || !tokenResult.data) {
        console.error("Failed to get socket token");
        return;
      }

      socketInstance = io(socketUrl, {
        path: "/api/socketio/",
        transports: ["websocket", "polling"],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: Infinity,
        auth: { token: tokenResult.data },
      });

      setSocket(socketInstance);

      socketInstance.on("connect", () => {
        setIsConnected(true);
      });

      socketInstance.on("authenticated", () => {
        // User authenticated via JWT
      });

      // Receive list of currently online users
      socketInstance.on("online_users", ({ userIds }) => {
        // Update all conversations with online status
        setConversations((prev) => {
          return prev.map((convo) => {
            const isOnline = userIds.includes(convo.otherUser.id);
            return {
              ...convo,
              otherUser: { ...convo.otherUser, isOnline },
            };
          });
        });

        // Update selected user if they're in the online list
        setSelectedUser((prev) => {
          if (!prev) return null;
          const isOnline = userIds.includes(prev.id);
          return { ...prev, isOnline };
        });
      });

      socketInstance.on("disconnect", () => {
        setIsConnected(false);
      });

      socketInstance.on("connect_error", () => {
        setIsConnected(false);
      });

      socketInstance.on("reconnect_attempt", () => {
        // Reconnecting...
      });

      socketInstance.on("reconnect", () => {
        setIsConnected(true);
      });

      // Handle online/offline status updates
      socketInstance.on("user_status", ({ userId, isOnline }) => {
        // Update selected user if they're the one whose status changed
        setSelectedUser((prev) => {
          if (!prev || prev.id !== userId) return prev;
          return { ...prev, isOnline };
        });

        // Update in conversations list
        setConversations((prev) => {
          return prev.map((convo) => {
            if (convo.otherUser.id === userId) {
              return {
                ...convo,
                otherUser: { ...convo.otherUser, isOnline },
              };
            }
            return convo;
          });
        });
      });

      socketInstance.on("message_received", ({ message, from }) => {
        // Announce new message to screen readers
        if (message.senderId !== currentUserId) {
          setAnnouncement(`New message: ${message.content}`);
          setTimeout(() => setAnnouncement(""), 1000);
        }

        // Only add if it's for the current conversation (use ref to avoid re-renders)
        if (from === selectedUserIdRef.current || message.senderId === selectedUserIdRef.current) {
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === message.id)) return prev;
            return [...prev, message].sort((a, b) => {
              const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
              const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
              return timeA - timeB;
            });
          });

          // Auto-mark as read since conversation is open
          if (
            message.senderId === selectedUserIdRef.current &&
            socketRef.current &&
            currentUserId
          ) {
            socketRef.current.emit("messages_read", {
              otherUserId: from,
              messageIds: [message.id],
            });
          }
        }

        // Update conversations WITHOUT causing a refresh - just update the list
        setConversations((prev) => {
          const updated = [...prev];
          const convoIndex = updated.findIndex((c) => c.otherUser.id === from);
          if (convoIndex >= 0) {
            // Move to top and update last message
            const convo = updated.splice(convoIndex, 1)[0];
            convo.lastMessage = {
              content: message.content,
              createdAt: message.createdAt || new Date(),
              isRead: from === selectedUserIdRef.current ? true : false, // Mark as read if conversation is open
            };
            // Reset unread count if this conversation is currently open
            if (from === selectedUserIdRef.current) {
              convo.unreadCount = 0;
            } else {
              convo.unreadCount = (convo.unreadCount || 0) + 1;
            }
            updated.unshift(convo);
          }
          return updated;
        });
      });

      socketInstance.on("message_sent", ({ tempId, message }) => {
        // Replace temp message with real one
        setMessages((prev) =>
          prev.map((msg) =>
            msg.tempId === tempId ? { ...message, tempId: undefined, pending: false } : msg
          )
        );
      });

      socketInstance.on("user_typing", ({ userId, isTyping }) => {
        // Use ref to avoid re-renders
        if (userId === selectedUserIdRef.current) {
          setTypingUsers((prev) => {
            const next = new Set(prev);
            if (isTyping) {
              next.add(userId);
            } else {
              next.delete(userId);
            }
            return next;
          });

          // Auto-clear typing after 3 seconds
          if (isTyping) {
            setTimeout(() => {
              setTypingUsers((prev) => {
                const next = new Set(prev);
                next.delete(userId);
                return next;
              });
            }, 3000);
          }
        }
      });

      socketInstance.on("messages_read", ({ messageIds, readAt }) => {
        // Update message statuses to read
        setMessages((prev) =>
          prev.map((msg) =>
            messageIds.includes(msg.id)
              ? { ...msg, status: "read", isRead: true, readAt: new Date(readAt) }
              : msg
          )
        );
      });
    };

    initSocket();

    return () => {
      if (socketInstance) {
        socketInstance.off("connect");
        socketInstance.off("authenticated");
        socketInstance.off("online_users");
        socketInstance.off("disconnect");
        socketInstance.off("connect_error");
        socketInstance.off("reconnect_attempt");
        socketInstance.off("reconnect");
        socketInstance.off("user_status");
        socketInstance.off("message_received");
        socketInstance.off("message_sent");
        socketInstance.off("user_typing");
        socketInstance.off("messages_read");
        socketInstance.disconnect();
      }
    };
  }, [currentUserId]);

  // Load conversations
  const loadConversations = useCallback(async () => {
    const result = await getConversations();
    if (result.success && result.data) {
      setConversations(result.data);
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Load messages for selected user (memoized to prevent repeated calls)
  const loadMessages = useCallback(
    async (userId: number) => {
      const result = await getMessages(userId);
      if (result.success && result.data) {
        setMessages(result.data as Message[]);

        // Mark messages as read using ref to avoid dependency
        const unreadMessageIds = result.data
          .filter((m: Message) => !m.isRead && m.receiverId === currentUserId)
          .map((m: Message) => m.id);

        if (unreadMessageIds.length > 0 && socketRef.current && currentUserId) {
          socketRef.current.emit("messages_read", {
            otherUserId: userId,
            messageIds: unreadMessageIds,
          });
        }
      } else if (result.error) {
        toast.error(result.error);
      }
    },
    [currentUserId]
  );

  // Update selected user info when conversations change
  useEffect(() => {
    if (!selectedUserId) return;

    const convo = conversations.find((c) => c.otherUser.id === selectedUserId);
    if (convo) {
      setSelectedUser(convo.otherUser);
    }
  }, [selectedUserId, conversations]);

  // Load selected user info (only when selectedUserId changes)
  useEffect(() => {
    if (!selectedUserId) {
      setSelectedUser(null);
      setMessages([]);
      return;
    }

    // Clear unread count for this conversation immediately
    setConversations((prev) => {
      return prev.map((convo) => {
        if (convo.otherUser.id === selectedUserId) {
          return { ...convo, unreadCount: 0 };
        }
        return convo;
      });
    });

    // Try to find user in conversations first
    const convo = conversations.find((c) => c.otherUser.id === selectedUserId);
    if (convo) {
      setSelectedUser(convo.otherUser);
    } else {
      // Fetch user info from server
      getChatUserInfo(selectedUserId).then((result) => {
        if (result.success && result.data) {
          setSelectedUser(result.data as User);
        }
      });
    }

    // Load messages ONLY when selectedUserId changes
    setIsLoading(true);
    loadMessages(selectedUserId).finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUserId]);

  // Stop typing indicator after 2s of no input
  const stopTyping = useDebouncedCallback(() => {
    setIsTyping(false);
    if (socketRef.current && currentUserId && selectedUserId) {
      socketRef.current.emit("typing", {
        otherUserId: selectedUserId,
        isTyping: false,
      });
    }
  }, 2000);

  // Handle typing indicator
  const handleInputChange = (value: string) => {
    setNewMessage(value);

    if (!selectedUserId || !currentUserId) return;

    if (value.length > 0 && !isTyping) {
      setIsTyping(true);
      socket?.emit("typing", {
        otherUserId: selectedUserId,
        isTyping: true,
      });
    }

    stopTyping();
  };

  // Send message with optimistic UI
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedUserId || isSending || !currentUserId) return;

    const messageContent = newMessage.trim();
    setNewMessage("");
    setIsSending(true);

    // Stop typing indicator
    if (isTyping) {
      setIsTyping(false);
      socket?.emit("typing", {
        otherUserId: selectedUserId,
        isTyping: false,
      });
    }

    // Optimistic UI: Add message immediately
    const tempId = `temp-${crypto.randomUUID()}`;
    const optimisticMessage: Message = {
      id: -1,
      tempId,
      senderId: currentUserId,
      receiverId: selectedUserId,
      content: messageContent,
      status: "pending",
      isRead: false,
      createdAt: new Date(),
      pending: true,
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    try {
      const result = await sendMessage(selectedUserId, messageContent);

      if (result.success && result.data) {
        const realMessage = result.data as Message;

        // Replace optimistic message with real one
        setMessages((prev) =>
          prev.map((msg) => (msg.tempId === tempId ? { ...realMessage, pending: false } : msg))
        );

        // Emit to Socket.io if connected (server uses authenticated userId as sender)
        socket?.emit("new_message", {
          receiverId: selectedUserId,
          message: { ...realMessage, tempId },
        });

        // Update conversations list WITHOUT refresh
        setConversations((prev) => {
          const updated = [...prev];
          const convoIndex = updated.findIndex((c) => c.otherUser.id === selectedUserId);
          if (convoIndex >= 0) {
            const convo = updated.splice(convoIndex, 1)[0];
            convo.lastMessage = {
              content: realMessage.content,
              createdAt: realMessage.createdAt || new Date(),
              isRead: false,
            };
            updated.unshift(convo);
          }
          return updated;
        });

        // Focus input
        inputRef.current?.focus();
      } else {
        // Remove failed message
        setMessages((prev) => prev.filter((msg) => msg.tempId !== tempId));
        toast.error(result.error || "Failed to send message");
      }
    } catch {
      setMessages((prev) => prev.filter((msg) => msg.tempId !== tempId));
      toast.error("Network error. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  // Render message status icon
  const renderMessageStatus = (msg: Message, isMe: boolean) => {
    if (!isMe) return null;

    if (msg.pending) {
      return <Circle className="text-muted-foreground h-3 w-3 animate-pulse" />;
    }

    switch (msg.status) {
      case "sent":
        return <Check className="text-muted-foreground h-3 w-3" />;
      case "delivered":
        return <CheckCheck className="text-muted-foreground h-3 w-3" />;
      case "read":
        return <CheckCheck className="h-3 w-3 text-yellow-500" />; // Yellow for read
      default:
        return <Check className="text-muted-foreground h-3 w-3" />;
    }
  };

  // Check if user is typing
  const isUserTyping = selectedUserId ? typingUsers.has(selectedUserId) : false;

  // Free plan check
  if (subscriptionPlan === "free") {
    return (
      <div className="container-wide px-4 py-8 sm:py-16">
        <Card className="mx-auto max-w-md space-y-4 p-5 text-center sm:p-8">
          <h2 className="text-xl font-bold sm:text-2xl">Upgrade to Message</h2>
          <p className="text-muted-foreground">
            Free users cannot access messaging. Upgrade to a premium plan to start conversations.
          </p>
          <Button asChild className="w-full">
            <a href="/membership">Upgrade Now</a>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] pb-16 lg:pb-0">
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>
      <div
        className={`bg-background w-full border-r md:w-80 md:shrink-0 ${
          selectedUserId ? "hidden md:block" : ""
        }`}
      >
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-xl font-bold">Messages</h2>
          {!isConnected && (
            <span title="Reconnecting...">
              <WifiOff className="text-muted-foreground h-5 w-5 animate-pulse" />
            </span>
          )}
        </div>
        <div className="h-[calc(100%-4rem)] overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="text-muted-foreground p-8 text-center">
              <p>No conversations yet</p>
              <p className="mt-2 text-sm">Send an interest to start chatting</p>
            </div>
          ) : (
            conversations.map((convo) => (
              <button
                key={convo.id}
                onClick={() => setSelectedUserId(convo.otherUser.id)}
                className={`hover:bg-muted/50 flex w-full items-center gap-3 p-4 transition-colors ${
                  selectedUserId === convo.otherUser.id ? "bg-muted" : ""
                }`}
              >
                <div className="relative">
                  <Avatar>
                    <AvatarImage src={convo.otherUser.profileImage || ""} />
                    <AvatarFallback>
                      {getInitials(convo.otherUser.firstName, convo.otherUser.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  {convo.otherUser.isOnline && (
                    <div className="border-background absolute right-0 bottom-0 h-3 w-3 rounded-full border-2 bg-green-500" />
                  )}
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center justify-between">
                    <p className="font-medium">
                      {convo.otherUser.firstName} {convo.otherUser.lastName}
                    </p>
                    {convo.unreadCount > 0 && (
                      <Badge variant="default" className="ml-2">
                        {convo.unreadCount}
                      </Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground truncate text-sm">
                    {convo.lastMessage?.content || "No messages yet"}
                  </p>
                  {convo.lastMessage?.createdAt && (
                    <p className="text-muted-foreground text-xs">
                      {formatTimeAgo(new Date(convo.lastMessage.createdAt))}
                    </p>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div className={`flex flex-1 flex-col ${!selectedUserId ? "hidden md:flex" : ""}`}>
        {selectedUser ? (
          <>
            <div className="flex items-center gap-3 border-b p-4">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setSelectedUserId(null)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Avatar>
                <AvatarImage src={selectedUser.profileImage || ""} />
                <AvatarFallback>
                  {getInitials(selectedUser.firstName, selectedUser.lastName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-medium">
                  {selectedUser.firstName} {selectedUser.lastName}
                </p>
                {isUserTyping ? (
                  <p className="text-primary animate-pulse text-sm font-medium">typing...</p>
                ) : (
                  <p className="text-muted-foreground text-sm">
                    {selectedUser.isOnline ? "Online" : "Offline"}
                  </p>
                )}
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {isLoading ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="text-primary h-8 w-8 animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-muted-foreground flex h-full items-center justify-center">
                  <p>No messages yet. Say hi! 👋</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMe = currentUserId
                    ? msg.senderId === currentUserId
                    : msg.senderId !== selectedUserId;
                  return (
                    <div
                      key={msg.id || msg.tempId}
                      className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] rounded-lg px-3 py-2 sm:max-w-xs sm:px-4 lg:max-w-md ${
                          isMe ? "bg-primary text-primary-foreground" : "bg-muted"
                        } ${msg.pending ? "opacity-60" : ""}`}
                      >
                        <p className="break-words">{msg.content}</p>
                        <div className="mt-1 flex items-center gap-1">
                          <p className="text-xs opacity-70">
                            {msg.createdAt
                              ? new Date(msg.createdAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : ""}
                          </p>
                          {renderMessageStatus(msg, isMe)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t p-3 sm:p-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex gap-2"
              >
                <Input
                  ref={inputRef}
                  value={newMessage}
                  onChange={(e) => handleInputChange(e.target.value)}
                  placeholder="Type a message..."
                  maxLength={2000}
                  disabled={isSending || !isConnected}
                />
                <Button type="submit" disabled={isSending || !newMessage.trim() || !isConnected}>
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="text-muted-foreground flex flex-1 items-center justify-center">
            <p>Select a conversation to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
}
