import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
  Modal,
  FlatList,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import firestore from "@react-native-firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";

interface ScheduleSlot {
  id: string;
  artistId: string;
  date: Date;
  startTime: Date;
  endTime: Date;
  isAvailable: boolean;
  isRecurring: boolean;
  recurringType?: "daily" | "weekly" | "monthly";
  createdAt: Date;
  updatedAt: Date;
}

interface BookedSlot {
  id: string;
  slotId: string;
  customerId: string;
  customerName: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  createdAt: Date;
}

const ScheduleManagementScreen: React.FC = () => {
  const { userProfile } = useAuth();
  const [scheduleSlots, setScheduleSlots] = useState<ScheduleSlot[]>([]);
  const [bookedSlots, setBookedSlots] = useState<BookedSlot[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(new Date());

  useEffect(() => {
    loadScheduleData();
  }, [selectedWeek]);

  const loadScheduleData = async () => {
    if (!userProfile?.uid) return;

    try {
      const weekStart = getWeekStart(selectedWeek);
      const weekEnd = getWeekEnd(selectedWeek);

      const slotsSnapshot = await firestore()
        .collection("scheduleSlots")
        .where("artistId", "==", userProfile.uid)
        .where("date", ">=", weekStart)
        .where("date", "<=", weekEnd)
        .orderBy("date")
        .orderBy("startTime")
        .get();

      const slots = slotsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate(),
        startTime: doc.data().startTime.toDate(),
        endTime: doc.data().endTime.toDate(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate(),
      })) as ScheduleSlot[];

      const slotIds = slots.map((slot) => slot.id);
      let bookings: BookedSlot[] = [];

      if (slotIds.length > 0) {
        const bookingsSnapshot = await firestore()
          .collection("bookings")
          .where("slotId", "in", slotIds)
          .where("status", "in", ["pending", "confirmed"])
          .get();

        bookings = bookingsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt.toDate(),
        })) as BookedSlot[];
      }

      setScheduleSlots(slots);
      setBookedSlots(bookings);
    } catch (error) {
      console.error("Error loading schedule data:", error);
    }
  };

  const getWeekStart = (date: Date) => {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day;
    return new Date(start.setDate(diff));
  };

  const getWeekEnd = (date: Date) => {
    const end = getWeekStart(date);
    return new Date(end.setDate(end.getDate() + 6));
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("ja-JP", {
      month: "2-digit",
      day: "2-digit",
      weekday: "short",
    });
  };

  const addTimeSlot = async () => {
    if (!userProfile?.uid) return;

    if (endTime <= startTime) {
      Alert.alert("エラー", "終了時間は開始時間より後に設定してください");
      return;
    }

    try {
      const newSlot: Omit<ScheduleSlot, "id"> = {
        artistId: userProfile.uid,
        date: selectedDate,
        startTime,
        endTime,
        isAvailable: true,
        isRecurring: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await firestore().collection("scheduleSlots").add(newSlot);

      setModalVisible(false);
      loadScheduleData();
      Alert.alert("成功", "予約枠が追加されました");
    } catch (error) {
      Alert.alert("エラー", "予約枠の追加に失敗しました");
      console.error("Error adding time slot:", error);
    }
  };

  const deleteTimeSlot = async (slot: ScheduleSlot) => {
    const booking = bookedSlots.find((b) => b.slotId === slot.id);

    if (booking) {
      Alert.alert("エラー", "この時間枠は既に予約されているため削除できません");
      return;
    }

    Alert.alert("削除確認", "この予約枠を削除しますか？", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除",
        style: "destructive",
        onPress: async () => {
          try {
            await firestore().collection("scheduleSlots").doc(slot.id).delete();

            loadScheduleData();
            Alert.alert("成功", "予約枠が削除されました");
          } catch (error) {
            Alert.alert("エラー", "削除に失敗しました");
            console.error("Error deleting time slot:", error);
          }
        },
      },
    ]);
  };

  const toggleSlotAvailability = async (slot: ScheduleSlot) => {
    try {
      await firestore().collection("scheduleSlots").doc(slot.id).update({
        isAvailable: !slot.isAvailable,
        updatedAt: new Date(),
      });

      loadScheduleData();
    } catch (error) {
      Alert.alert("エラー", "更新に失敗しました");
      console.error("Error toggling slot availability:", error);
    }
  };

  const changeWeek = (direction: "prev" | "next") => {
    const newWeek = new Date(selectedWeek);
    newWeek.setDate(selectedWeek.getDate() + (direction === "next" ? 7 : -7));
    setSelectedWeek(newWeek);
  };

  const groupSlotsByDate = () => {
    const grouped: { [key: string]: ScheduleSlot[] } = {};

    scheduleSlots.forEach((slot) => {
      const dateKey = slot.date.toDateString();
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(slot);
    });

    return grouped;
  };

  const renderTimeSlot = (slot: ScheduleSlot) => {
    const booking = bookedSlots.find((b) => b.slotId === slot.id);
    const isBooked = !!booking;

    return (
      <TouchableOpacity
        key={slot.id}
        style={[
          styles.timeSlot,
          !slot.isAvailable && styles.unavailableSlot,
          isBooked && styles.bookedSlot,
        ]}
        onPress={() => !isBooked && toggleSlotAvailability(slot)}
        onLongPress={() => deleteTimeSlot(slot)}
      >
        <View style={styles.timeSlotContent}>
          <Text
            style={[
              styles.timeSlotText,
              !slot.isAvailable && styles.unavailableText,
              isBooked && styles.bookedText,
            ]}
          >
            {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
          </Text>
          {isBooked && (
            <Text style={styles.bookingInfo}>予約: {booking.customerName}</Text>
          )}
          <Text style={styles.slotStatus}>
            {isBooked ? "予約済み" : slot.isAvailable ? "空き" : "非公開"}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderDaySchedule = ({ item }: { item: [string, ScheduleSlot[]] }) => {
    const [dateKey, slots] = item;
    const date = new Date(dateKey);

    return (
      <View style={styles.dayContainer}>
        <Text style={styles.dayHeader}>{formatDate(date)}</Text>
        <View style={styles.timeSlotsContainer}>
          {slots.length > 0 ? (
            slots.map((slot) => renderTimeSlot(slot))
          ) : (
            <Text style={styles.noSlotsText}>予約枠がありません</Text>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>スケジュール管理</Text>

        <View style={styles.weekNavigation}>
          <TouchableOpacity
            style={styles.weekNavButton}
            onPress={() => changeWeek("prev")}
          >
            <Text style={styles.weekNavText}>← 前の週</Text>
          </TouchableOpacity>

          <Text style={styles.weekText}>
            {getWeekStart(selectedWeek).toLocaleDateString("ja-JP", {
              month: "2-digit",
              day: "2-digit",
            })}{" "}
            -{" "}
            {getWeekEnd(selectedWeek).toLocaleDateString("ja-JP", {
              month: "2-digit",
              day: "2-digit",
            })}
          </Text>

          <TouchableOpacity
            style={styles.weekNavButton}
            onPress={() => changeWeek("next")}
          >
            <Text style={styles.weekNavText}>次の週 →</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addButtonText}>+ 予約枠を追加</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={Object.entries(groupSlotsByDate())}
        renderItem={renderDaySchedule}
        keyExtractor={([dateKey]) => dateKey}
        style={styles.scheduleList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              この週に予約枠がありません
            </Text>
            <Text style={styles.emptyStateSubtext}>
              上のボタンから予約枠を追加してください
            </Text>
          </View>
        }
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>新しい予約枠を追加</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>日付</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateButtonText}>
                  {selectedDate.toLocaleDateString("ja-JP")}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>開始時間</Text>
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => setShowStartTimePicker(true)}
              >
                <Text style={styles.timeButtonText}>
                  {formatTime(startTime)}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>終了時間</Text>
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => setShowEndTimePicker(true)}
              >
                <Text style={styles.timeButtonText}>{formatTime(endTime)}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>キャンセル</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={addTimeSlot}
              >
                <Text style={styles.saveButtonText}>追加</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowDatePicker(false);
            if (date) setSelectedDate(date);
          }}
        />
      )}

      {showStartTimePicker && (
        <DateTimePicker
          value={startTime}
          mode="time"
          display="default"
          onChange={(event, time) => {
            setShowStartTimePicker(false);
            if (time) setStartTime(time);
          }}
        />
      )}

      {showEndTimePicker && (
        <DateTimePicker
          value={endTime}
          mode="time"
          display="default"
          onChange={(event, time) => {
            setShowEndTimePicker(false);
            if (time) setEndTime(time);
          }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  header: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 16,
  },
  weekNavigation: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  weekNavButton: {
    backgroundColor: "#2a2a2a",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  weekNavText: {
    color: "#fff",
    fontSize: 14,
  },
  weekText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  addButton: {
    backgroundColor: "#ff6b6b",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  scheduleList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  dayContainer: {
    marginBottom: 24,
  },
  dayHeader: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  timeSlotsContainer: {
    gap: 8,
  },
  timeSlot: {
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: "#4ade80",
  },
  unavailableSlot: {
    borderColor: "#64748b",
    opacity: 0.6,
  },
  bookedSlot: {
    borderColor: "#ff6b6b",
    backgroundColor: "#2d1f1f",
  },
  timeSlotContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  timeSlotText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  unavailableText: {
    color: "#aaa",
  },
  bookedText: {
    color: "#fff",
  },
  bookingInfo: {
    fontSize: 14,
    color: "#ff6b6b",
  },
  slotStatus: {
    fontSize: 12,
    color: "#aaa",
    fontWeight: "500",
  },
  noSlotsText: {
    color: "#aaa",
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    color: "#fff",
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#aaa",
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#2a2a2a",
    borderRadius: 20,
    padding: 24,
    width: "90%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 24,
    textAlign: "center",
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 8,
    fontWeight: "500",
  },
  dateButton: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  dateButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  timeButton: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  timeButtonText: {
    color: "#fff",
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  modalButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#333",
  },
  saveButton: {
    backgroundColor: "#ff6b6b",
  },
  cancelButtonText: {
    color: "#aaa",
    fontSize: 16,
    fontWeight: "bold",
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default ScheduleManagementScreen;
