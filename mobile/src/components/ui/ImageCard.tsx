import React from "react";
import { View, Image, Text, TouchableOpacity, StyleSheet } from "react-native";
import { DesignTokens } from "../../styles/DesignTokens";

interface ImageCardProps {
  imageUrl: string;
  title?: string;
  subtitle?: string;
  price?: string;
  tags?: string[];
  likes?: number;
  isLiked?: boolean;
  onPress?: () => void;
  onLike?: () => void;
  width?: number;
  aspectRatio?: number;
  showOverlay?: boolean;
}

export const ImageCard: React.FC<ImageCardProps> = ({
  imageUrl,
  title,
  subtitle,
  price,
  tags = [],
  likes,
  isLiked = false,
  onPress,
  onLike,
  width,
  showOverlay = true,
}) => {
  const cardStyle = [styles.container, width && { width }];

  const renderOverlay = () => {
    if (!showOverlay || (!title && !subtitle && !price && likes === undefined))
      return null;

    return (
      <View style={styles.overlay}>
        <View style={styles.overlayContent}>
          {title && <Text style={styles.title}>{title}</Text>}
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          {price && <Text style={styles.price}>{price}</Text>}
        </View>

        {(likes !== undefined || onLike) && (
          <TouchableOpacity
            style={styles.likeButton}
            onPress={onLike}
            disabled={!onLike}
          >
            <Text style={[styles.heartIcon, isLiked && styles.heartLiked]}>
              {isLiked ? "❤️" : "🤍"}
            </Text>
            {likes !== undefined && (
              <Text style={styles.likeCount}>{likes}</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderTags = () => {
    if (tags.length === 0) return null;

    return (
      <View style={styles.tagsContainer}>
        {tags.slice(0, 3).map((tag, index) => (
          <View key={index} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
          </View>
        ))}
        {tags.length > 3 && (
          <View style={styles.tag}>
            <Text style={styles.tagText}>+{tags.length - 3}</Text>
          </View>
        )}
      </View>
    );
  };

  const CardComponent = onPress ? TouchableOpacity : View;

  return (
    <CardComponent
      style={cardStyle}
      onPress={onPress}
      activeOpacity={onPress ? 0.9 : 1}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
        {renderOverlay()}
      </View>
      {renderTags()}
    </CardComponent>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: DesignTokens.radius.xl,
    backgroundColor: DesignTokens.colors.dark.surface,
    overflow: "hidden",
    marginBottom: DesignTokens.spacing[2],
  },
  imageContainer: {
    position: "relative",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    backgroundColor: DesignTokens.colors.dark.elevated,
  },
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    padding: DesignTokens.spacing[3],
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  overlayContent: {
    flex: 1,
  },
  title: {
    fontSize: DesignTokens.typography.sizes.md,
    fontWeight: "600" as const,
    color: DesignTokens.colors.dark.text.primary,
    marginBottom: DesignTokens.spacing[1],
  },
  subtitle: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.dark.text.secondary,
    marginBottom: DesignTokens.spacing[1],
  },
  price: {
    fontSize: DesignTokens.typography.sizes.sm,
    fontWeight: "600" as const,
    color: DesignTokens.colors.accent.gold,
  },
  likeButton: {
    alignItems: "center",
    minWidth: 30,
  },
  heartIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  heartLiked: {
    transform: [{ scale: 1.1 }],
  },
  likeCount: {
    fontSize: DesignTokens.typography.sizes.xs,
    color: DesignTokens.colors.dark.text.secondary,
    fontWeight: "500" as const,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: DesignTokens.spacing[3],
    gap: DesignTokens.spacing[2],
  },
  tag: {
    backgroundColor: DesignTokens.colors.dark.elevated,
    borderRadius: DesignTokens.radius.full,
    paddingHorizontal: DesignTokens.spacing[2],
    paddingVertical: DesignTokens.spacing[1],
  },
  tagText: {
    fontSize: DesignTokens.typography.sizes.xs,
    color: DesignTokens.colors.dark.text.tertiary,
    fontWeight: "500" as const,
  },
});
