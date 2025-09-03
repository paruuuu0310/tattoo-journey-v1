import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Share,
} from "react-native";
import { Button, Tag, Avatar, ImageCard, Toast } from "../../components/ui";
import { DesignTokens } from "../../styles/DesignTokens";
import {
  Artist,
  mockArtists,
  mockDesigns,
  Design,
} from "../../../mocks/fixtures";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface ArtistProfileScreenProps {
  route: {
    params: {
      artistId: string;
    };
  };
  onBack?: () => void;
  onContactPress?: (artistId: string) => void;
  onBookingPress?: (artistId: string) => void;
  onDesignPress?: (design: Design) => void;
}

export const ArtistProfileScreen: React.FC<ArtistProfileScreenProps> = ({
  route,
  onBack,
  onContactPress,
  onBookingPress,
  onDesignPress,
}) => {
  const { artistId } = route.params;
  const artist = mockArtists.find((a) => a.id === artistId);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [selectedTab, setSelectedTab] = useState<
    "portfolio" | "reviews" | "schedule"
  >("portfolio");

  if (!artist) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            アーティストが見つかりませんでした
          </Text>
          <Button title="戻る" onPress={onBack} variant="primary" />
        </View>
      </SafeAreaView>
    );
  }

  const artistDesigns = mockDesigns.filter(
    (design) => design.artist.id === artist.id,
  );

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${artist.name}（${artist.studioName || "個人アーティスト"}）のプロフィールをチェック！`,
      });
    } catch (error) {
      setToastMessage("シェアに失敗しました");
      setShowToast(true);
    }
  };

  const handleFollow = () => {
    setToastMessage("フォローしました");
    setShowToast(true);
  };

  const handleContact = () => {
    setToastMessage("メッセージを送信しました");
    setShowToast(true);
    onContactPress?.(artist.id);
  };

  const handleBooking = () => {
    setToastMessage("予約画面に移動します");
    setShowToast(true);
    onBookingPress?.(artist.id);
  };

  // Mock reviews data
  const reviews = [
    {
      id: "1",
      userName: "田中さん",
      avatar: "https://picsum.photos/40/40?random=1",
      rating: 5,
      date: "2024-03-15",
      comment:
        "とても素晴らしいアーティストです。細かい要望にも丁寧に対応していただき、想像以上の仕上がりでした。",
    },
    {
      id: "2",
      userName: "山田さん",
      avatar: "https://picsum.photos/40/40?random=2",
      rating: 4,
      date: "2024-03-10",
      comment:
        "技術力が高く、痛みも最小限に抑えてくれました。また利用したいです。",
    },
  ];

  const renderHeader = () => (
    <View>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
            <Text style={styles.actionIcon}>↗</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Artist Profile */}
      <View style={styles.profileSection}>
        <Avatar
          imageUrl={artist.avatar}
          name={artist.name}
          size="xlarge"
          showBadge={artist.isVerified}
        />

        <View style={styles.profileInfo}>
          <Text style={styles.artistName}>{artist.name}</Text>
          <Text style={styles.studioName}>
            {artist.studioName || "個人アーティスト"}
          </Text>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{artist.rating.toFixed(1)}</Text>
              <Text style={styles.statLabel}>⭐ 評価</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{artist.reviewCount}</Text>
              <Text style={styles.statLabel}>レビュー</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{artist.experienceYears}</Text>
              <Text style={styles.statLabel}>経験年数</Text>
            </View>
          </View>

          {/* Specialties */}
          <View style={styles.specialtiesContainer}>
            <Text style={styles.specialtiesTitle}>専門スタイル</Text>
            <View style={styles.specialtyTags}>
              {artist.specialties.map((specialty, index) => (
                <Tag
                  key={index}
                  label={specialty}
                  variant="accent"
                  size="small"
                  style={styles.specialtyTag}
                />
              ))}
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            title="フォロー"
            onPress={handleFollow}
            variant="secondary"
            size="large"
            style={styles.followButton}
          />
          <Button
            title="メッセージ"
            onPress={handleContact}
            variant="ghost"
            size="large"
            style={styles.messageButton}
          />
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        <TouchableOpacity
          style={[
            styles.tabButton,
            selectedTab === "portfolio" && styles.tabButtonActive,
          ]}
          onPress={() => setSelectedTab("portfolio")}
        >
          <Text
            style={[
              styles.tabButtonText,
              selectedTab === "portfolio" && styles.tabButtonTextActive,
            ]}
          >
            ポートフォリオ
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            selectedTab === "reviews" && styles.tabButtonActive,
          ]}
          onPress={() => setSelectedTab("reviews")}
        >
          <Text
            style={[
              styles.tabButtonText,
              selectedTab === "reviews" && styles.tabButtonTextActive,
            ]}
          >
            レビュー
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            selectedTab === "schedule" && styles.tabButtonActive,
          ]}
          onPress={() => setSelectedTab("schedule")}
        >
          <Text
            style={[
              styles.tabButtonText,
              selectedTab === "schedule" && styles.tabButtonTextActive,
            ]}
          >
            予約状況
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderPortfolio = () => (
    <View style={styles.portfolioSection}>
      <View style={styles.portfolioHeader}>
        <Text style={styles.sectionTitle}>
          作品集 ({artistDesigns.length}点)
        </Text>
      </View>

      <FlatList
        data={artistDesigns}
        renderItem={({ item }) => (
          <ImageCard
            imageUrl={item.imageUrl}
            title={item.title}
            subtitle={item.style}
            price={item.priceRange}
            tags={item.tags}
            likes={item.likes}
            isLiked={item.isLiked}
            onPress={() => onDesignPress?.(item)}
            width={(SCREEN_WIDTH - DesignTokens.spacing[4] * 3) / 2}
            aspectRatio={4 / 5}
          />
        )}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.portfolioRow}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
      />
    </View>
  );

  const renderReviews = () => (
    <View style={styles.reviewsSection}>
      <View style={styles.reviewsHeader}>
        <Text style={styles.sectionTitle}>レビュー ({reviews.length}件)</Text>
        <View style={styles.ratingOverview}>
          <Text style={styles.overallRating}>{artist.rating.toFixed(1)}</Text>
          <Text style={styles.ratingStars}>⭐⭐⭐⭐⭐</Text>
        </View>
      </View>

      {reviews.map((review) => (
        <View key={review.id} style={styles.reviewCard}>
          <View style={styles.reviewHeader}>
            <Avatar
              imageUrl={review.avatar}
              name={review.userName}
              size="small"
            />
            <View style={styles.reviewInfo}>
              <Text style={styles.reviewerName}>{review.userName}</Text>
              <View style={styles.reviewMeta}>
                <Text style={styles.reviewRating}>
                  {"⭐".repeat(review.rating)}
                </Text>
                <Text style={styles.reviewDate}>{review.date}</Text>
              </View>
            </View>
          </View>
          <Text style={styles.reviewComment}>{review.comment}</Text>
        </View>
      ))}
    </View>
  );

  const renderSchedule = () => (
    <View style={styles.scheduleSection}>
      <Text style={styles.sectionTitle}>予約可能日時</Text>

      <View style={styles.scheduleCard}>
        <View style={styles.scheduleHeader}>
          <Text style={styles.scheduleMonth}>2024年4月</Text>
          <TouchableOpacity>
            <Text style={styles.scheduleNavigation}>‹ › </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.calendarGrid}>
          {["月", "火", "水", "木", "金", "土", "日"].map((day) => (
            <Text key={day} style={styles.calendarDay}>
              {day}
            </Text>
          ))}

          {Array.from({ length: 30 }, (_, i) => i + 1).map((date) => (
            <TouchableOpacity
              key={date}
              style={[
                styles.calendarDate,
                date % 7 === 0 && styles.calendarDateBooked,
                date % 5 === 0 && styles.calendarDateAvailable,
              ]}
            >
              <Text
                style={[
                  styles.calendarDateText,
                  date % 5 === 0 && styles.calendarDateTextAvailable,
                ]}
              >
                {date}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.calendarLegend}>
          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendColor,
                { backgroundColor: DesignTokens.colors.accent.neon },
              ]}
            />
            <Text style={styles.legendText}>空き</Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendColor,
                { backgroundColor: DesignTokens.colors.dark.text.tertiary },
              ]}
            />
            <Text style={styles.legendText}>予約済み</Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderTabContent = () => {
    switch (selectedTab) {
      case "portfolio":
        return renderPortfolio();
      case "reviews":
        return renderReviews();
      case "schedule":
        return renderSchedule();
      default:
        return renderPortfolio();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {renderHeader()}
        {renderTabContent()}
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <Button
          title="予約する"
          onPress={handleBooking}
          variant="primary"
          size="large"
          fullWidth
        />
      </View>

      {/* Toast */}
      <Toast
        message={toastMessage}
        visible={showToast}
        onHide={() => setShowToast(false)}
        type="success"
        position="bottom"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignTokens.colors.dark.background,
  },
  scrollView: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: DesignTokens.spacing[6],
  },
  errorText: {
    fontSize: DesignTokens.typography.sizes.lg,
    color: DesignTokens.colors.dark.text.primary,
    marginBottom: DesignTokens.spacing[6],
    textAlign: "center",
  },

  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: DesignTokens.spacing[4],
    paddingVertical: DesignTokens.spacing[4],
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: DesignTokens.colors.dark.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: {
    fontSize: 20,
    color: DesignTokens.colors.dark.text.primary,
    fontWeight: DesignTokens.typography.weights.bold,
  },
  headerActions: {
    flexDirection: "row",
    gap: DesignTokens.spacing[3],
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: DesignTokens.colors.dark.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  actionIcon: {
    fontSize: 18,
    color: DesignTokens.colors.dark.text.primary,
  },

  // Profile Section
  profileSection: {
    paddingHorizontal: DesignTokens.spacing[6],
    paddingVertical: DesignTokens.spacing[4],
    alignItems: "center",
  },
  profileInfo: {
    alignItems: "center",
    marginTop: DesignTokens.spacing[4],
    width: "100%",
  },
  artistName: {
    fontSize: DesignTokens.typography.sizes["2xl"],
    fontWeight: DesignTokens.typography.weights.bold,
    color: DesignTokens.colors.dark.text.primary,
    marginBottom: DesignTokens.spacing[1],
  },
  studioName: {
    fontSize: DesignTokens.typography.sizes.md,
    color: DesignTokens.colors.primary[500],
    marginBottom: DesignTokens.spacing[4],
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    paddingVertical: DesignTokens.spacing[4],
    backgroundColor: DesignTokens.colors.dark.surface,
    borderRadius: DesignTokens.radius.xl,
    marginBottom: DesignTokens.spacing[4],
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: DesignTokens.typography.sizes.xl,
    fontWeight: DesignTokens.typography.weights.bold,
    color: DesignTokens.colors.dark.text.primary,
  },
  statLabel: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.dark.text.secondary,
    marginTop: DesignTokens.spacing[1],
  },
  specialtiesContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: DesignTokens.spacing[4],
  },
  specialtiesTitle: {
    fontSize: DesignTokens.typography.sizes.md,
    fontWeight: DesignTokens.typography.weights.semibold,
    color: DesignTokens.colors.dark.text.primary,
    marginBottom: DesignTokens.spacing[3],
  },
  specialtyTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: DesignTokens.spacing[2],
  },
  specialtyTag: {
    marginBottom: DesignTokens.spacing[2],
  },
  actionButtons: {
    flexDirection: "row",
    width: "100%",
    gap: DesignTokens.spacing[3],
    marginTop: DesignTokens.spacing[4],
  },
  followButton: {
    flex: 1,
  },
  messageButton: {
    flex: 1,
  },

  // Tab Navigation
  tabNavigation: {
    flexDirection: "row",
    marginTop: DesignTokens.spacing[4],
    marginHorizontal: DesignTokens.spacing[6],
    backgroundColor: DesignTokens.colors.dark.surface,
    borderRadius: DesignTokens.radius.xl,
    padding: DesignTokens.spacing[1],
  },
  tabButton: {
    flex: 1,
    paddingVertical: DesignTokens.spacing[3],
    borderRadius: DesignTokens.radius.lg,
    alignItems: "center",
  },
  tabButtonActive: {
    backgroundColor: DesignTokens.colors.primary[500],
  },
  tabButtonText: {
    fontSize: DesignTokens.typography.sizes.sm,
    fontWeight: DesignTokens.typography.weights.medium,
    color: DesignTokens.colors.dark.text.secondary,
  },
  tabButtonTextActive: {
    color: DesignTokens.colors.dark.text.primary,
    fontWeight: DesignTokens.typography.weights.semibold,
  },

  // Section Title
  sectionTitle: {
    fontSize: DesignTokens.typography.sizes.lg,
    fontWeight: DesignTokens.typography.weights.bold,
    color: DesignTokens.colors.dark.text.primary,
    marginBottom: DesignTokens.spacing[4],
  },

  // Portfolio Section
  portfolioSection: {
    paddingHorizontal: DesignTokens.spacing[6],
    paddingTop: DesignTokens.spacing[6],
  },
  portfolioHeader: {
    marginBottom: DesignTokens.spacing[4],
  },
  portfolioRow: {
    justifyContent: "space-between",
    marginBottom: DesignTokens.spacing[4],
  },

  // Reviews Section
  reviewsSection: {
    paddingHorizontal: DesignTokens.spacing[6],
    paddingTop: DesignTokens.spacing[6],
  },
  reviewsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: DesignTokens.spacing[4],
  },
  ratingOverview: {
    alignItems: "center",
  },
  overallRating: {
    fontSize: DesignTokens.typography.sizes.xl,
    fontWeight: DesignTokens.typography.weights.bold,
    color: DesignTokens.colors.accent.gold,
  },
  ratingStars: {
    fontSize: DesignTokens.typography.sizes.sm,
  },
  reviewCard: {
    backgroundColor: DesignTokens.colors.dark.surface,
    borderRadius: DesignTokens.radius.xl,
    padding: DesignTokens.spacing[4],
    marginBottom: DesignTokens.spacing[4],
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: DesignTokens.spacing[3],
  },
  reviewInfo: {
    marginLeft: DesignTokens.spacing[3],
    flex: 1,
  },
  reviewerName: {
    fontSize: DesignTokens.typography.sizes.md,
    fontWeight: DesignTokens.typography.weights.semibold,
    color: DesignTokens.colors.dark.text.primary,
  },
  reviewMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignTokens.spacing[2],
    marginTop: DesignTokens.spacing[1],
  },
  reviewRating: {
    fontSize: DesignTokens.typography.sizes.sm,
  },
  reviewDate: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.dark.text.secondary,
  },
  reviewComment: {
    fontSize: DesignTokens.typography.sizes.md,
    color: DesignTokens.colors.dark.text.primary,
    lineHeight: 22,
  },

  // Schedule Section
  scheduleSection: {
    paddingHorizontal: DesignTokens.spacing[6],
    paddingTop: DesignTokens.spacing[6],
  },
  scheduleCard: {
    backgroundColor: DesignTokens.colors.dark.surface,
    borderRadius: DesignTokens.radius.xl,
    padding: DesignTokens.spacing[5],
  },
  scheduleHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: DesignTokens.spacing[4],
  },
  scheduleMonth: {
    fontSize: DesignTokens.typography.sizes.lg,
    fontWeight: DesignTokens.typography.weights.bold,
    color: DesignTokens.colors.dark.text.primary,
  },
  scheduleNavigation: {
    fontSize: 24,
    color: DesignTokens.colors.primary[500],
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  calendarDay: {
    width: `${100 / 7}%`,
    textAlign: "center",
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.dark.text.secondary,
    paddingVertical: DesignTokens.spacing[2],
    fontWeight: DesignTokens.typography.weights.semibold,
  },
  calendarDate: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: DesignTokens.spacing[1],
  },
  calendarDateAvailable: {
    backgroundColor: DesignTokens.colors.accent.neon + "20",
    borderRadius: DesignTokens.radius.md,
  },
  calendarDateBooked: {
    backgroundColor: DesignTokens.colors.dark.text.tertiary + "20",
    borderRadius: DesignTokens.radius.md,
  },
  calendarDateText: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.dark.text.primary,
    fontWeight: DesignTokens.typography.weights.medium,
  },
  calendarDateTextAvailable: {
    color: DesignTokens.colors.accent.neon,
    fontWeight: DesignTokens.typography.weights.bold,
  },
  calendarLegend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: DesignTokens.spacing[6],
    marginTop: DesignTokens.spacing[4],
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignTokens.spacing[2],
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.dark.text.secondary,
  },

  // Bottom Actions
  bottomActions: {
    paddingHorizontal: DesignTokens.spacing[6],
    paddingVertical: DesignTokens.spacing[4],
    backgroundColor: DesignTokens.colors.dark.surface,
    borderTopWidth: 1,
    borderTopColor: DesignTokens.colors.dark.border,
  },
});

export default ArtistProfileScreen;
