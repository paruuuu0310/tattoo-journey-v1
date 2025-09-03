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
  TextInput,
  FlatList,
  Image,
} from "react-native";
import { launchImageLibrary } from "react-native-image-picker";
import storage from "@react-native-firebase/storage";
import firestore from "@react-native-firebase/firestore";
import { useAuth } from "../../contexts/AuthContext";

interface SpecialtyStyle {
  id: string;
  artistId: string;
  styleName: string;
  proficiencyLevel: 1 | 2 | 3 | 4 | 5; // 1=初級, 5=エキスパート
  experienceYears: number;
  description: string;
  sampleImages: string[];
  tags: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SpecialtyManagementScreen: React.FC = () => {
  const { userProfile, updateUserProfile } = useAuth();
  const [specialties, setSpecialties] = useState<SpecialtyStyle[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSpecialty, setSelectedSpecialty] =
    useState<SpecialtyStyle | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    styleName: "",
    proficiencyLevel: 3 as 1 | 2 | 3 | 4 | 5,
    experienceYears: "",
    description: "",
    tags: [] as string[],
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
    "バイオメカニクス",
    "トライバル",
    "ウォーターカラー",
    "ドットワーク",
    "ジオメトリック",
    "アブストラクト",
  ];

  const proficiencyLabels = {
    1: "初級",
    2: "中級",
    3: "上級",
    4: "エキスパート",
    5: "マスター",
  };

  const commonTags = [
    "動物",
    "花",
    "人物",
    "風景",
    "抽象",
    "文字",
    "記号",
    "スカル",
    "ドラゴン",
    "鳥",
    "魚",
    "昆虫",
    "マンダラ",
    "幾何学",
    "宗教的",
    "音楽",
    "スポーツ",
    "映画",
    "アニメ",
    "ゲーム",
  ];

  useEffect(() => {
    loadSpecialties();
  }, []);

  const loadSpecialties = async () => {
    if (!userProfile?.uid) return;

    try {
      const snapshot = await firestore()
        .collection("specialtyStyles")
        .where("artistId", "==", userProfile.uid)
        .orderBy("proficiencyLevel", "desc")
        .get();

      const styles = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        updatedAt: doc.data().updatedAt.toDate(),
      })) as SpecialtyStyle[];

      setSpecialties(styles);
    } catch (error) {
      console.error("Error loading specialties:", error);
    }
  };

  const openModal = (specialty?: SpecialtyStyle) => {
    if (specialty) {
      setSelectedSpecialty(specialty);
      setFormData({
        styleName: specialty.styleName,
        proficiencyLevel: specialty.proficiencyLevel,
        experienceYears: specialty.experienceYears.toString(),
        description: specialty.description,
        tags: specialty.tags,
      });
      setIsEditing(true);
    } else {
      setSelectedSpecialty(null);
      setFormData({
        styleName: "",
        proficiencyLevel: 3,
        experienceYears: "",
        description: "",
        tags: [],
      });
      setIsEditing(false);
    }
    setModalVisible(true);
  };

  const saveSpecialty = async () => {
    if (!userProfile?.uid || !formData.styleName) {
      Alert.alert("エラー", "スタイル名は必須です");
      return;
    }

    try {
      const specialtyData = {
        artistId: userProfile.uid,
        styleName: formData.styleName,
        proficiencyLevel: formData.proficiencyLevel,
        experienceYears: parseInt(formData.experienceYears) || 0,
        description: formData.description,
        tags: formData.tags,
        isActive: true,
        updatedAt: new Date(),
      };

      if (isEditing && selectedSpecialty) {
        await firestore()
          .collection("specialtyStyles")
          .doc(selectedSpecialty.id)
          .update(specialtyData);

        setSpecialties((prev) =>
          prev.map((s) =>
            s.id === selectedSpecialty.id ? { ...s, ...specialtyData } : s,
          ),
        );
        Alert.alert("成功", "得意スタイルが更新されました");
      } else {
        const newSpecialty = {
          ...specialtyData,
          sampleImages: [],
          createdAt: new Date(),
        };

        const docRef = await firestore()
          .collection("specialtyStyles")
          .add(newSpecialty);

        setSpecialties((prev) => [...prev, { id: docRef.id, ...newSpecialty }]);
        Alert.alert("成功", "新しい得意スタイルが追加されました");
      }

      setModalVisible(false);
    } catch (error) {
      Alert.alert("エラー", "保存に失敗しました");
      console.error("Error saving specialty:", error);
    }
  };

  const toggleSpecialtyStatus = async (specialty: SpecialtyStyle) => {
    try {
      await firestore().collection("specialtyStyles").doc(specialty.id).update({
        isActive: !specialty.isActive,
        updatedAt: new Date(),
      });

      setSpecialties((prev) =>
        prev.map((s) =>
          s.id === specialty.id ? { ...s, isActive: !s.isActive } : s,
        ),
      );
    } catch (error) {
      Alert.alert("エラー", "更新に失敗しました");
      console.error("Error toggling specialty status:", error);
    }
  };

  const deleteSpecialty = async (specialty: SpecialtyStyle) => {
    Alert.alert("削除確認", "この得意スタイルを削除しますか？", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除",
        style: "destructive",
        onPress: async () => {
          try {
            await firestore()
              .collection("specialtyStyles")
              .doc(specialty.id)
              .delete();

            // サンプル画像も削除
            for (const imageUrl of specialty.sampleImages) {
              try {
                await storage().refFromURL(imageUrl).delete();
              } catch (error) {
                console.warn("Error deleting image:", error);
              }
            }

            setSpecialties((prev) => prev.filter((s) => s.id !== specialty.id));
            Alert.alert("成功", "得意スタイルが削除されました");
          } catch (error) {
            Alert.alert("エラー", "削除に失敗しました");
            console.error("Error deleting specialty:", error);
          }
        },
      },
    ]);
  };

  const addSampleImage = async (specialty: SpecialtyStyle) => {
    const options = {
      mediaType: "photo" as const,
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
    };

    launchImageLibrary(options, async (response) => {
      if (response.didCancel || response.errorMessage || !response.assets?.[0])
        return;

      try {
        const fileName = `specialty/${specialty.id}/${Date.now()}.jpg`;
        const reference = storage().ref(fileName);

        await reference.putFile(response.assets[0].uri!);
        const downloadURL = await reference.getDownloadURL();

        const updatedImages = [...specialty.sampleImages, downloadURL];

        await firestore()
          .collection("specialtyStyles")
          .doc(specialty.id)
          .update({
            sampleImages: updatedImages,
            updatedAt: new Date(),
          });

        setSpecialties((prev) =>
          prev.map((s) =>
            s.id === specialty.id ? { ...s, sampleImages: updatedImages } : s,
          ),
        );

        Alert.alert("成功", "サンプル画像が追加されました");
      } catch (error) {
        Alert.alert("エラー", "画像のアップロードに失敗しました");
        console.error("Upload error:", error);
      }
    });
  };

  const removeSampleImage = async (
    specialty: SpecialtyStyle,
    imageUrl: string,
  ) => {
    Alert.alert("削除確認", "この画像を削除しますか？", [
      { text: "キャンセル", style: "cancel" },
      {
        text: "削除",
        style: "destructive",
        onPress: async () => {
          try {
            await storage().refFromURL(imageUrl).delete();

            const updatedImages = specialty.sampleImages.filter(
              (img) => img !== imageUrl,
            );

            await firestore()
              .collection("specialtyStyles")
              .doc(specialty.id)
              .update({
                sampleImages: updatedImages,
                updatedAt: new Date(),
              });

            setSpecialties((prev) =>
              prev.map((s) =>
                s.id === specialty.id
                  ? { ...s, sampleImages: updatedImages }
                  : s,
              ),
            );

            Alert.alert("成功", "画像が削除されました");
          } catch (error) {
            Alert.alert("エラー", "削除に失敗しました");
            console.error("Error removing image:", error);
          }
        },
      },
    ]);
  };

  const toggleTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const renderSpecialtyCard = (specialty: SpecialtyStyle) => (
    <View
      key={specialty.id}
      style={[styles.specialtyCard, !specialty.isActive && styles.inactiveCard]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardTitleRow}>
          <Text
            style={[
              styles.styleName,
              !specialty.isActive && styles.inactiveText,
            ]}
          >
            {specialty.styleName}
          </Text>
          <View style={styles.proficiencyBadge}>
            <Text style={styles.proficiencyText}>
              {proficiencyLabels[specialty.proficiencyLevel]}
            </Text>
          </View>
        </View>
        <Text
          style={[
            styles.experienceText,
            !specialty.isActive && styles.inactiveText,
          ]}
        >
          経験年数: {specialty.experienceYears}年
        </Text>
      </View>

      {specialty.description && (
        <Text
          style={[
            styles.description,
            !specialty.isActive && styles.inactiveText,
          ]}
        >
          {specialty.description}
        </Text>
      )}

      {specialty.tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {specialty.tags.slice(0, 3).map((tag) => (
            <View key={tag} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
          {specialty.tags.length > 3 && (
            <Text style={styles.moreTagsText}>
              +{specialty.tags.length - 3}
            </Text>
          )}
        </View>
      )}

      <ScrollView
        horizontal
        style={styles.sampleImagesContainer}
        showsHorizontalScrollIndicator={false}
      >
        {specialty.sampleImages.map((imageUrl, index) => (
          <TouchableOpacity
            key={index}
            style={styles.sampleImageWrapper}
            onLongPress={() => removeSampleImage(specialty, imageUrl)}
          >
            <Image source={{ uri: imageUrl }} style={styles.sampleImage} />
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={styles.addImageButton}
          onPress={() => addSampleImage(specialty)}
        >
          <Text style={styles.addImageText}>+</Text>
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[
            styles.statusButton,
            specialty.isActive ? styles.activeButton : styles.inactiveButton,
          ]}
          onPress={() => toggleSpecialtyStatus(specialty)}
        >
          <Text style={styles.statusButtonText}>
            {specialty.isActive ? "有効" : "無効"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => openModal(specialty)}
        >
          <Text style={styles.editButtonText}>編集</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteSpecialty(specialty)}
        >
          <Text style={styles.deleteButtonText}>削除</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>得意スタイル管理</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => openModal()}>
          <Text style={styles.addButtonText}>+ 新しいスタイル</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {specialties.length > 0 ? (
          specialties.map(renderSpecialtyCard)
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>得意スタイルがありません</Text>
            <Text style={styles.emptyStateSubtext}>
              上のボタンから得意スタイルを追加してください
            </Text>
          </View>
        )}
      </ScrollView>

      {/* 編集/追加モーダル */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>
                {isEditing ? "スタイルを編集" : "新しいスタイルを追加"}
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>スタイル名</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.styleOptionsContainer}>
                    {tattooStyles.map((style) => (
                      <TouchableOpacity
                        key={style}
                        style={[
                          styles.styleOption,
                          formData.styleName === style &&
                            styles.selectedStyleOption,
                        ]}
                        onPress={() =>
                          setFormData((prev) => ({ ...prev, styleName: style }))
                        }
                      >
                        <Text
                          style={[
                            styles.styleOptionText,
                            formData.styleName === style &&
                              styles.selectedStyleOptionText,
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
                <Text style={styles.label}>熟練度</Text>
                <View style={styles.proficiencyContainer}>
                  {[1, 2, 3, 4, 5].map((level) => (
                    <TouchableOpacity
                      key={level}
                      style={[
                        styles.proficiencyOption,
                        formData.proficiencyLevel === level &&
                          styles.selectedProficiencyOption,
                      ]}
                      onPress={() =>
                        setFormData((prev) => ({
                          ...prev,
                          proficiencyLevel: level as 1 | 2 | 3 | 4 | 5,
                        }))
                      }
                    >
                      <Text
                        style={[
                          styles.proficiencyOptionText,
                          formData.proficiencyLevel === level &&
                            styles.selectedProficiencyOptionText,
                        ]}
                      >
                        {proficiencyLabels[level as 1 | 2 | 3 | 4 | 5]}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>経験年数</Text>
                <TextInput
                  style={styles.input}
                  value={formData.experienceYears}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, experienceYears: text }))
                  }
                  placeholder="3"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>説明</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.description}
                  onChangeText={(text) =>
                    setFormData((prev) => ({ ...prev, description: text }))
                  }
                  placeholder="このスタイルの特徴や得意な分野について説明してください"
                  placeholderTextColor="#666"
                  multiline={true}
                  numberOfLines={3}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>関連タグ</Text>
                <View style={styles.tagsGrid}>
                  {commonTags.map((tag) => (
                    <TouchableOpacity
                      key={tag}
                      style={[
                        styles.tagOption,
                        formData.tags.includes(tag) && styles.selectedTagOption,
                      ]}
                      onPress={() => toggleTag(tag)}
                    >
                      <Text
                        style={[
                          styles.tagOptionText,
                          formData.tags.includes(tag) &&
                            styles.selectedTagOptionText,
                        ]}
                      >
                        {tag}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
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
                  onPress={saveSpecialty}
                >
                  <Text style={styles.saveButtonText}>
                    {isEditing ? "更新" : "追加"}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  addButton: {
    backgroundColor: "#ff6b6b",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 10,
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
  specialtyCard: {
    backgroundColor: "#2a2a2a",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#333",
  },
  inactiveCard: {
    opacity: 0.6,
    borderColor: "#555",
  },
  cardHeader: {
    marginBottom: 12,
  },
  cardTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  styleName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    flex: 1,
  },
  proficiencyBadge: {
    backgroundColor: "#ff6b6b",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  proficiencyText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  experienceText: {
    fontSize: 14,
    color: "#aaa",
  },
  description: {
    fontSize: 14,
    color: "#ccc",
    marginBottom: 12,
    lineHeight: 20,
  },
  inactiveText: {
    color: "#666",
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12,
  },
  tag: {
    backgroundColor: "#333",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 12,
    color: "#aaa",
  },
  moreTagsText: {
    fontSize: 12,
    color: "#888",
    alignSelf: "center",
  },
  sampleImagesContainer: {
    marginBottom: 16,
  },
  sampleImageWrapper: {
    marginRight: 8,
  },
  sampleImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#333",
  },
  addImageButton: {
    width: 60,
    height: 60,
    backgroundColor: "#333",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#555",
    borderStyle: "dashed",
  },
  addImageText: {
    color: "#888",
    fontSize: 24,
  },
  cardActions: {
    flexDirection: "row",
    gap: 8,
  },
  statusButton: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flex: 1,
    alignItems: "center",
  },
  activeButton: {
    backgroundColor: "#4ade80",
  },
  inactiveButton: {
    backgroundColor: "#64748b",
  },
  statusButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  editButton: {
    backgroundColor: "#3b82f6",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flex: 1,
    alignItems: "center",
  },
  editButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  deleteButton: {
    backgroundColor: "#ef4444",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flex: 1,
    alignItems: "center",
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
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
    maxHeight: "80%",
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
  styleOptionsContainer: {
    flexDirection: "row",
    gap: 8,
  },
  styleOption: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#333",
  },
  selectedStyleOption: {
    backgroundColor: "#ff6b6b",
    borderColor: "#ff6b6b",
  },
  styleOptionText: {
    fontSize: 14,
    color: "#aaa",
  },
  selectedStyleOptionText: {
    color: "#fff",
  },
  proficiencyContainer: {
    flexDirection: "row",
    gap: 8,
  },
  proficiencyOption: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#333",
  },
  selectedProficiencyOption: {
    backgroundColor: "#ff6b6b",
    borderColor: "#ff6b6b",
  },
  proficiencyOptionText: {
    fontSize: 12,
    color: "#aaa",
  },
  selectedProficiencyOptionText: {
    color: "#fff",
  },
  tagsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tagOption: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#333",
  },
  selectedTagOption: {
    backgroundColor: "#ff6b6b",
    borderColor: "#ff6b6b",
  },
  tagOptionText: {
    fontSize: 12,
    color: "#aaa",
  },
  selectedTagOptionText: {
    color: "#fff",
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

export default SpecialtyManagementScreen;
