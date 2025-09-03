import { useState, useCallback, useEffect } from "react";
import { Alert } from "react-native";
import BookingService, {
  BookingRequest,
  BookingResponse,
} from "../services/BookingService";
import { useNotificationsMock } from "./useNotificationsMock";

type BookingState =
  | "idle"
  | "requested"
  | "pending"
  | "confirmed"
  | "completed"
  | "cancelled";
type ReviewState = "locked" | "unlocked" | "submitted";
type LegalConsentState = "notAgreed" | "agreed";

interface BookingMachineState {
  bookingState: BookingState;
  reviewState: ReviewState;
  legalConsentState: LegalConsentState;
  currentBookingId?: string;
  error?: string;
  isLoading: boolean;
  visitedStudio: boolean;
}

interface LegalConsent {
  version: string;
  timestamp: Date;
  agreementText: string;
}

interface BookingTransitionReason {
  fromState: BookingState;
  toState: BookingState;
  reason: string;
  timestamp: Date;
  bookingId?: string;
}

export interface UseBookingMachine {
  state: BookingMachineState;
  actions: {
    // Booking transitions
    createBookingRequest: (
      customerId: string,
      artistId: string,
      requestData: any,
    ) => Promise<void>;
    acceptBooking: (bookingId: string) => Promise<void>;
    confirmBooking: (
      bookingId: string,
      details: {
        confirmedDate: Date;
        confirmedPrice: number;
        confirmedDuration: number;
      },
    ) => Promise<void>;
    cancelBooking: (bookingId: string, reason: string) => Promise<void>;
    completeBooking: (bookingId: string) => Promise<void>;

    // Review transitions
    markStudioVisited: () => void;
    unlockReview: () => void;
    submitReview: (reviewData: any) => Promise<void>;

    // Legal consent
    agreeLegalTerms: (version: string, agreementText: string) => void;

    // State queries
    canCreateBooking: () => boolean;
    canConfirmBooking: () => boolean;
    canWriteReview: () => boolean;

    // History
    getTransitionHistory: () => BookingTransitionReason[];

    // Reset
    reset: () => void;
  };
  competitorHandling: {
    handleConcurrentBooking: (
      bookingId: string,
      competitorBookingId: string,
    ) => Promise<void>;
    suggestAlternativeSlots: (
      artistId: string,
      originalDate: Date,
    ) => Promise<Date[]>;
  };
}

export const useBookingMachine = (
  initialBookingId?: string,
): UseBookingMachine => {
  const { showNotification } = useNotificationsMock();

  const [state, setState] = useState<BookingMachineState>({
    bookingState: "idle",
    reviewState: "locked",
    legalConsentState: "notAgreed",
    currentBookingId: initialBookingId,
    isLoading: false,
    visitedStudio: false,
  });

  const [transitionHistory, setTransitionHistory] = useState<
    BookingTransitionReason[]
  >([]);
  const [legalConsent, setLegalConsent] = useState<LegalConsent | null>(null);

  // Load saved states on mount
  useEffect(() => {
    const loadSavedStates = async () => {
      try {
        // In real implementation, load from AsyncStorage
        // For now, we'll keep it in memory
      } catch (error) {
        console.error("Failed to load saved booking states:", error);
      }
    };
    loadSavedStates();
  }, []);

  const addTransition = useCallback(
    (
      fromState: BookingState,
      toState: BookingState,
      reason: string,
      bookingId?: string,
    ) => {
      const transition: BookingTransitionReason = {
        fromState,
        toState,
        reason,
        timestamp: new Date(),
        bookingId,
      };

      setTransitionHistory((prev) => [...prev, transition]);
      console.log("📝 Booking State Transition:", transition);
    },
    [],
  );

  const updateBookingState = useCallback(
    (
      newState: BookingState,
      reason: string,
      bookingId?: string,
      additionalUpdates?: Partial<BookingMachineState>,
    ) => {
      setState((prevState) => {
        addTransition(prevState.bookingState, newState, reason, bookingId);

        return {
          ...prevState,
          bookingState: newState,
          currentBookingId: bookingId || prevState.currentBookingId,
          error: undefined,
          ...additionalUpdates,
        };
      });
    },
    [addTransition],
  );

  // Booking State Transitions
  const createBookingRequest = useCallback(
    async (customerId: string, artistId: string, requestData: any) => {
      if (state.bookingState !== "idle") {
        throw new Error(
          `Cannot create booking from state: ${state.bookingState}`,
        );
      }

      setState((prev) => ({ ...prev, isLoading: true }));

      try {
        const bookingId = await BookingService.createBookingRequest(
          customerId,
          artistId,
          requestData,
        );

        updateBookingState("requested", "予約リクエストを作成", bookingId, {
          isLoading: false,
        });

        showNotification({
          type: "success",
          title: "予約リクエスト送信完了",
          message: "アーティストからの返答をお待ちください",
        });

        // Auto-transition to pending after request is sent
        setTimeout(() => {
          updateBookingState("pending", "予約承認待ち状態に移行", bookingId);
        }, 1000);
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: `予約作成に失敗しました: ${error}`,
        }));

        showNotification({
          type: "error",
          title: "予約作成エラー",
          message: "もう一度お試しください",
        });

        throw error;
      }
    },
    [state.bookingState, updateBookingState, showNotification],
  );

  const acceptBooking = useCallback(
    async (bookingId: string) => {
      if (state.bookingState !== "pending") {
        throw new Error(
          `Cannot accept booking from state: ${state.bookingState}`,
        );
      }

      setState((prev) => ({ ...prev, isLoading: true }));

      try {
        const response: Omit<
          BookingResponse,
          "id" | "responderId" | "createdAt"
        > = {
          responseType: "accept",
          message: "予約を承認します。詳細を確認して確定しましょう。",
        };

        await BookingService.respondToBookingRequest(
          bookingId,
          "artist-id",
          response,
        );

        updateBookingState("confirmed", "予約が承認されました", bookingId, {
          isLoading: false,
        });

        showNotification({
          type: "success",
          title: "予約承認",
          message: "アーティストが予約を承認しました",
        });
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: `予約承認に失敗しました: ${error}`,
        }));

        showNotification({
          type: "error",
          title: "予約承認エラー",
          message: "もう一度お試しください",
        });

        throw error;
      }
    },
    [state.bookingState, updateBookingState, showNotification],
  );

  const confirmBooking = useCallback(
    async (
      bookingId: string,
      details: {
        confirmedDate: Date;
        confirmedPrice: number;
        confirmedDuration: number;
      },
    ) => {
      if (!["pending", "requested"].includes(state.bookingState)) {
        throw new Error(
          `Cannot confirm booking from state: ${state.bookingState}`,
        );
      }

      setState((prev) => ({ ...prev, isLoading: true }));

      try {
        await BookingService.confirmBooking(
          bookingId,
          details.confirmedDate,
          details.confirmedPrice,
          details.confirmedDuration,
        );

        updateBookingState("confirmed", "予約が確定されました", bookingId, {
          isLoading: false,
        });

        showNotification({
          type: "success",
          title: "予約確定",
          message: `${details.confirmedDate.toLocaleDateString("ja-JP")} に予約が確定しました`,
        });
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: `予約確定に失敗しました: ${error}`,
        }));

        showNotification({
          type: "error",
          title: "予約確定エラー",
          message: "もう一度お試しください",
        });

        throw error;
      }
    },
    [state.bookingState, updateBookingState, showNotification],
  );

  const cancelBooking = useCallback(
    async (bookingId: string, reason: string) => {
      if (!["requested", "pending", "confirmed"].includes(state.bookingState)) {
        throw new Error(
          `Cannot cancel booking from state: ${state.bookingState}`,
        );
      }

      setState((prev) => ({ ...prev, isLoading: true }));

      try {
        await BookingService.cancelBooking(bookingId, "user", reason);

        updateBookingState(
          "cancelled",
          `予約がキャンセルされました: ${reason}`,
          bookingId,
          {
            isLoading: false,
          },
        );

        showNotification({
          type: "warning",
          title: "予約キャンセル",
          message: "予約がキャンセルされました",
        });
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: `予約キャンセルに失敗しました: ${error}`,
        }));

        showNotification({
          type: "error",
          title: "キャンセルエラー",
          message: "もう一度お試しください",
        });

        throw error;
      }
    },
    [state.bookingState, updateBookingState, showNotification],
  );

  const completeBooking = useCallback(
    async (bookingId: string) => {
      if (state.bookingState !== "confirmed") {
        throw new Error(
          `Cannot complete booking from state: ${state.bookingState}`,
        );
      }

      setState((prev) => ({ ...prev, isLoading: true }));

      try {
        await BookingService.completeBooking(bookingId, "system");

        updateBookingState("completed", "施術が完了しました", bookingId, {
          isLoading: false,
          visitedStudio: true,
        });

        // Unlock review after completion
        setState((prev) => ({
          ...prev,
          reviewState: "unlocked",
        }));

        showNotification({
          type: "success",
          title: "施術完了",
          message: "お疲れ様でした。レビューの投稿をお願いします。",
        });
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: `施術完了処理に失敗しました: ${error}`,
        }));

        showNotification({
          type: "error",
          title: "完了処理エラー",
          message: "もう一度お試しください",
        });

        throw error;
      }
    },
    [state.bookingState, updateBookingState, showNotification],
  );

  // Review State Transitions
  const markStudioVisited = useCallback(() => {
    setState((prev) => ({
      ...prev,
      visitedStudio: true,
    }));
    console.log("🏢 Studio visited flag set to true");
  }, []);

  const unlockReview = useCallback(() => {
    if (!state.visitedStudio) {
      console.warn("Cannot unlock review - studio not visited");
      return;
    }

    setState((prev) => ({
      ...prev,
      reviewState: "unlocked",
    }));

    showNotification({
      type: "info",
      title: "レビュー解放",
      message: "レビューの投稿が可能になりました",
    });
  }, [state.visitedStudio, showNotification]);

  const submitReview = useCallback(
    async (reviewData: any) => {
      if (state.reviewState !== "unlocked") {
        throw new Error(
          `Cannot submit review from state: ${state.reviewState}`,
        );
      }

      try {
        // Here would be actual review submission logic
        console.log("📝 Submitting review:", reviewData);

        setState((prev) => ({
          ...prev,
          reviewState: "submitted",
        }));

        showNotification({
          type: "success",
          title: "レビュー投稿完了",
          message: "レビューをありがとうございました",
        });
      } catch (error) {
        showNotification({
          type: "error",
          title: "レビュー投稿エラー",
          message: "もう一度お試しください",
        });
        throw error;
      }
    },
    [state.reviewState, showNotification],
  );

  // Legal Consent
  const agreeLegalTerms = useCallback(
    (version: string, agreementText: string) => {
      const consent: LegalConsent = {
        version,
        timestamp: new Date(),
        agreementText,
      };

      setLegalConsent(consent);
      setState((prev) => ({
        ...prev,
        legalConsentState: "agreed",
      }));

      console.log("⚖️ Legal terms agreed:", consent);
    },
    [],
  );

  // State Queries
  const canCreateBooking = useCallback(() => {
    return (
      state.bookingState === "idle" && state.legalConsentState === "agreed"
    );
  }, [state.bookingState, state.legalConsentState]);

  const canConfirmBooking = useCallback(() => {
    return ["pending", "requested"].includes(state.bookingState);
  }, [state.bookingState]);

  const canWriteReview = useCallback(() => {
    return state.reviewState === "unlocked" && state.visitedStudio;
  }, [state.reviewState, state.visitedStudio]);

  // Competitor Handling
  const handleConcurrentBooking = useCallback(
    async (bookingId: string, competitorBookingId: string) => {
      console.log("⚡ Handling concurrent booking conflict:", {
        bookingId,
        competitorBookingId,
      });

      // Early bird gets the booking
      // Other booking gets alternative suggestions
      try {
        const booking = await BookingService.getUserBookings(
          "user-id",
          "customer",
        );
        const currentBooking = booking.find((b) => b.id === bookingId);

        if (!currentBooking) return;

        const alternatives = await BookingService.findAvailableSlots(
          currentBooking.artistId,
          currentBooking.preferredDate,
          currentBooking.estimatedDuration,
          currentBooking.alternativeDates,
        );

        showNotification({
          type: "warning",
          title: "予約競合発生",
          message: "他の予約と競合しました。代替案を提案します。",
        });

        console.log("🔄 Alternative slots suggested:", alternatives);
      } catch (error) {
        console.error("Error handling concurrent booking:", error);
      }
    },
    [showNotification],
  );

  const suggestAlternativeSlots = useCallback(
    async (artistId: string, originalDate: Date): Promise<Date[]> => {
      try {
        const alternatives = await BookingService.findAvailableSlots(
          artistId,
          originalDate,
          60, // Default 1 hour
          [],
        );

        return alternatives.flatMap((slot) =>
          slot.slots.map((s) => s.startTime),
        );
      } catch (error) {
        console.error("Error suggesting alternative slots:", error);
        return [];
      }
    },
    [],
  );

  const getTransitionHistory = useCallback(() => {
    return transitionHistory;
  }, [transitionHistory]);

  const reset = useCallback(() => {
    setState({
      bookingState: "idle",
      reviewState: "locked",
      legalConsentState: "notAgreed",
      isLoading: false,
      visitedStudio: false,
    });
    setTransitionHistory([]);
    setLegalConsent(null);
  }, []);

  return {
    state,
    actions: {
      createBookingRequest,
      acceptBooking,
      confirmBooking,
      cancelBooking,
      completeBooking,
      markStudioVisited,
      unlockReview,
      submitReview,
      agreeLegalTerms,
      canCreateBooking,
      canConfirmBooking,
      canWriteReview,
      getTransitionHistory,
      reset,
    },
    competitorHandling: {
      handleConcurrentBooking,
      suggestAlternativeSlots,
    },
  };
};
