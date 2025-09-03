import database from "@react-native-firebase/database";
import firestore from "@react-native-firebase/firestore";

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  type: "text" | "image" | "booking_request" | "system";
  timestamp: number;
  read: boolean;
  metadata?: {
    bookingId?: string;
    imageUrl?: string;
    priceQuote?: number;
    appointmentDate?: string;
  };
}

export interface ChatRoom {
  id: string;
  participants: string[];
  lastMessage?: ChatMessage;
  lastMessageTime: number;
  unreadCount: { [userId: string]: number };
  createdAt: number;
  metadata?: {
    artistName: string;
    customerName: string;
    context: "matching" | "direct_inquiry" | "booking";
    tattooStyle?: string;
    estimatedPrice?: number;
  };
}

export interface TypingStatus {
  userId: string;
  isTyping: boolean;
  timestamp: number;
}

export class ChatService {
  private static instance: ChatService;
  private activeListeners: { [key: string]: () => void } = {};
  private typingTimeouts: { [key: string]: NodeJS.Timeout } = {};

  private constructor() {}

  public static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  /**
   * チャットルームを作成または取得
   */
  async getOrCreateChatRoom(
    customerId: string,
    artistId: string,
    context: "matching" | "direct_inquiry" | "booking" = "direct_inquiry",
  ): Promise<string> {
    try {
      const participants = [customerId, artistId].sort();
      const roomId = participants.join("_");

      // 既存のルームをチェック
      const roomSnapshot = await database()
        .ref(`chatRooms/${roomId}`)
        .once("value");

      if (!roomSnapshot.exists()) {
        // 参加者の情報を取得
        const [customerDoc, artistDoc] = await Promise.all([
          firestore().collection("users").doc(customerId).get(),
          firestore().collection("users").doc(artistId).get(),
        ]);

        const customerData = customerDoc.data();
        const artistData = artistDoc.data();

        // 新しいルームを作成
        const chatRoom: ChatRoom = {
          id: roomId,
          participants,
          lastMessageTime: Date.now(),
          unreadCount: {
            [customerId]: 0,
            [artistId]: 0,
          },
          createdAt: Date.now(),
          metadata: {
            artistName: `${artistData?.profile?.firstName} ${artistData?.profile?.lastName}`,
            customerName: `${customerData?.profile?.firstName} ${customerData?.profile?.lastName}`,
            context,
          },
        };

        await database().ref(`chatRooms/${roomId}`).set(chatRoom);

        // システムメッセージを送信
        await this.sendSystemMessage(
          roomId,
          "チャットを開始しました。ご質問やご相談をお気軽にどうぞ！",
        );
      }

      return roomId;
    } catch (error) {
      console.error("Error creating/getting chat room:", error);
      throw error;
    }
  }

  /**
   * メッセージを送信
   */
  async sendMessage(
    roomId: string,
    senderId: string,
    text: string,
    type: ChatMessage["type"] = "text",
    metadata?: ChatMessage["metadata"],
  ): Promise<void> {
    try {
      const messageId = database().ref().push().key!;
      const timestamp = Date.now();

      const message: ChatMessage = {
        id: messageId,
        senderId,
        receiverId: "", // 後で設定
        text,
        type,
        timestamp,
        read: false,
        metadata,
      };

      // チャットルーム情報を取得して受信者を特定
      const roomSnapshot = await database()
        .ref(`chatRooms/${roomId}`)
        .once("value");

      const room = roomSnapshot.val() as ChatRoom;
      const receiverId = room.participants.find((id) => id !== senderId)!;
      message.receiverId = receiverId;

      // メッセージを保存
      await database().ref(`messages/${roomId}/${messageId}`).set(message);

      // チャットルームの最新メッセージと未読数を更新
      const updates: any = {};
      updates[`chatRooms/${roomId}/lastMessage`] = message;
      updates[`chatRooms/${roomId}/lastMessageTime`] = timestamp;
      updates[`chatRooms/${roomId}/unreadCount/${receiverId}`] =
        (room.unreadCount[receiverId] || 0) + 1;

      await database().ref().update(updates);

      // プッシュ通知を送信（実装は後で）
      // await this.sendPushNotification(receiverId, message);
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  }

  /**
   * システムメッセージを送信
   */
  async sendSystemMessage(roomId: string, text: string): Promise<void> {
    const messageId = database().ref().push().key!;
    const timestamp = Date.now();

    const message: ChatMessage = {
      id: messageId,
      senderId: "system",
      receiverId: "",
      text,
      type: "system",
      timestamp,
      read: false,
    };

    await database().ref(`messages/${roomId}/${messageId}`).set(message);
  }

  /**
   * 予約リクエストメッセージを送信
   */
  async sendBookingRequest(
    roomId: string,
    customerId: string,
    appointmentDate: string,
    estimatedPrice: number,
    tattooDescription: string,
  ): Promise<void> {
    const text = `予約リクエスト: ${appointmentDate}\n料金見積もり: ¥${estimatedPrice.toLocaleString()}\n内容: ${tattooDescription}`;

    await this.sendMessage(roomId, customerId, text, "booking_request", {
      appointmentDate,
      priceQuote: estimatedPrice,
    });
  }

  /**
   * メッセージのリアルタイムリスニングを開始
   */
  subscribeToMessages(
    roomId: string,
    onMessage: (message: ChatMessage) => void,
    onError: (error: Error) => void,
  ): () => void {
    const listenerKey = `messages_${roomId}`;

    const reference = database()
      .ref(`messages/${roomId}`)
      .orderByChild("timestamp");

    const listener = reference.on(
      "child_added",
      (snapshot) => {
        const message = snapshot.val() as ChatMessage;
        if (message) {
          onMessage(message);
        }
      },
      (error) => {
        onError(new Error(error.message));
      },
    );

    // クリーンアップ関数を返す
    const unsubscribe = () => {
      reference.off("child_added", listener);
      delete this.activeListeners[listenerKey];
    };

    this.activeListeners[listenerKey] = unsubscribe;
    return unsubscribe;
  }

  /**
   * チャットルームリストのリアルタイムリスニング
   */
  subscribeToUserChatRooms(
    userId: string,
    onRoomUpdate: (rooms: ChatRoom[]) => void,
    onError: (error: Error) => void,
  ): () => void {
    const listenerKey = `rooms_${userId}`;

    const reference = database()
      .ref("chatRooms")
      .orderByChild("lastMessageTime");

    const listener = reference.on(
      "value",
      (snapshot) => {
        const rooms: ChatRoom[] = [];

        if (snapshot.exists()) {
          const roomsData = snapshot.val();

          Object.keys(roomsData).forEach((roomId) => {
            const room = roomsData[roomId] as ChatRoom;
            if (room.participants.includes(userId)) {
              rooms.push(room);
            }
          });
        }

        // 最新メッセージ順でソート
        rooms.sort((a, b) => b.lastMessageTime - a.lastMessageTime);

        onRoomUpdate(rooms);
      },
      (error) => {
        onError(new Error(error.message));
      },
    );

    const unsubscribe = () => {
      reference.off("value", listener);
      delete this.activeListeners[listenerKey];
    };

    this.activeListeners[listenerKey] = unsubscribe;
    return unsubscribe;
  }

  /**
   * メッセージを既読にする
   */
  async markMessagesAsRead(roomId: string, userId: string): Promise<void> {
    try {
      // 該当ユーザーの未読メッセージを取得
      const messagesSnapshot = await database()
        .ref(`messages/${roomId}`)
        .orderByChild("receiverId")
        .equalTo(userId)
        .once("value");

      if (messagesSnapshot.exists()) {
        const updates: any = {};
        const messages = messagesSnapshot.val();

        Object.keys(messages).forEach((messageId) => {
          const message = messages[messageId] as ChatMessage;
          if (!message.read) {
            updates[`messages/${roomId}/${messageId}/read`] = true;
          }
        });

        // 未読数をリセット
        updates[`chatRooms/${roomId}/unreadCount/${userId}`] = 0;

        if (Object.keys(updates).length > 0) {
          await database().ref().update(updates);
        }
      }
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  }

  /**
   * タイピング状態を設定
   */
  async setTypingStatus(
    roomId: string,
    userId: string,
    isTyping: boolean,
  ): Promise<void> {
    try {
      const typingStatus: TypingStatus = {
        userId,
        isTyping,
        timestamp: Date.now(),
      };

      await database().ref(`typing/${roomId}/${userId}`).set(typingStatus);

      // 自動的にタイピング状態をクリアする
      if (isTyping) {
        if (this.typingTimeouts[`${roomId}_${userId}`]) {
          clearTimeout(this.typingTimeouts[`${roomId}_${userId}`]);
        }

        this.typingTimeouts[`${roomId}_${userId}`] = setTimeout(() => {
          this.setTypingStatus(roomId, userId, false);
        }, 3000);
      }
    } catch (error) {
      console.error("Error setting typing status:", error);
    }
  }

  /**
   * タイピング状態のリスニング
   */
  subscribeToTypingStatus(
    roomId: string,
    currentUserId: string,
    onTypingChange: (isTyping: boolean, userId: string) => void,
  ): () => void {
    const listenerKey = `typing_${roomId}`;

    const reference = database().ref(`typing/${roomId}`);

    const listener = reference.on("value", (snapshot) => {
      if (snapshot.exists()) {
        const typingData = snapshot.val();

        Object.keys(typingData).forEach((userId) => {
          if (userId !== currentUserId) {
            const status = typingData[userId] as TypingStatus;
            const isRecent = Date.now() - status.timestamp < 5000;
            onTypingChange(status.isTyping && isRecent, userId);
          }
        });
      }
    });

    const unsubscribe = () => {
      reference.off("value", listener);
      delete this.activeListeners[listenerKey];
    };

    this.activeListeners[listenerKey] = unsubscribe;
    return unsubscribe;
  }

  /**
   * メッセージ履歴を取得
   */
  async getMessageHistory(
    roomId: string,
    limit: number = 50,
    before?: number,
  ): Promise<ChatMessage[]> {
    try {
      let query = database()
        .ref(`messages/${roomId}`)
        .orderByChild("timestamp")
        .limitToLast(limit);

      if (before) {
        query = query.endAt(before - 1);
      }

      const snapshot = await query.once("value");
      const messages: ChatMessage[] = [];

      if (snapshot.exists()) {
        const messagesData = snapshot.val();
        Object.keys(messagesData).forEach((messageId) => {
          messages.push(messagesData[messageId]);
        });
      }

      return messages.sort((a, b) => a.timestamp - b.timestamp);
    } catch (error) {
      console.error("Error getting message history:", error);
      return [];
    }
  }

  /**
   * 未読メッセージ数を取得
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const roomsSnapshot = await database().ref("chatRooms").once("value");

      let totalUnreadCount = 0;

      if (roomsSnapshot.exists()) {
        const roomsData = roomsSnapshot.val();

        Object.keys(roomsData).forEach((roomId) => {
          const room = roomsData[roomId] as ChatRoom;
          if (room.participants.includes(userId)) {
            totalUnreadCount += room.unreadCount[userId] || 0;
          }
        });
      }

      return totalUnreadCount;
    } catch (error) {
      console.error("Error getting unread count:", error);
      return 0;
    }
  }

  /**
   * チャットルームを削除
   */
  async deleteChatRoom(roomId: string): Promise<void> {
    try {
      const updates: any = {};
      updates[`chatRooms/${roomId}`] = null;
      updates[`messages/${roomId}`] = null;
      updates[`typing/${roomId}`] = null;

      await database().ref().update(updates);
    } catch (error) {
      console.error("Error deleting chat room:", error);
      throw error;
    }
  }

  /**
   * すべてのリスナーをクリーンアップ
   */
  cleanupAllListeners(): void {
    Object.values(this.activeListeners).forEach((unsubscribe) => {
      unsubscribe();
    });
    this.activeListeners = {};

    // タイピングタイムアウトもクリア
    Object.values(this.typingTimeouts).forEach((timeout) => {
      clearTimeout(timeout);
    });
    this.typingTimeouts = {};
  }

  /**
   * オンライン状態を設定
   */
  async setUserOnlineStatus(userId: string, isOnline: boolean): Promise<void> {
    try {
      const status = {
        isOnline,
        lastSeen: Date.now(),
      };

      await database().ref(`presence/${userId}`).set(status);

      // アプリが閉じられた時に自動的にオフラインにする
      if (isOnline) {
        await database().ref(`presence/${userId}`).onDisconnect().set({
          isOnline: false,
          lastSeen: Date.now(),
        });
      }
    } catch (error) {
      console.error("Error setting online status:", error);
    }
  }

  /**
   * ユーザーのオンライン状態を監視
   */
  subscribeToUserPresence(
    userId: string,
    onPresenceChange: (isOnline: boolean, lastSeen: number) => void,
  ): () => void {
    const listenerKey = `presence_${userId}`;

    const reference = database().ref(`presence/${userId}`);

    const listener = reference.on("value", (snapshot) => {
      if (snapshot.exists()) {
        const presence = snapshot.val();
        onPresenceChange(presence.isOnline, presence.lastSeen);
      } else {
        onPresenceChange(false, 0);
      }
    });

    const unsubscribe = () => {
      reference.off("value", listener);
      delete this.activeListeners[listenerKey];
    };

    this.activeListeners[listenerKey] = unsubscribe;
    return unsubscribe;
  }
}

export default ChatService.getInstance();
