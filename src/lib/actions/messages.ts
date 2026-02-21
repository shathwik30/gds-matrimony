"use server";

import { db, messages, conversations, profiles, interests, messageAttachments, typingIndicators } from "@/lib/db";
import { eq, and, or, desc, asc, sql, gt, ne, inArray } from "drizzle-orm";
import { logActivity } from "@/lib/actions/activity";
import { getActiveSubscription } from "@/lib/actions/subscription";
import { requireAuth, checkBlocked } from "@/lib/actions/helpers";
import { isFreeUser } from "@/lib/utils/subscription";
import jwt from "jsonwebtoken";
import { env } from "@/lib/env";
import type { ActionResult, Conversation } from "@/types";

// Generate a short-lived JWT token for Socket.IO authentication
export async function getSocketToken(): Promise<ActionResult<string>> {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const { userId } = authResult;

    const token = jwt.sign(
      { id: String(userId), sub: String(userId) },
      env.AUTH_SECRET,
      { algorithm: "HS256", expiresIn: "24h" }
    );

    return { success: true, data: token };
  } catch (error) {
    console.error("Socket token error:", error);
    return { success: false, error: "Failed to generate token" };
  }
}

interface MessageData {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  status?: string | null;
  isRead: boolean | null;
  readAt?: Date | null;
  deliveredAt?: Date | null;
  createdAt: Date | null;
  sender?: {
    firstName: string | null;
    lastName: string | null;
    profileImage: string | null;
  };
}

// Check if users can message each other (mutual interest accepted and not blocked)
async function canMessage(userId1: number, userId2: number): Promise<boolean> {
  // Check if blocked first
  const blocked = await checkBlocked(userId1, userId2);
  if (blocked) return false;

  const mutualInterest = await db.query.interests.findFirst({
    where: and(
      or(
        and(eq(interests.senderId, userId1), eq(interests.receiverId, userId2)),
        and(eq(interests.senderId, userId2), eq(interests.receiverId, userId1))
      ),
      eq(interests.status, "accepted")
    ),
  });

  return !!mutualInterest;
}

// Get or create conversation
async function getOrCreateConversation(user1Id: number, user2Id: number): Promise<number> {
  // Ensure user1Id < user2Id for consistent lookup
  const [smallerId, largerId] = user1Id < user2Id ? [user1Id, user2Id] : [user2Id, user1Id];

  const conversation = await db.query.conversations.findFirst({
    where: and(
      eq(conversations.user1Id, smallerId),
      eq(conversations.user2Id, largerId)
    ),
  });

  if (!conversation) {
    // Use onConflictDoNothing to handle race condition where two concurrent
    // requests try to create the same conversation
    const result = await db
      .insert(conversations)
      .values({
        user1Id: smallerId,
        user2Id: largerId,
      })
      .onConflictDoNothing()
      .returning({ id: conversations.id });

    if (result.length > 0) {
      return result[0].id;
    }

    // If insert was a no-op due to conflict, fetch the existing one
    const existing = await db.query.conversations.findFirst({
      where: and(
        eq(conversations.user1Id, smallerId),
        eq(conversations.user2Id, largerId)
      ),
    });

    return existing!.id;
  }

  return conversation.id;
}

// Send a message
export async function sendMessage(
  receiverId: number,
  content: string
): Promise<ActionResult<MessageData>> {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const senderId = authResult.userId;

    if (!Number.isInteger(receiverId) || receiverId <= 0) {
      return { success: false, error: "Invalid recipient" };
    }

    if (senderId === receiverId) {
      return { success: false, error: "Cannot message yourself" };
    }

    if (!content.trim()) {
      return { success: false, error: "Message cannot be empty" };
    }

    if (content.trim().length > 2000) {
      return { success: false, error: "Message is too long (max 2000 characters)" };
    }

    // Check subscription - free users cannot chat
    const activeSub = await getActiveSubscription(senderId);
    if (isFreeUser(activeSub)) {
      return {
        success: false,
        error: "Upgrade to a premium plan to send messages. Free users cannot access chat."
      };
    }

    // Check if users can message (mutual interest accepted and not blocked)
    const allowed = await canMessage(senderId, receiverId);
    if (!allowed) {
      return {
        success: false,
        error: "You can only message users who have accepted your interest or whose interest you have accepted."
      };
    }

    // Get or create conversation (outside transaction since it uses onConflictDoNothing)
    const conversationId = await getOrCreateConversation(senderId, receiverId);

    // Create message and update conversation atomically
    const [newMessage] = await db.transaction(async (tx) => {
      const result = await tx
        .insert(messages)
        .values({
          senderId,
          receiverId,
          content: content.trim(),
          status: "sent",
        })
        .returning();

      await tx
        .update(conversations)
        .set({
          lastMessageId: result[0].id,
          lastMessageAt: new Date(),
        })
        .where(eq(conversations.id, conversationId));

      return result;
    });

    // Get sender profile info for complete message data
    const senderProfile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, senderId),
      columns: {
        firstName: true,
        lastName: true,
        profileImage: true,
      },
    });

    // Prepare message data for response and broadcast
    const messageData: MessageData = {
      id: newMessage.id,
      senderId: newMessage.senderId,
      receiverId: newMessage.receiverId,
      content: newMessage.content,
      status: newMessage.status,
      isRead: newMessage.isRead,
      readAt: newMessage.readAt,
      deliveredAt: newMessage.deliveredAt,
      createdAt: newMessage.createdAt,
      sender: senderProfile
        ? {
            firstName: senderProfile.firstName,
            lastName: senderProfile.lastName,
            profileImage: senderProfile.profileImage,
          }
        : undefined,
    };

    // Socket.io broadcasting is handled by the client
    // No server-side broadcasting needed

    // Log activity (non-blocking - don't fail message if log fails)
    try {
      await logActivity(senderId, "message_sent", receiverId);
    } catch (logError) {
      console.error("Failed to log message activity:", logError);
    }

    return {
      success: true,
      data: messageData,
    };
  } catch (error) {
    console.error("Send message error:", error);
    return { success: false, error: "Failed to send message" };
  }
}

// Get messages with a user
export async function getMessages(
  otherUserId: number,
  limit: number = 50,
  offset: number = 0
): Promise<ActionResult<MessageData[]>> {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const { userId } = authResult;

    // Check subscription - free users cannot access messages
    const activeSub = await getActiveSubscription(userId);
    if (isFreeUser(activeSub)) {
      return {
        success: false,
        error: "Upgrade to a premium plan to view messages. Free users cannot access chat."
      };
    }

    if (await checkBlocked(userId, otherUserId)) {
      return { success: false, error: "Cannot view messages with this user" };
    }

    // Validate limit and offset
    const safeLimit = Math.min(Math.max(1, limit), 100);
    const safeOffset = Math.max(0, offset);

    // Get messages between the two users
    const messagesList = await db.query.messages.findMany({
      where: or(
        and(eq(messages.senderId, userId), eq(messages.receiverId, otherUserId)),
        and(eq(messages.senderId, otherUserId), eq(messages.receiverId, userId))
      ),
      orderBy: [asc(messages.createdAt)],
      limit: safeLimit,
      offset: safeOffset,
    });

    // First, mark undelivered messages as delivered
    const deliveredAt = new Date();
    await db
      .update(messages)
      .set({ status: "delivered", deliveredAt })
      .where(
        and(
          eq(messages.senderId, otherUserId),
          eq(messages.receiverId, userId),
          eq(messages.status, "sent")
        )
      );

    // Then, mark received messages as read
    const readAt = new Date();
    await db
      .update(messages)
      .set({ isRead: true, status: "read", readAt })
      .where(
        and(
          eq(messages.senderId, otherUserId),
          eq(messages.receiverId, userId),
          eq(messages.isRead, false)
        )
      )
      .returning({ id: messages.id });

    // Socket.io handles read receipts on the client
    // No server broadcasting needed

    return {
      success: true,
      data: messagesList.map((msg) => ({
        id: msg.id,
        senderId: msg.senderId,
        receiverId: msg.receiverId,
        content: msg.content,
        status: msg.status,
        isRead: msg.isRead,
        readAt: msg.readAt,
        deliveredAt: msg.deliveredAt,
        createdAt: msg.createdAt,
      })),
    };
  } catch (error) {
    console.error("Get messages error:", error);
    return { success: false, error: "Failed to fetch messages" };
  }
}

// Get all conversations
export async function getConversations(): Promise<ActionResult<Conversation[]>> {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const { userId } = authResult;

    // Get all conversations involving this user
    const convos = await db.query.conversations.findMany({
      where: or(
        eq(conversations.user1Id, userId),
        eq(conversations.user2Id, userId)
      ),
      orderBy: [desc(conversations.lastMessageAt)],
    });

    if (convos.length === 0) {
      return { success: true, data: [] };
    }

    // Collect all other user IDs and last message IDs for batch fetching
    const otherUserIds = new Set<number>();
    const lastMessageIds = new Set<number>();
    for (const convo of convos) {
      otherUserIds.add(convo.user1Id === userId ? convo.user2Id : convo.user1Id);
      if (convo.lastMessageId) lastMessageIds.add(convo.lastMessageId);
    }

    // Batch fetch all profiles
    const [profilesList, messagesList, unreadCounts] = await Promise.all([
      db.query.profiles.findMany({
        where: inArray(profiles.userId, [...otherUserIds]),
        with: {
          user: {
            columns: { id: true, isActive: true, lastActive: true },
          },
        },
      }),
      lastMessageIds.size > 0
        ? db.query.messages.findMany({
            where: inArray(messages.id, [...lastMessageIds]),
          })
        : Promise.resolve([]),
      // Batch unread count query
      db
        .select({
          senderId: messages.senderId,
          count: sql<number>`count(*)`,
        })
        .from(messages)
        .where(
          and(
            inArray(messages.senderId, [...otherUserIds]),
            eq(messages.receiverId, userId),
            eq(messages.isRead, false)
          )
        )
        .groupBy(messages.senderId),
    ]);

    const profileMap = new Map(profilesList.map(p => [p.userId, p]));
    const messageMap = new Map(messagesList.map(m => [m.id, m]));
    const unreadMap = new Map(unreadCounts.map(u => [u.senderId, Number(u.count)]));

    const formattedConversations: Conversation[] = [];

    for (const convo of convos) {
      const otherUserId = convo.user1Id === userId ? convo.user2Id : convo.user1Id;
      const otherProfile = profileMap.get(otherUserId);
      if (!otherProfile) continue;

      const lastMessage = convo.lastMessageId ? messageMap.get(convo.lastMessageId) : undefined;

      formattedConversations.push({
        id: convo.id,
        otherUser: {
          id: otherUserId,
          firstName: otherProfile.firstName,
          lastName: otherProfile.lastName,
          profileImage: otherProfile.profileImage,
          isOnline: otherProfile.user?.lastActive
            ? (Date.now() - new Date(otherProfile.user.lastActive).getTime()) < 5 * 60 * 1000
            : false,
        },
        lastMessage: lastMessage
          ? {
              content: lastMessage.content,
              createdAt: lastMessage.createdAt || new Date(),
              isRead: lastMessage.isRead || false,
            }
          : undefined,
        unreadCount: unreadMap.get(otherUserId) || 0,
      });
    }

    return { success: true, data: formattedConversations };
  } catch (error) {
    console.error("Get conversations error:", error);
    return { success: false, error: "Failed to fetch conversations" };
  }
}

// Get current user's subscription plan
export async function getMySubscriptionPlan(): Promise<ActionResult<string>> {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const { userId } = authResult;

    const activeSub = await getActiveSubscription(userId);
    return { success: true, data: activeSub ? (activeSub.plan || "free") : "free" };
  } catch (error) {
    console.error("Get subscription plan error:", error);
    return { success: false, error: "Failed to fetch subscription" };
  }
}

// Get current user ID
export async function getCurrentUserId(): Promise<ActionResult<number>> {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const { userId } = authResult;

    return { success: true, data: userId };
  } catch (error) {
    console.error("Get current user ID error:", error);
    return { success: false, error: "Failed to fetch user ID" };
  }
}

// Get unread message count
export async function getUnreadCount(): Promise<ActionResult<number>> {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const { userId } = authResult;

    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(
        and(
          eq(messages.receiverId, userId),
          eq(messages.isRead, false)
        )
      );

    return { success: true, data: Number(result[0]?.count || 0) };
  } catch (error) {
    console.error("Get unread count error:", error);
    return { success: false, error: "Failed to fetch unread count" };
  }
}

// Send message with photo attachment
export async function sendMessageWithPhoto(
  receiverId: number,
  content: string,
  photoUrl: string,
  fileName?: string,
  fileSize?: number
): Promise<ActionResult<MessageData>> {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const { userId } = authResult;

    // Validate content length
    if (content && content.trim().length > 2000) {
      return { success: false, error: "Message is too long (max 2000 characters)" };
    }

    // Validate file size (5MB max)
    if (fileSize && fileSize > 5 * 1024 * 1024) {
      return { success: false, error: "Image must be under 5MB" };
    }

    // Check subscription - free users cannot chat
    const activeSub = await getActiveSubscription(userId);
    if (isFreeUser(activeSub)) {
      return { success: false, error: "Upgrade to a premium plan to send messages." };
    }

    // Check if can message
    const canMsg = await canMessage(userId, receiverId);
    if (!canMsg) {
      return { success: false, error: "Cannot send message to this user" };
    }

    // Create message, attachment, and conversation atomically
    const message = await db.transaction(async (tx) => {
      const [newMsg] = await tx.insert(messages).values({
        senderId: userId,
        receiverId,
        content: content?.trim() || "📷 Photo",
        hasAttachment: true,
        status: "sent",
        createdAt: new Date(),
      }).returning();

      await tx.insert(messageAttachments).values({
        messageId: newMsg.id,
        attachmentUrl: photoUrl,
        attachmentType: "image",
        fileName,
        fileSize,
      });

      // Use getOrCreateConversation pattern with conflict handling
      const conversationId = await getOrCreateConversation(userId, receiverId);
      await tx
        .update(conversations)
        .set({ lastMessageId: newMsg.id, lastMessageAt: new Date() })
        .where(eq(conversations.id, conversationId));

      return newMsg;
    });

    // Get sender profile info for complete message data
    const senderProfile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, userId),
      columns: { firstName: true, lastName: true, profileImage: true },
    });

    const messageData: MessageData = {
      id: message.id,
      senderId: message.senderId,
      receiverId: message.receiverId,
      content: message.content,
      status: message.status,
      isRead: message.isRead,
      readAt: message.readAt,
      deliveredAt: message.deliveredAt,
      createdAt: message.createdAt,
      sender: senderProfile
        ? { firstName: senderProfile.firstName, lastName: senderProfile.lastName, profileImage: senderProfile.profileImage }
        : undefined,
    };

    return {
      success: true,
      data: messageData,
      message: "Photo sent!"
    };
  } catch (error) {
    console.error("Send message with photo error:", error);
    return { success: false, error: "Failed to send photo" };
  }
}

// Get message attachments
export async function getMessageAttachments(messageId: number): Promise<ActionResult<typeof messageAttachments.$inferSelect[]>> {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const { userId } = authResult;

    // Verify the user is a participant in the message
    const message = await db.query.messages.findFirst({
      where: eq(messages.id, messageId),
    });

    if (!message || (message.senderId !== userId && message.receiverId !== userId)) {
      return { success: false, error: "Message not found" };
    }

    // Check block status
    const otherUser = message.senderId === userId ? message.receiverId : message.senderId;
    if (await checkBlocked(userId, otherUser)) {
      return { success: false, error: "Message not found" };
    }

    const attachments = await db.query.messageAttachments.findMany({
      where: eq(messageAttachments.messageId, messageId),
    });
    return { success: true, data: attachments };
  } catch (error) {
    console.error("Get message attachments error:", error);
    return { success: false, error: "Failed to get attachments" };
  }
}

// Get basic user info for chat header (when user isn't in conversations list yet)
export async function getChatUserInfo(
  otherUserId: number
): Promise<ActionResult<{ id: number; firstName: string | null; lastName: string | null; profileImage: string | null; isOnline: boolean }>> {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;

    const profile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, otherUserId),
      with: {
        user: {
          columns: { id: true, lastActive: true },
        },
      },
    });

    if (!profile) return { success: false, error: "User not found" };

    return {
      success: true,
      data: {
        id: profile.userId,
        firstName: profile.firstName,
        lastName: profile.lastName,
        profileImage: profile.profileImage,
        isOnline: profile.user?.lastActive
          ? (Date.now() - new Date(profile.user.lastActive).getTime()) < 5 * 60 * 1000
          : false,
      },
    };
  } catch (error) {
    console.error("Get chat user info error:", error);
    return { success: false, error: "Failed to fetch user info" };
  }
}

// Update typing status (verifies user is a conversation participant)
export async function updateTypingStatus(
  otherUserId: number,
  isTyping: boolean
): Promise<ActionResult> {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const { userId } = authResult;

    // Verify conversation exists between users
    const [user1, user2] = userId < otherUserId ? [userId, otherUserId] : [otherUserId, userId];
    const conversation = await db.query.conversations.findFirst({
      where: and(
        eq(conversations.user1Id, user1),
        eq(conversations.user2Id, user2)
      ),
    });

    // Only update typing status if conversation exists (users can message)
    if (conversation && isTyping) {
      // Update or insert typing indicator in DB
      await db
        .insert(typingIndicators)
        .values({
          conversationId: conversation.id,
          userId,
          lastTypingAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [typingIndicators.conversationId, typingIndicators.userId],
          set: {
            lastTypingAt: new Date(),
          },
        });
    }

    // Socket.io handles typing status on the client
    // No server broadcasting needed

    return { success: true };
  } catch (error) {
    console.error("Update typing status error:", error);
    return { success: false, error: "Failed to update typing status" };
  }
}

// Get typing users in a conversation (verifies user is a participant)
export async function getTypingUsers(conversationId: number): Promise<ActionResult<number[]>> {
  try {
    const authResult = await requireAuth();
    if (authResult.error) return authResult.error;
    const { userId } = authResult;

    // Verify user is a participant in this conversation
    const conversation = await db.query.conversations.findFirst({
      where: and(
        eq(conversations.id, conversationId),
        or(
          eq(conversations.user1Id, userId),
          eq(conversations.user2Id, userId)
        )
      ),
    });
    if (!conversation) return { success: false, error: "Not a participant" };

    const fiveSecondsAgo = new Date(Date.now() - 5000);

    const typing = await db.query.typingIndicators.findMany({
      where: and(
        eq(typingIndicators.conversationId, conversationId),
        gt(typingIndicators.lastTypingAt, fiveSecondsAgo),
        ne(typingIndicators.userId, userId) // Exclude self
      ),
    });

    return { success: true, data: typing.map(t => t.userId) };
  } catch (error) {
    console.error("Get typing users error:", error);
    return { success: false, error: "Failed to get typing users" };
  }
}
