import React from "react";
import {
  View,
  Image,
  Text,
  StyleSheet,
  ViewStyle,
  ImageStyle,
} from "react-native";
import { DesignTokens } from "../../styles/DesignTokens";

interface AvatarProps {
  imageUrl?: string;
  name?: string;
  size?: "small" | "medium" | "large" | "xlarge";
  showBadge?: boolean;
  badgeColor?: string;
  style?: ViewStyle;
}

export const Avatar: React.FC<AvatarProps> = ({
  imageUrl,
  name = "",
  size = "medium",
  showBadge = false,
  badgeColor = DesignTokens.colors.success,
  style,
}) => {
  const sizeConfig = {
    small: { size: 32, fontSize: 12 },
    medium: { size: 40, fontSize: 14 },
    large: { size: 56, fontSize: 18 },
    xlarge: { size: 80, fontSize: 24 },
  };

  const config = sizeConfig[size];
  const avatarSize = {
    width: config.size,
    height: config.size,
    borderRadius: config.size / 2,
  };

  const getInitials = (name: string): string => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (
      parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  };

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.avatar,
          {
            width: config.size,
            height: config.size,
            borderRadius: config.size / 2,
          },
          styles.imagePlaceholder,
        ]}
      >
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={[
              styles.image as ImageStyle,
              {
                width: config.size,
                height: config.size,
                borderRadius: config.size / 2,
              },
            ]}
            resizeMode="cover"
          />
        ) : (
          <Text style={[styles.initials, { fontSize: config.fontSize }]}>
            {getInitials(name)}
          </Text>
        )}
      </View>

      {showBadge && (
        <View style={[styles.badge, { backgroundColor: badgeColor }]} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  avatar: {
    backgroundColor: DesignTokens.colors.dark.elevated,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  imagePlaceholder: {
    borderWidth: 1,
    borderColor: DesignTokens.colors.dark.border,
  },
  image: {
    width: "100%",
    height: "100%",
    backgroundColor: DesignTokens.colors.dark.surface,
  },
  initials: {
    color: DesignTokens.colors.dark.text.primary,
    fontFamily: DesignTokens.typography.fonts.primary,
    fontWeight: "600" as const,
  },
  badge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: DesignTokens.colors.dark.background,
  },
});
