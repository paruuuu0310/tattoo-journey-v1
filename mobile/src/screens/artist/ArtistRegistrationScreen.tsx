import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  Alert,
} from "react-native";
import { useAuth } from "../../contexts/AuthContext";

const ArtistRegistrationScreen: React.FC = () => {
  const { userProfile, updateUserProfile } = useAuth();
  const [formData, setFormData] = useState({
    studioName: "",
    yearsOfExperience: "",
    specialties: [],
    bio: "",
    location: "",
    priceRange: {
      small: "",
      medium: "",
      large: "",
    },
    hourlyRate: "",
    instagram: "",
    website: "",
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

  const handleSpecialtyToggle = (style: string) => {
    setFormData((prev) => ({
      ...prev,
      specialties: prev.specialties.includes(style)
        ? prev.specialties.filter((s) => s !== style)
        : [...prev.specialties, style],
    }));
  };

  const handleSubmit = async () => {
    if (
      !formData.studioName ||
      !formData.yearsOfExperience ||
      !formData.bio ||
      !formData.location
    ) {
      Alert.alert("エラー", "すべての必須項目を入力してください");
      return;
    }

    if (formData.specialties.length === 0) {
      Alert.alert("エラー", "少なくとも1つの得意スタイルを選択してください");
      return;
    }

    try {
      const artistProfile = {
        ...userProfile?.profile,
        artistInfo: {
          studioName: formData.studioName,
          yearsOfExperience: parseInt(formData.yearsOfExperience),
          specialties: formData.specialties,
          bio: formData.bio,
          location: formData.location,
          priceRange: {
            small: parseFloat(formData.priceRange.small) || 0,
            medium: parseFloat(formData.priceRange.medium) || 0,
            large: parseFloat(formData.priceRange.large) || 0,
          },
          hourlyRate: parseFloat(formData.hourlyRate) || 0,
          socialMedia: {
            instagram: formData.instagram,
            website: formData.website,
          },
          rating: 0,
          totalReviews: 0,
          verified: false,
          portfolioCount: 0,
        },
      };

      await updateUserProfile(artistProfile);
      Alert.alert("完了", "アーティスト情報が登録されました");
    } catch (error) {
      Alert.alert("エラー", "アーティスト情報の登録に失敗しました");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>アーティスト登録</Text>
        <Text style={styles.subtitle}>プロフィール情報を入力してください</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>基本情報</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>スタジオ名 *</Text>
            <TextInput
              style={styles.input}
              value={formData.studioName}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, studioName: text }))
              }
              placeholder="例: Tokyo Ink Studio"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>経験年数 *</Text>
            <TextInput
              style={styles.input}
              value={formData.yearsOfExperience}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, yearsOfExperience: text }))
              }
              placeholder="例: 5"
              placeholderTextColor="#666"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>所在地 *</Text>
            <TextInput
              style={styles.input}
              value={formData.location}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, location: text }))
              }
              placeholder="例: 東京都渋谷区"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>自己紹介 *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.bio}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, bio: text }))
              }
              placeholder="あなたのアーティストとしての経歴や特徴を教えてください"
              placeholderTextColor="#666"
              multiline={true}
              numberOfLines={4}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>得意スタイル *</Text>
          <Text style={styles.helperText}>複数選択可能</Text>

          <View style={styles.specialtyContainer}>
            {tattooStyles.map((style) => (
              <TouchableOpacity
                key={style}
                style={[
                  styles.specialtyChip,
                  formData.specialties.includes(style) &&
                    styles.specialtyChipSelected,
                ]}
                onPress={() => handleSpecialtyToggle(style)}
              >
                <Text
                  style={[
                    styles.specialtyText,
                    formData.specialties.includes(style) &&
                      styles.specialtyTextSelected,
                  ]}
                >
                  {style}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>料金設定</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>小サイズ (5cm以下) - ¥</Text>
            <TextInput
              style={styles.input}
              value={formData.priceRange.small}
              onChangeText={(text) =>
                setFormData((prev) => ({
                  ...prev,
                  priceRange: { ...prev.priceRange, small: text },
                }))
              }
              placeholder="10000"
              placeholderTextColor="#666"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>中サイズ (5-15cm) - ¥</Text>
            <TextInput
              style={styles.input}
              value={formData.priceRange.medium}
              onChangeText={(text) =>
                setFormData((prev) => ({
                  ...prev,
                  priceRange: { ...prev.priceRange, medium: text },
                }))
              }
              placeholder="30000"
              placeholderTextColor="#666"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>大サイズ (15cm以上) - ¥</Text>
            <TextInput
              style={styles.input}
              value={formData.priceRange.large}
              onChangeText={(text) =>
                setFormData((prev) => ({
                  ...prev,
                  priceRange: { ...prev.priceRange, large: text },
                }))
              }
              placeholder="80000"
              placeholderTextColor="#666"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>時間料金 (¥/時間)</Text>
            <TextInput
              style={styles.input}
              value={formData.hourlyRate}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, hourlyRate: text }))
              }
              placeholder="15000"
              placeholderTextColor="#666"
              keyboardType="numeric"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SNS・連絡先</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Instagram</Text>
            <TextInput
              style={styles.input}
              value={formData.instagram}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, instagram: text }))
              }
              placeholder="@your_instagram"
              placeholderTextColor="#666"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>ウェブサイト</Text>
            <TextInput
              style={styles.input}
              value={formData.website}
              onChangeText={(text) =>
                setFormData((prev) => ({ ...prev, website: text }))
              }
              placeholder="https://your-website.com"
              placeholderTextColor="#666"
            />
          </View>
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>登録を完了</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1a1a1a",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#aaa",
    marginBottom: 32,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 16,
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
    backgroundColor: "#2a2a2a",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#fff",
    borderWidth: 1,
    borderColor: "#333",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  helperText: {
    fontSize: 14,
    color: "#888",
    marginBottom: 16,
  },
  specialtyContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  specialtyChip: {
    backgroundColor: "#2a2a2a",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#333",
  },
  specialtyChipSelected: {
    backgroundColor: "#ff6b6b",
    borderColor: "#ff6b6b",
  },
  specialtyText: {
    fontSize: 14,
    color: "#aaa",
    fontWeight: "500",
  },
  specialtyTextSelected: {
    color: "#fff",
  },
  submitButton: {
    backgroundColor: "#ff6b6b",
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    marginBottom: 32,
    shadowColor: "#ff6b6b",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default ArtistRegistrationScreen;
