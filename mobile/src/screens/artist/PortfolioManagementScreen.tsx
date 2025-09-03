import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
  Image,
  Modal,
  TextInput,
  FlatList,
} from "react-native";
import { launchImageLibrary } from "react-native-image-picker";
import storage from "@react-native-firebase/storage";
import firestore from "@react-native-firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";
import { PortfolioItem } from "../../types";

const PortfolioManagementScreen: React.FC = () => {
  const { userProfile } = useAuth();
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    style: "",
    size: "",
    timeSpent: "",
  });

  const tattooStyles = [
    "リアリズム",
    "トラディショナル",
    "ジャパニーズ",
    "ブラック＆グレー",
    "カラー",
    "オールドスクール",
    "ネオトラディショナル",
    "ミニマル",
    "レタリング",
    "ポートレート",
  ];

  const sizeOptions = ["小 (5cm以下)", "中 (5-15cm)", "大 (15cm以上)"];

  useEffect(() => {
    loadPortfolioItems();
  }, []);

  const loadPortfolioItems = async () => {
    if (!userProfile?.uid) return;

    try {
      const snapshot = await firestore()
        .collection("portfolioItems")
        .where("artistId", "==", userProfile.uid)
        .orderBy("createdAt", "desc")
        .get();

      const items = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as PortfolioItem[];

      setPortfolioItems(items);
    } catch (error) {
      console.error("Error loading portfolio items:", error);
    }
  };

  const selectImage = () => {
    const options = {
      mediaType: "photo" as const,
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel || response.errorMessage) return;

      if (response.assets && response.assets[0]) {
        uploadImage(response.assets[0]);
      }
    });
  };

  const uploadImage = async (imageAsset: any) => {
    if (!userProfile?.uid) return;

    setIsUploading(true);

    try {
      const fileName = `portfolio/${userProfile.uid}/${Date.now()}.jpg`;
      const reference = storage().ref(fileName);

      await reference.putFile(imageAsset.uri);
      const downloadURL = await reference.getDownloadURL();

      const portfolioItem: Omit<PortfolioItem, "id"> = {
        artistId: userProfile.uid,
        imageUrl: downloadURL,
        title: "",
        description: "",
        style: "",
        size: "",
        timeSpent: 0,
        tags: [],
        aiAnalysis: null,
        likes: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await firestore()
        .collection("portfolioItems")
        .add(portfolioItem);

      const newItem = { id: docRef.id, ...portfolioItem };
      setPortfolioItems((prev) => [newItem, ...prev]);

      Alert.alert("成功", "画像がアップロードされました");
    } catch (error) {
      Alert.alert("エラー", "画像のアップロードに失敗しました");
      console.error("Upload error:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const openEditModal = (item: PortfolioItem) => {
    setSelectedItem(item);
    setEditForm({
      title: item.title,
      description: item.description,
      style: item.style,
      size: item.size,
      timeSpent: item.timeSpent.toString(),
    });
    setModalVisible(true);
  };

  const saveChanges = async () => {
    if (!selectedItem) return;

    try {
      const updatedItem = {
        ...selectedItem,
        title: editForm.title,
        description: editForm.description,
        style: editForm.style,
        size: editForm.size,
        timeSpent: parseFloat(editForm.timeSpent) || 0,
        updatedAt: new Date(),
      };

      await firestore()
        .collection("portfolioItems")
        .doc(selectedItem.id)
        .update(updatedItem);

      setPortfolioItems((prev) =>
        prev.map((item) => (item.id === selectedItem.id ? updatedItem : item)),
      );

      setModalVisible(false);
      Alert.alert("成功", "作品情報が更新されました");
    } catch (error) {
      Alert.alert("エラー", "更新に失敗しました");
      console.error("Update error:", error);
    }
  };

  const deleteItem = async (item: PortfolioItem) => {
    Alert.alert("削除確認", "この作品を削除しますか？", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除",
        style: "destructive",
        onPress: async () => {
          try {
            await firestore()
              .collection("portfolioItems")
              .doc(item.id)
              .delete();

            await storage().refFromURL(item.imageUrl).delete();

            setPortfolioItems((prev) => prev.filter((p) => p.id !== item.id));
            Alert.alert("成功", "作品が削除されました");
          } catch (error) {
            Alert.alert("エラー", "削除に失敗しました");
            console.error("Delete error:", error);
          }
        },
      },
    ]);
  };

  const renderPortfolioItem = ({ item }: { item: PortfolioItem }) => (
    <TouchableOpacity
      style={styles.portfolioItem}
      onPress={() => openEditModal(item)}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.portfolioImage} />
      <View style={styles.portfolioInfo}>
        <Text style={styles.portfolioTitle}>{item.title || "未設定"}</Text>
        <Text style={styles.portfolioStyle}>{item.style}</Text>
        <Text style={styles.portfolioSize}>{item.size}</Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => deleteItem(item)}
      >
        <Text style={styles.deleteButtonText}>×</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ポートフォリオ管理</Text>
        <Text style={styles.subtitle}>
          作品数: {portfolioItems.length} / 最低10枚必要
        </Text>
      </View>

      <TouchableOpacity
        style={styles.addButton}
        onPress={selectImage}
        disabled={isUploading}
      >
        <Text style={styles.addButtonText}>
          {isUploading ? "アップロード中..." : "+ 新しい作品を追加"}
        </Text>
      </TouchableOpacity>

      {portfolioItems.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>作品がまだありません</Text>
          <Text style={styles.emptyStateSubtext}>
            上のボタンから作品画像を追加してください
          </Text>
        </View>
      ) : (
        <FlatList
          data={portfolioItems}
          renderItem={renderPortfolioItem}
          keyExtractor={(item) => item.id}
          style={styles.portfolioList}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>作品情報を編集</Text>

            <ScrollView style={styles.modalScroll}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>タイトル</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.title}
                  onChangeText={(text) =>
                    setEditForm((prev) => ({ ...prev, title: text }))
                  }
                  placeholder="作品のタイトル"
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>説明</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={editForm.description}
                  onChangeText={(text) =>
                    setEditForm((prev) => ({ ...prev, description: text }))
                  }
                  placeholder="作品の説明やコンセプト"
                  placeholderTextColor="#666"
                  multiline={true}
                  numberOfLines={3}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>スタイル</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.styleContainer}>
                    {tattooStyles.map((style) => (
                      <TouchableOpacity
                        key={style}
                        style={[
                          styles.styleChip,
                          editForm.style === style && styles.styleChipSelected,
                        ]}
                        onPress={() =>
                          setEditForm((prev) => ({ ...prev, style }))
                        }
                      >
                        <Text
                          style={[
                            styles.styleText,
                            editForm.style === style &&
                              styles.styleTextSelected,
                          ]}
                        >
                          {style}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>サイズ</Text>
                <View style={styles.sizeContainer}>
                  {sizeOptions.map((size) => (
                    <TouchableOpacity
                      key={size}
                      style={[
                        styles.sizeChip,
                        editForm.size === size && styles.sizeChipSelected,
                      ]}
                      onPress={() => setEditForm((prev) => ({ ...prev, size }))}
                    >
                      <Text
                        style={[
                          styles.sizeText,
                          editForm.size === size && styles.sizeTextSelected,
                        ]}
                      >
                        {size}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>施術時間（時間）</Text>
                <TextInput
                  style={styles.input}
                  value={editForm.timeSpent}
                  onChangeText={(text) =>
                    setEditForm((prev) => ({ ...prev, timeSpent: text }))
                  }
                  placeholder="例: 3.5"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                />
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveChanges}
              >
                <Text style={styles.saveButtonText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#aaa",
  },
  addButton: {
    backgroundColor: "#ff6b6b",
    margin: 20,
    marginTop: 10,
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
  },
  addButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyStateText: {
    fontSize: 20,
    color: "#fff",
    marginBottom: 12,
  },
  emptyStateSubtext: {
    fontSize: 16,
    color: "#aaa",
    textAlign: "center",
  },
  portfolioList: {
    flex: 1,
    padding: 20,
    paddingTop: 0,
  },
  portfolioItem: {
    backgroundColor: "#2a2a2a",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
  },
  portfolioImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: "#333",
  },
  portfolioInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: "center",
  },
  portfolioTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  portfolioStyle: {
    fontSize: 14,
    color: "#ff6b6b",
    marginBottom: 2,
  },
  portfolioSize: {
    fontSize: 14,
    color: "#aaa",
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#ff4757",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
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
    padding: 20,
    width: "90%",
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
    textAlign: "center",
  },
  modalScroll: {
    maxHeight: 400,
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
  input: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#fff",
    borderWidth: 1,
    borderColor: "#333",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  styleContainer: {
    flexDirection: "row",
    gap: 8,
  },
  styleChip: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#333",
  },
  styleChipSelected: {
    backgroundColor: "#ff6b6b",
    borderColor: "#ff6b6b",
  },
  styleText: {
    fontSize: 12,
    color: "#aaa",
  },
  styleTextSelected: {
    color: "#fff",
  },
  sizeContainer: {
    flexDirection: "row",
    gap: 8,
  },
  sizeChip: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
  },
  sizeChipSelected: {
    backgroundColor: "#ff6b6b",
    borderColor: "#ff6b6b",
  },
  sizeText: {
    fontSize: 14,
    color: "#aaa",
  },
  sizeTextSelected: {
    color: "#fff",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
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

export default PortfolioManagementScreen;
