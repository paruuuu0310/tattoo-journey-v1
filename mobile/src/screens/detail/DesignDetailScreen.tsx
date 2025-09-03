import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  Share,
} from "react-native";
import { Button, Tag, Avatar, Toast } from "../../components/ui";
import { DesignTokens } from "../../styles/DesignTokens";
import { Design, mockDesigns } from "../../../mocks/fixtures";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface DesignDetailScreenProps {
  route: {
    params: {
      designId: string;
    };
  };
  onBack?: () => void;
  onArtistPress?: (artistId: string) => void;
  onContactPress?: (artistId: string) => void;
  onSimilarDesignPress?: (design: Design) => void;
}

export const DesignDetailScreen: React.FC<DesignDetailScreenProps> = ({
  route,
  onBack,
  onArtistPress,
  onContactPress,
  onSimilarDesignPress,
}) => {
  const { designId } = route.params;
  const design = mockDesigns.find((d) => d.id === designId);
  const [isLiked, setIsLiked] = useState(design?.isLiked || false);
  const [likes, setLikes] = useState(design?.likes || 0);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  if (!design) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>デザインが見つかりませんでした</Text>
          <Button title="戻る" onPress={onBack} variant="primary" />
        </View>
      </SafeAreaView>
    );
  }

  const similarDesigns = mockDesigns
    .filter(
      (d) =>
        d.id !== design.id &&
        (d.style === design.style || d.artist.id === design.artist.id),
    )
    .slice(0, 4);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikes((prev) => (isLiked ? prev - 1 : prev + 1));
    setToastMessage(
      isLiked ? "お気に入りから削除しました" : "お気に入りに追加しました",
    );
    setShowToast(true);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${design.title} - ${design.artist.name}のタトゥーデザインをチェック！`,
        url: design.imageUrl,
      });
    } catch (error) {
      setToastMessage("シェアに失敗しました");
      setShowToast(true);
    }
  };

  const handleContact = () => {
    setToastMessage("アーティストにメッセージを送信しました");
    setShowToast(true);
    onContactPress?.(design.artist.id);
  };

  const handleSave = () => {
    setToastMessage("コレクションに保存しました");
    setShowToast(true);
  };

  const renderPriceInfo = () => (
    <View style={styles.priceSection}>
      <Text style={styles.sectionTitle}>料金情報</Text>
      <View style={styles.priceCard}>
        <View style={styles.priceHeader}>
          <Text style={styles.priceRange}>{design.priceRange}</Text>
          <Tag label={design.size} variant="success" size="small" />
        </View>

        <View style={styles.priceDetails}>
          <View style={styles.priceItem}>
            <Text style={styles.priceLabel}>サイズ</Text>
            <Text style={styles.priceValue}>{design.size}</Text>
          </View>
          <View style={styles.priceItem}>
            <Text style={styles.priceLabel}>所要時間</Text>
            <Text style={styles.priceValue}>3-5時間 (目安)</Text>
          </View>
          <View style={styles.priceItem}>
            <Text style={styles.priceLabel}>スタイル</Text>
            <Text style={styles.priceValue}>{design.style}</Text>
          </View>
        </View>

        <Text style={styles.priceNote}>
          ※ 最終的な料金は、サイズや詳細デザインにより変動する場合があります
        </Text>
      </View>
    </View>
  );

  const renderArtistInfo = () => (
    <View style={styles.artistSection}>
      <Text style={styles.sectionTitle}>アーティスト</Text>
      <TouchableOpacity
        style={styles.artistCard}
        onPress={() => onArtistPress?.(design.artist.id)}
      >
        <Avatar
          imageUrl={design.artist.avatar}
          name={design.artist.name}
          size="large"
          showBadge={design.artist.isVerified}
        />
        <View style={styles.artistInfo}>
          <Text style={styles.artistName}>{design.artist.name}</Text>
          <Text style={styles.studioName}>
            {design.artist.studioName || "個人アーティスト"}
          </Text>
          <View style={styles.artistStats}>
            <Text style={styles.rating}>
              ⭐ {design.artist.rating.toFixed(1)}
            </Text>
            <Text style={styles.reviews}>({design.artist.reviewCount}件)</Text>
            <Text style={styles.experience}>
              {design.artist.experienceYears}年の経験
            </Text>
          </View>
        </View>
        <View style={styles.chevron}>
          <Text style={styles.chevronText}>›</Text>
        </View>
      </TouchableOpacity>
    </View>
  );

  const renderSimilarDesigns = () => {
    if (similarDesigns.length === 0) return null;

    return (
      <View style={styles.similarSection}>
        <View style={styles.similarHeader}>
          <Text style={styles.sectionTitle}>関連デザイン</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>すべて見る</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.similarScroll}
        >
          {similarDesigns.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.similarItem}
              onPress={() => onSimilarDesignPress?.(item)}
            >
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.similarImage}
              />
              <Text style={styles.similarTitle}>{item.title}</Text>
              <Text style={styles.similarPrice}>{item.priceRange}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>

          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
              <Text style={styles.actionIcon}>↗</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
              <Text style={[styles.actionIcon, isLiked && styles.likedIcon]}>
                {isLiked ? "❤️" : "🤍"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: design.imageUrl }} style={styles.mainImage} />
          <View style={styles.imageOverlay}>
            <View style={styles.likeCount}>
              <Text style={styles.likeCountText}>{likes}</Text>
            </View>
          </View>
        </View>

        {/* Design Info */}
        <View style={styles.designInfo}>
          <Text style={styles.designTitle}>{design.title}</Text>
          <Text style={styles.designStyle}>{design.style}</Text>

          {/* Tags */}
          <View style={styles.tagsContainer}>
            {design.tags.map((tag, index) => (
              <Tag
                key={index}
                label={tag}
                variant="default"
                size="small"
                style={styles.tag}
              />
            ))}
          </View>
        </View>

        {/* Price Information */}
        {renderPriceInfo()}

        {/* Artist Information */}
        {renderArtistInfo()}

        {/* Similar Designs */}
        {renderSimilarDesigns()}
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <Button
          title="保存"
          onPress={handleSave}
          variant="secondary"
          size="large"
          style={styles.saveButton}
        />
        <Button
          title="相談する"
          onPress={handleContact}
          variant="primary"
          size="large"
          style={styles.contactButton}
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
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    backgroundColor: "rgba(26, 26, 26, 0.8)",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  backIcon: {
    fontSize: 20,
    color: DesignTokens.colors.dark.background,
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
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  actionIcon: {
    fontSize: 18,
    color: DesignTokens.colors.dark.background,
  },
  likedIcon: {
    transform: [{ scale: 1.2 }],
  },

  // Main Image
  imageContainer: {
    position: "relative",
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 1.2,
  },
  mainImage: {
    width: "100%",
    height: "100%",
    backgroundColor: DesignTokens.colors.dark.surface,
  },
  imageOverlay: {
    position: "absolute",
    bottom: DesignTokens.spacing[4],
    right: DesignTokens.spacing[4],
  },
  likeCount: {
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    borderRadius: DesignTokens.radius.full,
    paddingHorizontal: DesignTokens.spacing[3],
    paddingVertical: DesignTokens.spacing[2],
  },
  likeCountText: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.dark.text.primary,
    fontWeight: DesignTokens.typography.weights.semibold,
  },

  // Design Info
  designInfo: {
    padding: DesignTokens.spacing[6],
  },
  designTitle: {
    fontSize: DesignTokens.typography.sizes["3xl"],
    fontWeight: DesignTokens.typography.weights.bold,
    color: DesignTokens.colors.dark.text.primary,
    marginBottom: DesignTokens.spacing[2],
  },
  designStyle: {
    fontSize: DesignTokens.typography.sizes.lg,
    color: DesignTokens.colors.primary[500],
    fontWeight: DesignTokens.typography.weights.semibold,
    marginBottom: DesignTokens.spacing[4],
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: DesignTokens.spacing[2],
  },
  tag: {
    marginBottom: DesignTokens.spacing[2],
  },

  // Sections
  sectionTitle: {
    fontSize: DesignTokens.typography.sizes.lg,
    fontWeight: DesignTokens.typography.weights.bold,
    color: DesignTokens.colors.dark.text.primary,
    marginBottom: DesignTokens.spacing[4],
  },

  // Price Section
  priceSection: {
    paddingHorizontal: DesignTokens.spacing[6],
    marginBottom: DesignTokens.spacing[8],
  },
  priceCard: {
    backgroundColor: DesignTokens.colors.dark.surface,
    borderRadius: DesignTokens.radius.xl,
    padding: DesignTokens.spacing[5],
  },
  priceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: DesignTokens.spacing[4],
  },
  priceRange: {
    fontSize: DesignTokens.typography.sizes.xl,
    fontWeight: DesignTokens.typography.weights.bold,
    color: DesignTokens.colors.accent.gold,
  },
  priceDetails: {
    gap: DesignTokens.spacing[3],
    marginBottom: DesignTokens.spacing[4],
  },
  priceItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  priceLabel: {
    fontSize: DesignTokens.typography.sizes.md,
    color: DesignTokens.colors.dark.text.secondary,
  },
  priceValue: {
    fontSize: DesignTokens.typography.sizes.md,
    color: DesignTokens.colors.dark.text.primary,
    fontWeight: DesignTokens.typography.weights.semibold,
  },
  priceNote: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.dark.text.tertiary,
    lineHeight: 18,
    fontStyle: "italic",
  },

  // Artist Section
  artistSection: {
    paddingHorizontal: DesignTokens.spacing[6],
    marginBottom: DesignTokens.spacing[8],
  },
  artistCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: DesignTokens.colors.dark.surface,
    borderRadius: DesignTokens.radius.xl,
    padding: DesignTokens.spacing[5],
  },
  artistInfo: {
    flex: 1,
    marginLeft: DesignTokens.spacing[4],
  },
  artistName: {
    fontSize: DesignTokens.typography.sizes.lg,
    fontWeight: DesignTokens.typography.weights.bold,
    color: DesignTokens.colors.dark.text.primary,
    marginBottom: DesignTokens.spacing[1],
  },
  studioName: {
    fontSize: DesignTokens.typography.sizes.md,
    color: DesignTokens.colors.primary[500],
    marginBottom: DesignTokens.spacing[2],
  },
  artistStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: DesignTokens.spacing[3],
  },
  rating: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.accent.gold,
    fontWeight: DesignTokens.typography.weights.semibold,
  },
  reviews: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.dark.text.secondary,
  },
  experience: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.dark.text.secondary,
  },
  chevron: {
    marginLeft: DesignTokens.spacing[2],
  },
  chevronText: {
    fontSize: 24,
    color: DesignTokens.colors.dark.text.tertiary,
  },

  // Similar Section
  similarSection: {
    paddingLeft: DesignTokens.spacing[6],
    marginBottom: DesignTokens.spacing[8],
  },
  similarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingRight: DesignTokens.spacing[6],
    marginBottom: DesignTokens.spacing[4],
  },
  seeAllText: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.primary[500],
    fontWeight: DesignTokens.typography.weights.medium,
  },
  similarScroll: {
    paddingLeft: 0,
  },
  similarItem: {
    width: 120,
    marginRight: DesignTokens.spacing[4],
  },
  similarImage: {
    width: "100%",
    height: 150,
    borderRadius: DesignTokens.radius.lg,
    backgroundColor: DesignTokens.colors.dark.surface,
    marginBottom: DesignTokens.spacing[2],
  },
  similarTitle: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.dark.text.primary,
    fontWeight: DesignTokens.typography.weights.medium,
    marginBottom: DesignTokens.spacing[1],
  },
  similarPrice: {
    fontSize: DesignTokens.typography.sizes.xs,
    color: DesignTokens.colors.dark.text.secondary,
  },

  // Bottom Actions
  bottomActions: {
    flexDirection: "row",
    paddingHorizontal: DesignTokens.spacing[6],
    paddingVertical: DesignTokens.spacing[4],
    backgroundColor: DesignTokens.colors.dark.surface,
    borderTopWidth: 1,
    borderTopColor: DesignTokens.colors.dark.border,
    gap: DesignTokens.spacing[3],
  },
  saveButton: {
    flex: 1,
  },
  contactButton: {
    flex: 2,
  },
});

export default DesignDetailScreen;
