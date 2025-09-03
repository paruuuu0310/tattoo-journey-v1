import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
} from "react-native";
import { ImageCard, Button, Tag, Avatar } from "../../components/ui";
import { DesignTokens } from "../../styles/DesignTokens";
import {
  mockDesigns,
  mockArtists,
  currentUser,
  Design,
} from "../../../mocks/fixtures";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_WIDTH = (SCREEN_WIDTH - DesignTokens.spacing[4] * 3) / 2;

interface HomeScreenProps {
  onDesignPress?: (design: Design) => void;
  onArtistPress?: (artistId: string) => void;
  onSearchPress?: () => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({
  onDesignPress,
  onArtistPress,
  onSearchPress,
}) => {
  const [designs, setDesigns] = useState<Design[]>(mockDesigns);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("すべて");

  const categories = [
    "すべて",
    "ミニマル",
    "リアリズム",
    "ジャパニーズ",
    "幾何学",
  ];

  const handleRefresh = () => {
    setRefreshing(true);
    // Mock refresh delay
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleLike = (designId: string) => {
    setDesigns((prev) =>
      prev.map((design) =>
        design.id === designId
          ? {
              ...design,
              isLiked: !design.isLiked,
              likes: design.isLiked ? design.likes - 1 : design.likes + 1,
            }
          : design,
      ),
    );
  };

  const filteredDesigns = designs.filter(
    (design) =>
      selectedCategory === "すべて" || design.style === selectedCategory,
  );

  const renderDesignItem = ({ item }: { item: Design }) => (
    <ImageCard
      imageUrl={item.imageUrl}
      title={item.title}
      subtitle={item.artist.name}
      price={item.priceRange}
      tags={item.tags}
      likes={item.likes}
      isLiked={item.isLiked}
      onPress={() => onDesignPress?.(item)}
      onLike={() => handleLike(item.id)}
      width={CARD_WIDTH}
      aspectRatio={4 / 5}
    />
  );

  const renderHeader = () => (
    <View>
      {/* Greeting Section */}
      <View style={styles.greetingSection}>
        <View style={styles.greetingContent}>
          <Avatar
            imageUrl={currentUser.avatar}
            name={currentUser.name}
            size="large"
          />
          <View style={styles.greetingText}>
            <Text style={styles.greeting}>おはよう</Text>
            <Text style={styles.userName}>{currentUser.name}さん</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.notificationButton} onPress={() => {}}>
          <Text style={styles.notificationIcon}>🔔</Text>
          <View style={styles.notificationBadge}>
            <Text style={styles.badgeText}>3</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActionsSection}>
        <Text style={styles.sectionTitle}>クイックアクション</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.actionCard} onPress={onSearchPress}>
            <View style={styles.actionIcon}>
              <Text style={styles.actionEmoji}>🔍</Text>
            </View>
            <Text style={styles.actionLabel}>デザイン検索</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <View style={styles.actionIcon}>
              <Text style={styles.actionEmoji}>💬</Text>
            </View>
            <Text style={styles.actionLabel}>チャット</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <View style={styles.actionIcon}>
              <Text style={styles.actionEmoji}>📅</Text>
            </View>
            <Text style={styles.actionLabel}>予約確認</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <View style={styles.actionIcon}>
              <Text style={styles.actionEmoji}>❤️</Text>
            </View>
            <Text style={styles.actionLabel}>お気に入り</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Featured Artists */}
      <View style={styles.artistsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>注目のアーティスト</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>すべて見る</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.artistsList}
        >
          {mockArtists.map((artist) => (
            <TouchableOpacity
              key={artist.id}
              style={styles.artistCard}
              onPress={() => onArtistPress?.(artist.id)}
            >
              <Avatar
                imageUrl={artist.avatar}
                name={artist.name}
                size="large"
                showBadge={artist.isVerified}
              />
              <Text style={styles.artistName}>{artist.name}</Text>
              <Text style={styles.artistRating}>
                ⭐ {artist.rating.toFixed(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Category Filter */}
      <View style={styles.categorySection}>
        <Text style={styles.sectionTitle}>人気のデザイン</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryList}
        >
          {categories.map((category) => (
            <Tag
              key={category}
              label={category}
              selected={selectedCategory === category}
              onPress={() => setSelectedCategory(category)}
              variant={selectedCategory === category ? "accent" : "default"}
              size="medium"
              style={styles.categoryTag}
            />
          ))}
        </ScrollView>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={filteredDesigns}
        renderItem={renderDesignItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={DesignTokens.colors.primary[500]}
          />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignTokens.colors.dark.background,
  },
  content: {
    paddingBottom: DesignTokens.spacing[6],
  },
  row: {
    justifyContent: "space-between",
    paddingHorizontal: DesignTokens.spacing[4],
    marginBottom: DesignTokens.spacing[4],
  },

  // Greeting Section
  greetingSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: DesignTokens.spacing[6],
    paddingVertical: DesignTokens.spacing[6],
  },
  greetingContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  greetingText: {
    marginLeft: DesignTokens.spacing[4],
  },
  greeting: {
    fontSize: DesignTokens.typography.sizes.md,
    color: DesignTokens.colors.dark.text.secondary,
    fontWeight: DesignTokens.typography.weights.medium,
  },
  userName: {
    fontSize: DesignTokens.typography.sizes.xl,
    color: DesignTokens.colors.dark.text.primary,
    fontWeight: DesignTokens.typography.weights.bold,
  },
  notificationButton: {
    position: "relative",
    padding: DesignTokens.spacing[2],
  },
  notificationIcon: {
    fontSize: 24,
  },
  notificationBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: DesignTokens.colors.primary[500],
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 10,
    color: DesignTokens.colors.dark.text.primary,
    fontWeight: DesignTokens.typography.weights.bold,
  },

  // Quick Actions
  quickActionsSection: {
    paddingHorizontal: DesignTokens.spacing[6],
    marginBottom: DesignTokens.spacing[8],
  },
  sectionTitle: {
    fontSize: DesignTokens.typography.sizes.lg,
    fontWeight: DesignTokens.typography.weights.bold,
    color: DesignTokens.colors.dark.text.primary,
    marginBottom: DesignTokens.spacing[4],
  },
  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionCard: {
    flex: 1,
    alignItems: "center",
    backgroundColor: DesignTokens.colors.dark.surface,
    borderRadius: DesignTokens.radius.xl,
    padding: DesignTokens.spacing[4],
    marginHorizontal: DesignTokens.spacing[1],
    ...DesignTokens.shadows.sm,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: DesignTokens.colors.primary[500] + "20",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: DesignTokens.spacing[2],
  },
  actionEmoji: {
    fontSize: 24,
  },
  actionLabel: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.dark.text.primary,
    fontWeight: DesignTokens.typography.weights.medium,
    textAlign: "center",
  },

  // Artists Section
  artistsSection: {
    paddingLeft: DesignTokens.spacing[6],
    marginBottom: DesignTokens.spacing[8],
  },
  sectionHeader: {
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
  artistsList: {
    paddingLeft: 0,
  },
  artistCard: {
    alignItems: "center",
    marginRight: DesignTokens.spacing[5],
    width: 80,
  },
  artistName: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.dark.text.primary,
    fontWeight: DesignTokens.typography.weights.medium,
    marginTop: DesignTokens.spacing[2],
    textAlign: "center",
  },
  artistRating: {
    fontSize: DesignTokens.typography.sizes.xs,
    color: DesignTokens.colors.dark.text.secondary,
    marginTop: DesignTokens.spacing[1],
  },

  // Category Section
  categorySection: {
    paddingLeft: DesignTokens.spacing[6],
    marginBottom: DesignTokens.spacing[6],
  },
  categoryList: {
    paddingLeft: 0,
  },
  categoryTag: {
    marginRight: DesignTokens.spacing[3],
  },
});

export default HomeScreen;
