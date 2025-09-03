import firestore from "@react-native-firebase/firestore";
import ChatService from "./ChatService";
import { User } from "../types";

export interface BookingRequest {
  id: string;
  customerId: string;
  artistId: string;
  tattooDescription: string;
  preferredSize: "small" | "medium" | "large";
  bodyLocation: string;
  preferredDate: Date;
  alternativeDates: Date[];
  estimatedDuration: number; // minutes
  estimatedPrice: number;
  budgetRange: {
    min: number;
    max: number;
  };
  hasAllergies: boolean;
  allergyDetails?: string;
  additionalNotes?: string;
  status:
    | "pending"
    | "accepted"
    | "declined"
    | "negotiating"
    | "confirmed"
    | "completed"
    | "cancelled";
  createdAt: Date;
  updatedAt: Date;
  responses: BookingResponse[];
}

export interface BookingResponse {
  id: string;
  responderId: string;
  responseType: "counter_offer" | "accept" | "decline" | "request_info";
  proposedDate?: Date;
  proposedPrice?: number;
  proposedDuration?: number;
  message: string;
  createdAt: Date;
}

export interface TimeSlot {
  startTime: Date;
  endTime: Date;
  isAvailable: boolean;
  isBooked: boolean;
  bookingId?: string;
}

export interface ArtistSchedule {
  artistId: string;
  date: Date;
  timeSlots: TimeSlot[];
  specialNote?: string;
  isHoliday: boolean;
}

export class BookingService {
  private static instance: BookingService;

  private constructor() {}

  public static getInstance(): BookingService {
    if (!BookingService.instance) {
      BookingService.instance = new BookingService();
    }
    return BookingService.instance;
  }

  /**
   * 予約リクエストを作成
   */
  async createBookingRequest(
    customerId: string,
    artistId: string,
    requestData: Omit<
      BookingRequest,
      | "id"
      | "customerId"
      | "artistId"
      | "status"
      | "createdAt"
      | "updatedAt"
      | "responses"
    >,
  ): Promise<string> {
    try {
      const bookingRequest: Omit<BookingRequest, "id"> = {
        customerId,
        artistId,
        ...requestData,
        status: "pending",
        createdAt: new Date(),
        updatedAt: new Date(),
        responses: [],
      };

      const docRef = await firestore()
        .collection("bookingRequests")
        .add(bookingRequest);

      // チャットルームを作成して予約メッセージを送信
      const roomId = await ChatService.getOrCreateChatRoom(
        customerId,
        artistId,
        "booking",
      );

      // 予約リクエストメッセージを送信
      await this.sendBookingRequestMessage(
        roomId,
        customerId,
        docRef.id,
        requestData,
      );

      return docRef.id;
    } catch (error) {
      console.error("Error creating booking request:", error);
      throw error;
    }
  }

  /**
   * 予約リクエストに対する応答
   */
  async respondToBookingRequest(
    bookingId: string,
    responderId: string,
    response: Omit<BookingResponse, "id" | "responderId" | "createdAt">,
  ): Promise<void> {
    try {
      const responseWithId: Omit<BookingResponse, "id"> = {
        responderId,
        ...response,
        createdAt: new Date(),
      };

      const bookingDoc = await firestore()
        .collection("bookingRequests")
        .doc(bookingId)
        .get();

      if (!bookingDoc.exists) {
        throw new Error("Booking request not found");
      }

      const bookingData = bookingDoc.data() as BookingRequest;

      // レスポンスを追加
      await firestore()
        .collection("bookingRequests")
        .doc(bookingId)
        .update({
          responses: firestore.FieldValue.arrayUnion(responseWithId),
          status: this.determineBookingStatus(
            response.responseType,
            bookingData.status,
          ),
          updatedAt: new Date(),
        });

      // チャットにメッセージを送信
      const roomId = await ChatService.getOrCreateChatRoom(
        bookingData.customerId,
        bookingData.artistId,
        "booking",
      );

      await this.sendBookingResponseMessage(roomId, responderId, response);
    } catch (error) {
      console.error("Error responding to booking request:", error);
      throw error;
    }
  }

  /**
   * アーティストのスケジュールを取得
   */
  async getArtistSchedule(
    artistId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ArtistSchedule[]> {
    try {
      const scheduleSnapshot = await firestore()
        .collection("artistSchedules")
        .where("artistId", "==", artistId)
        .where("date", ">=", startDate)
        .where("date", "<=", endDate)
        .orderBy("date")
        .get();

      const schedules: ArtistSchedule[] = [];

      scheduleSnapshot.forEach((doc) => {
        const data = doc.data();
        schedules.push({
          ...data,
          date: data.date.toDate(),
          timeSlots: data.timeSlots.map((slot: any) => ({
            ...slot,
            startTime: slot.startTime.toDate(),
            endTime: slot.endTime.toDate(),
          })),
        } as ArtistSchedule);
      });

      return schedules;
    } catch (error) {
      console.error("Error getting artist schedule:", error);
      return [];
    }
  }

  /**
   * 利用可能な時間枠を検索
   */
  async findAvailableSlots(
    artistId: string,
    preferredDate: Date,
    duration: number,
    alternativeDates: Date[] = [],
  ): Promise<{ date: Date; slots: TimeSlot[] }[]> {
    try {
      const datesToCheck = [preferredDate, ...alternativeDates];
      const availableSlots: { date: Date; slots: TimeSlot[] }[] = [];

      for (const date of datesToCheck) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const schedules = await this.getArtistSchedule(
          artistId,
          startOfDay,
          endOfDay,
        );

        if (schedules.length > 0) {
          const daySchedule = schedules[0];
          const availableSlotsForDay = daySchedule.timeSlots.filter(
            (slot) =>
              slot.isAvailable &&
              !slot.isBooked &&
              this.getSlotDuration(slot) >= duration,
          );

          if (availableSlotsForDay.length > 0) {
            availableSlots.push({
              date: daySchedule.date,
              slots: availableSlotsForDay,
            });
          }
        }
      }

      return availableSlots;
    } catch (error) {
      console.error("Error finding available slots:", error);
      return [];
    }
  }

  /**
   * 予約を確定
   */
  async confirmBooking(
    bookingId: string,
    confirmedDate: Date,
    confirmedPrice: number,
    confirmedDuration: number,
  ): Promise<void> {
    try {
      const bookingDoc = await firestore()
        .collection("bookingRequests")
        .doc(bookingId)
        .get();

      if (!bookingDoc.exists) {
        throw new Error("Booking request not found");
      }

      const bookingData = bookingDoc.data() as BookingRequest;

      // 予約ステータスを更新
      await firestore().collection("bookingRequests").doc(bookingId).update({
        status: "confirmed",
        confirmedDate,
        confirmedPrice,
        confirmedDuration,
        updatedAt: new Date(),
      });

      // アーティストのスケジュールを更新（時間枠を予約済みにする）
      await this.blockTimeSlot(
        bookingData.artistId,
        confirmedDate,
        confirmedDuration,
        bookingId,
      );

      // 確認済み予約を作成
      await firestore().collection("confirmedBookings").add({
        bookingRequestId: bookingId,
        customerId: bookingData.customerId,
        artistId: bookingData.artistId,
        appointmentDate: confirmedDate,
        duration: confirmedDuration,
        price: confirmedPrice,
        tattooDescription: bookingData.tattooDescription,
        bodyLocation: bookingData.bodyLocation,
        status: "scheduled",
        createdAt: new Date(),
      });

      // チャットに確定メッセージを送信
      const roomId = await ChatService.getOrCreateChatRoom(
        bookingData.customerId,
        bookingData.artistId,
        "booking",
      );

      await ChatService.sendSystemMessage(
        roomId,
        `🎉 予約が確定しました！\n` +
          `📅 日時: ${confirmedDate.toLocaleString("ja-JP")}\n` +
          `⏰ 所要時間: ${confirmedDuration}分\n` +
          `💰 料金: ¥${confirmedPrice.toLocaleString()}`,
      );
    } catch (error) {
      console.error("Error confirming booking:", error);
      throw error;
    }
  }

  /**
   * ユーザーの予約履歴を取得
   */
  async getUserBookings(
    userId: string,
    userType: "customer" | "artist",
  ): Promise<BookingRequest[]> {
    try {
      const field = userType === "customer" ? "customerId" : "artistId";

      const bookingsSnapshot = await firestore()
        .collection("bookingRequests")
        .where(field, "==", userId)
        .orderBy("createdAt", "desc")
        .get();

      const bookings: BookingRequest[] = [];

      bookingsSnapshot.forEach((doc) => {
        const data = doc.data();
        bookings.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
          preferredDate: data.preferredDate.toDate(),
          alternativeDates: data.alternativeDates.map((date: any) =>
            date.toDate(),
          ),
          responses: data.responses.map((response: any) => ({
            ...response,
            createdAt: response.createdAt.toDate(),
            proposedDate: response.proposedDate
              ? response.proposedDate.toDate()
              : undefined,
          })),
        } as BookingRequest);
      });

      return bookings;
    } catch (error) {
      console.error("Error getting user bookings:", error);
      return [];
    }
  }

  /**
   * 予約をキャンセル
   */
  async cancelBooking(
    bookingId: string,
    cancelledBy: string,
    reason: string,
  ): Promise<void> {
    try {
      const bookingDoc = await firestore()
        .collection("bookingRequests")
        .doc(bookingId)
        .get();

      if (!bookingDoc.exists) {
        throw new Error("Booking request not found");
      }

      const bookingData = bookingDoc.data() as BookingRequest;

      await firestore().collection("bookingRequests").doc(bookingId).update({
        status: "cancelled",
        cancelledBy,
        cancellationReason: reason,
        updatedAt: new Date(),
      });

      // 確定済み予約の場合、時間枠を解放
      if (bookingData.status === "confirmed") {
        await this.releaseTimeSlot(bookingData.artistId, bookingId);
      }

      // チャットにキャンセルメッセージを送信
      const roomId = await ChatService.getOrCreateChatRoom(
        bookingData.customerId,
        bookingData.artistId,
        "booking",
      );

      await ChatService.sendSystemMessage(
        roomId,
        `❌ 予約がキャンセルされました\n理由: ${reason}`,
      );
    } catch (error) {
      console.error("Error cancelling booking:", error);
      throw error;
    }
  }

  /**
   * 代替案の詳細情報を保存
   */
  async saveCounterOfferDetails(
    bookingId: string,
    details: {
      alternativeDates: Date[];
      priceReason: string;
      scheduleNotes: string;
    },
  ): Promise<void> {
    try {
      await firestore().collection("counterOfferDetails").add({
        bookingId,
        alternativeDates: details.alternativeDates,
        priceReason: details.priceReason,
        scheduleNotes: details.scheduleNotes,
        createdAt: new Date(),
      });
    } catch (error) {
      console.error("Error saving counter offer details:", error);
      throw error;
    }
  }

  // プライベートメソッド

  private async sendBookingRequestMessage(
    roomId: string,
    customerId: string,
    bookingId: string,
    requestData: any,
  ): Promise<void> {
    const message =
      `📅 新しい予約リクエスト\n\n` +
      `🎨 内容: ${requestData.tattooDescription}\n` +
      `📏 サイズ: ${this.getSizeLabel(requestData.preferredSize)}\n` +
      `📍 部位: ${requestData.bodyLocation}\n` +
      `📅 希望日: ${requestData.preferredDate.toLocaleString("ja-JP")}\n` +
      `⏰ 予想時間: ${requestData.estimatedDuration}分\n` +
      `💰 予算: ¥${requestData.budgetRange.min.toLocaleString()} - ¥${requestData.budgetRange.max.toLocaleString()}\n` +
      (requestData.hasAllergies
        ? `⚠️ アレルギー: ${requestData.allergyDetails}\n`
        : "") +
      (requestData.additionalNotes
        ? `📝 備考: ${requestData.additionalNotes}\n`
        : "") +
      `\n予約ID: ${bookingId}`;

    await ChatService.sendMessage(
      roomId,
      customerId,
      message,
      "booking_request",
      { bookingId },
    );
  }

  private async sendBookingResponseMessage(
    roomId: string,
    responderId: string,
    response: Omit<BookingResponse, "id" | "responderId" | "createdAt">,
  ): Promise<void> {
    let message = "";

    switch (response.responseType) {
      case "accept":
        message = `✅ 予約リクエストを承認しました\n${response.message}`;
        break;
      case "decline":
        message = `❌ 予約リクエストをお断りしました\n理由: ${response.message}`;
        break;
      case "counter_offer":
        message = `🔄 代替案を提案します\n\n`;
        if (response.proposedDate) {
          message += `📅 提案日時: ${response.proposedDate.toLocaleString("ja-JP")}\n`;
        }
        if (response.proposedPrice) {
          message += `💰 提案料金: ¥${response.proposedPrice.toLocaleString()}\n`;
        }
        if (response.proposedDuration) {
          message += `⏰ 予想時間: ${response.proposedDuration}分\n`;
        }
        message += `\n${response.message}`;
        break;
      case "request_info":
        message = `❓ 追加情報が必要です\n\n${response.message}`;
        break;
    }

    await ChatService.sendMessage(roomId, responderId, message);
  }

  private determineBookingStatus(
    responseType: BookingResponse["responseType"],
    currentStatus: BookingRequest["status"],
  ): BookingRequest["status"] {
    switch (responseType) {
      case "accept":
        return "accepted";
      case "decline":
        return "declined";
      case "counter_offer":
        return "negotiating";
      case "request_info":
        return "negotiating";
      default:
        return currentStatus;
    }
  }

  private getSlotDuration(slot: TimeSlot): number {
    return (slot.endTime.getTime() - slot.startTime.getTime()) / (1000 * 60); // minutes
  }

  private getSizeLabel(size: "small" | "medium" | "large"): string {
    const labels = {
      small: "小サイズ (5cm以下)",
      medium: "中サイズ (5-15cm)",
      large: "大サイズ (15cm以上)",
    };
    return labels[size];
  }

  private async blockTimeSlot(
    artistId: string,
    date: Date,
    duration: number,
    bookingId: string,
  ): Promise<void> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const schedules = await this.getArtistSchedule(
        artistId,
        startOfDay,
        endOfDay,
      );

      if (schedules.length > 0) {
        const schedule = schedules[0];
        const updatedSlots = schedule.timeSlots.map((slot) => {
          const slotStart = slot.startTime.getTime();
          const slotEnd = slot.endTime.getTime();
          const bookingStart = date.getTime();
          const bookingEnd = bookingStart + duration * 60 * 1000;

          // 重複チェック
          if (slotStart < bookingEnd && slotEnd > bookingStart) {
            return {
              ...slot,
              isBooked: true,
              bookingId,
            };
          }
          return slot;
        });

        await firestore()
          .collection("artistSchedules")
          .where("artistId", "==", artistId)
          .where("date", ">=", startOfDay)
          .where("date", "<=", endOfDay)
          .get()
          .then((snapshot) => {
            if (!snapshot.empty) {
              const doc = snapshot.docs[0];
              return doc.ref.update({ timeSlots: updatedSlots });
            }
          });
      }
    } catch (error) {
      console.error("Error blocking time slot:", error);
    }
  }

  /**
   * 予約を完了状態にする
   */
  async completeBooking(bookingId: string, completedBy: string): Promise<void> {
    try {
      const bookingDoc = await firestore()
        .collection("bookingRequests")
        .doc(bookingId)
        .get();

      if (!bookingDoc.exists) {
        throw new Error("Booking request not found");
      }

      const bookingData = bookingDoc.data() as BookingRequest;

      if (bookingData.status !== "confirmed") {
        throw new Error("Only confirmed bookings can be completed");
      }

      // 予約を完了状態に更新
      await firestore().collection("bookingRequests").doc(bookingId).update({
        status: "completed",
        completedBy,
        completedAt: new Date(),
        updatedAt: new Date(),
      });

      // 確定済み予約コレクションも更新
      const confirmedBookingSnapshot = await firestore()
        .collection("confirmedBookings")
        .where("bookingRequestId", "==", bookingId)
        .get();

      if (!confirmedBookingSnapshot.empty) {
        await confirmedBookingSnapshot.docs[0].ref.update({
          status: "completed",
          completedAt: new Date(),
          updatedAt: new Date(),
        });
      }

      // チャットに完了メッセージを送信
      const roomId = await ChatService.getOrCreateChatRoom(
        bookingData.customerId,
        bookingData.artistId,
        "booking",
      );

      await ChatService.sendSystemMessage(
        roomId,
        `✅ 施術が完了しました！\n` +
          `お疲れ様でした。レビューの投稿をお願いします。`,
      );

      // アーティストスコアの自動更新をトリガー
      try {
        const ArtistScoreService = (await import("./ArtistScoreService"))
          .default;
        await ArtistScoreService.onBookingCompleted(bookingData.artistId);
      } catch (error) {
        console.error("Error triggering artist score update:", error);
        // スコア更新エラーは致命的でないため、処理を続行
      }
    } catch (error) {
      console.error("Error completing booking:", error);
      throw error;
    }
  }

  private async releaseTimeSlot(
    artistId: string,
    bookingId: string,
  ): Promise<void> {
    try {
      const schedulesSnapshot = await firestore()
        .collection("artistSchedules")
        .where("artistId", "==", artistId)
        .get();

      for (const doc of schedulesSnapshot.docs) {
        const schedule = doc.data() as ArtistSchedule;
        const updatedSlots = schedule.timeSlots.map((slot) => {
          if (slot.bookingId === bookingId) {
            return {
              ...slot,
              isBooked: false,
              bookingId: undefined,
            };
          }
          return slot;
        });

        await doc.ref.update({ timeSlots: updatedSlots });
      }
    } catch (error) {
      console.error("Error releasing time slot:", error);
    }
  }
}

export default BookingService.getInstance();
