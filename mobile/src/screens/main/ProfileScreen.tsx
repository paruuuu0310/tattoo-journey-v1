import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
} from "react-native";
import { Button, Avatar, Tag } from "../../components/ui";
import { DesignTokens } from "../../styles/DesignTokens";
import { useAuth } from "../../contexts/AuthContext";

interface ProfileScreenProps {
  onEditProfile?: () => void;
  onSettings?: () => void;
  onLogout?: () => void;
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onEditProfile,
  onSettings,
  onLogout,
}) => {
  const { currentUser, userProfile, loading } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator
            size="large"
            color={DesignTokens.colors.primary[500]}
          />
          <Text style={styles.loadingText}>プロフィールを読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!userProfile || !currentUser) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>プロフィール情報を読み込めません</Text>
        </View>
      </SafeAreaView>
    );
  }

  const preferences = userProfile.profile?.preferences || {
    styles: ["ミニマル", "リアリズム"],
    priceRange: "¥50,000〜¥100,000",
    location: "東京都渋谷区",
  };

  const stats = {
    savedDesigns: userProfile.profile?.stats?.savedDesigns || 12,
    completedBookings: userProfile.profile?.stats?.completedBookings || 3,
    writtenReviews: userProfile.profile?.stats?.writtenReviews || 2,
    followingArtists: userProfile.profile?.stats?.followingArtists || 8,
  };

  const menuItems = [
    {
      id: "bookings",
      icon: "📅",
      title: "予約履歴",
      subtitle: "過去の予約を確認",
    },
    {
      id: "favorites",
      icon: "❤️",
      title: "お気に入り",
      subtitle: "保存したデザイン",
    },
    {
      id: "reviews",
      icon: "⭐",
      title: "レビュー",
      subtitle: "投稿したレビュー",
    },
    {
      id: "following",
      icon: "👥",
      title: "フォロー中",
      subtitle: "フォロー中のアーティスト",
    },
    { id: "settings", icon: "⚙️", title: "設定", subtitle: "アプリの設定" },
    {
      id: "help",
      icon: "❓",
      title: "ヘルプ・サポート",
      subtitle: "よくある質問",
    },
  ];

  const handleMenuPress = (menuId: string) => {
    switch (menuId) {
      case "settings":
        onSettings?.();
        break;
      default:
        // Handle other menu items
        break;
    }
  };

  const renderProfileHeader = () => (
    <View style={styles.profileHeader}>
      <Avatar
        imageUrl={userProfile.profile?.avatar}
        name={userProfile.displayName || currentUser.email}
        size="xlarge"
      />

      <View style={styles.profileInfo}>
        <Text style={styles.userName}>
          {userProfile.displayName || "ユーザー"}
        </Text>
        <Text style={styles.userEmail}>{currentUser.email}</Text>
        <Text style={styles.userLocation}>{preferences.location}</Text>

        <View style={styles.userStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.savedDesigns}</Text>
            <Text style={styles.statLabel}>保存</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.completedBookings}</Text>
            <Text style={styles.statLabel}>予約</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.writtenReviews}</Text>
            <Text style={styles.statLabel}>レビュー</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.followingArtists}</Text>
            <Text style={styles.statLabel}>フォロー</Text>
          </View>
        </View>
      </View>

      <Button
        title="プロフィール編集"
        onPress={onEditProfile}
        variant="secondary"
        size="medium"
        style={styles.editButton}
      />
    </View>
  );

  const renderPreferences = () => (
    <View style={styles.preferencesSection}>
      <Text style={styles.sectionTitle}>好みの設定</Text>

      <View style={styles.preferenceItem}>
        <Text style={styles.preferenceLabel}>好みのスタイル</Text>
        <View style={styles.preferenceTags}>
          {preferences.styles.map((style, index) => (
            <Tag
              key={index}
              label={style}
              variant="accent"
              size="small"
              style={styles.preferenceTag}
            />
          ))}
        </View>
      </View>

      <View style={styles.preferenceItem}>
        <Text style={styles.preferenceLabel}>価格帯</Text>
        <Text style={styles.preferenceValue}>{preferences.priceRange}</Text>
      </View>

      <View style={styles.preferenceItem}>
        <Text style={styles.preferenceLabel}>検索エリア</Text>
        <Text style={styles.preferenceValue}>{preferences.location}</Text>
      </View>
    </View>
  );

  const renderSettings = () => (
    <View style={styles.settingsSection}>
      <Text style={styles.sectionTitle}>設定</Text>

      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>プッシュ通知</Text>
          <Text style={styles.settingDescription}>
            新しいメッセージや予約更新
          </Text>
        </View>
        <Switch
          value={notificationsEnabled}
          onValueChange={setNotificationsEnabled}
          trackColor={{
            false: DesignTokens.colors.dark.border,
            true: DesignTokens.colors.primary[500],
          }}
          thumbColor={DesignTokens.colors.dark.text.primary}
        />
      </View>

      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>位置情報</Text>
          <Text style={styles.settingDescription}>近くのアーティスト検索</Text>
        </View>
        <Switch
          value={locationEnabled}
          onValueChange={setLocationEnabled}
          trackColor={{
            false: DesignTokens.colors.dark.border,
            true: DesignTokens.colors.primary[500],
          }}
          thumbColor={DesignTokens.colors.dark.text.primary}
        />
      </View>
    </View>
  );

  const renderMenu = () => (
    <View style={styles.menuSection}>
      {menuItems.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={styles.menuItem}
          onPress={() => handleMenuPress(item.id)}
        >
          <View style={styles.menuIcon}>
            <Text style={styles.menuIconText}>{item.icon}</Text>
          </View>

          <View style={styles.menuContent}>
            <Text style={styles.menuTitle}>{item.title}</Text>
            <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
          </View>

          <View style={styles.menuChevron}>
            <Text style={styles.menuChevronText}>›</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderProfileHeader()}
        {renderPreferences()}
        {renderSettings()}
        {renderMenu()}

        {/* Logout Button */}
        <View style={styles.logoutSection}>
          <Button
            title="ログアウト"
            onPress={onLogout}
            variant="danger"
            size="large"
            fullWidth
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignTokens.colors.dark.background,
  },
  content: {
    flex: 1,
  },

  // Profile Header
  profileHeader: {
    alignItems: "center",
    paddingHorizontal: DesignTokens.spacing[6],
    paddingVertical: DesignTokens.spacing[8],
    backgroundColor: DesignTokens.colors.dark.surface,
    marginBottom: DesignTokens.spacing[2],
  },
  profileInfo: {
    alignItems: "center",
    marginTop: DesignTokens.spacing[4],
    marginBottom: DesignTokens.spacing[4],
  },
  userName: {
    fontSize: DesignTokens.typography.sizes.xl,
    fontWeight: DesignTokens.typography.weights.bold,
    color: DesignTokens.colors.dark.text.primary,
    marginBottom: DesignTokens.spacing[1],
  },
  userEmail: {
    fontSize: DesignTokens.typography.sizes.md,
    color: DesignTokens.colors.dark.text.secondary,
    marginBottom: DesignTokens.spacing[1],
  },
  userLocation: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.primary[500],
    marginBottom: DesignTokens.spacing[4],
  },
  userStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: DesignTokens.typography.sizes.lg,
    fontWeight: DesignTokens.typography.weights.bold,
    color: DesignTokens.colors.dark.text.primary,
  },
  statLabel: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.dark.text.secondary,
    marginTop: DesignTokens.spacing[1],
  },
  editButton: {
    paddingHorizontal: DesignTokens.spacing[8],
  },

  // Sections
  sectionTitle: {
    fontSize: DesignTokens.typography.sizes.lg,
    fontWeight: DesignTokens.typography.weights.bold,
    color: DesignTokens.colors.dark.text.primary,
    marginBottom: DesignTokens.spacing[4],
  },

  // Preferences
  preferencesSection: {
    paddingHorizontal: DesignTokens.spacing[6],
    paddingVertical: DesignTokens.spacing[6],
    backgroundColor: DesignTokens.colors.dark.surface,
    marginBottom: DesignTokens.spacing[2],
  },
  preferenceItem: {
    marginBottom: DesignTokens.spacing[4],
  },
  preferenceLabel: {
    fontSize: DesignTokens.typography.sizes.md,
    fontWeight: DesignTokens.typography.weights.semibold,
    color: DesignTokens.colors.dark.text.primary,
    marginBottom: DesignTokens.spacing[2],
  },
  preferenceValue: {
    fontSize: DesignTokens.typography.sizes.md,
    color: DesignTokens.colors.dark.text.secondary,
  },
  preferenceTags: {
    flexDirection: "row",
    gap: DesignTokens.spacing[2],
  },
  preferenceTag: {
    marginBottom: 0,
  },

  // Settings
  settingsSection: {
    paddingHorizontal: DesignTokens.spacing[6],
    paddingVertical: DesignTokens.spacing[6],
    backgroundColor: DesignTokens.colors.dark.surface,
    marginBottom: DesignTokens.spacing[2],
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: DesignTokens.spacing[4],
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: DesignTokens.typography.sizes.md,
    fontWeight: DesignTokens.typography.weights.semibold,
    color: DesignTokens.colors.dark.text.primary,
  },
  settingDescription: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.dark.text.secondary,
    marginTop: 2,
  },

  // Menu
  menuSection: {
    backgroundColor: DesignTokens.colors.dark.surface,
    marginBottom: DesignTokens.spacing[2],
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: DesignTokens.spacing[6],
    paddingVertical: DesignTokens.spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: DesignTokens.colors.dark.border,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: DesignTokens.colors.dark.background,
    alignItems: "center",
    justifyContent: "center",
    marginRight: DesignTokens.spacing[4],
  },
  menuIconText: {
    fontSize: 18,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: DesignTokens.typography.sizes.md,
    fontWeight: DesignTokens.typography.weights.semibold,
    color: DesignTokens.colors.dark.text.primary,
  },
  menuSubtitle: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.dark.text.secondary,
    marginTop: 2,
  },
  menuChevron: {
    marginLeft: DesignTokens.spacing[2],
  },
  menuChevronText: {
    fontSize: 20,
    color: DesignTokens.colors.dark.text.tertiary,
  },

  // Logout
  logoutSection: {
    paddingHorizontal: DesignTokens.spacing[6],
    paddingVertical: DesignTokens.spacing[6],
  },

  // Loading & Error States
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: DesignTokens.colors.dark.text.primary,
    fontSize: DesignTokens.typography.sizes.md,
    marginTop: DesignTokens.spacing[4],
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: DesignTokens.spacing[6],
  },
  errorText: {
    color: DesignTokens.colors.danger[500],
    fontSize: DesignTokens.typography.sizes.md,
    textAlign: "center",
  },
});

export default ProfileScreen;
