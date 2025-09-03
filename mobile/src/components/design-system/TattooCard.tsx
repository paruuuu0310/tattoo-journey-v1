import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
} from "react-native";
import { DesignTokens } from "./TattooDesignTokens";

export interface TattooCardProps {
  children: React.ReactNode;
  variant?: "default" | "elevated" | "outlined" | "neon" | "gradient";
  size?: "sm" | "md" | "lg" | "xl";
  onPress?: () => void;
  disabled?: boolean;
  neonColor?: string;
  style?: ViewStyle;
}

const TattooCard: React.FC<TattooCardProps> = ({
  children,
  variant = "default",
  size = "md",
  onPress,
  disabled = false,
  neonColor = DesignTokens.colors.primary[500],
  style,
}) => {
  const getCardStyles = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: DesignTokens.radius.xl,
      padding: DesignTokens.components.card.padding[size],
    };

    // Variant-specific styles
    switch (variant) {
      case "default":
        baseStyle.backgroundColor = DesignTokens.colors.dark.surface;
        break;

      case "elevated":
        baseStyle.backgroundColor = DesignTokens.colors.dark.surface;
        baseStyle.shadowColor = "#000000";
        baseStyle.shadowOffset = { width: 0, height: 4 };
        baseStyle.shadowOpacity = 0.3;
        baseStyle.shadowRadius = 8;
        baseStyle.elevation = 8;
        break;

      case "outlined":
        baseStyle.backgroundColor = "transparent";
        baseStyle.borderWidth = 1;
        baseStyle.borderColor = DesignTokens.colors.dark.border;
        break;

      case "neon":
        baseStyle.backgroundColor = DesignTokens.colors.dark.surface;
        baseStyle.borderWidth = 2;
        baseStyle.borderColor = neonColor;
        baseStyle.shadowColor = neonColor;
        baseStyle.shadowOffset = { width: 0, height: 0 };
        baseStyle.shadowOpacity = 0.8;
        baseStyle.shadowRadius = 10;
        baseStyle.elevation = 10;
        break;

      case "gradient":
        // Gradient implementation would require react-native-linear-gradient
        baseStyle.backgroundColor = DesignTokens.colors.dark.surface;
        baseStyle.borderWidth = 1;
        baseStyle.borderColor = DesignTokens.colors.primary[500];
        break;
    }

    // Disabled state
    if (disabled) {
      baseStyle.opacity = 0.6;
    }

    return baseStyle;
  };

  const CardComponent = onPress ? TouchableOpacity : View;

  return (
    <CardComponent
      style={[getCardStyles(), style]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={onPress ? 0.8 : 1}
    >
      {children}
    </CardComponent>
  );
};

// Pre-built card variants for common use cases

export interface ArtistCardProps extends Omit<TattooCardProps, "children"> {
  artistName: string;
  rating: number;
  specialties: string[];
  avatarUri?: string;
  onPress: () => void;
}

export const ArtistCard: React.FC<ArtistCardProps> = ({
  artistName,
  rating,
  specialties,
  avatarUri,
  onPress,
  ...props
}) => {
  return (
    <TattooCard variant="elevated" onPress={onPress} {...props}>
      <View style={styles.artistCardContent}>
        {avatarUri && (
          <View style={styles.avatarContainer}>
            {/* Avatar implementation would go here */}
          </View>
        )}
        <View style={styles.artistInfo}>
          <Text style={styles.artistName}>{artistName}</Text>
          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Text
                key={star}
                style={[
                  styles.star,
                  {
                    color:
                      star <= rating
                        ? DesignTokens.colors.accent.gold
                        : DesignTokens.colors.secondary[600],
                  },
                ]}
              >
                ★
              </Text>
            ))}
            <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
          </View>
          <View style={styles.specialtiesContainer}>
            {specialties.slice(0, 3).map((specialty, index) => (
              <View key={index} style={styles.specialtyTag}>
                <Text style={styles.specialtyText}>{specialty}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </TattooCard>
  );
};

export interface PortfolioCardProps extends Omit<TattooCardProps, "children"> {
  imageUri: string;
  title?: string;
  style?: ViewStyle;
  tags?: string[];
  onPress: () => void;
}

export const PortfolioCard: React.FC<PortfolioCardProps> = ({
  imageUri,
  title,
  tags,
  onPress,
  ...props
}) => {
  return (
    <TattooCard variant="neon" onPress={onPress} {...props}>
      <View style={styles.portfolioCardContent}>
        <View style={styles.portfolioImageContainer}>
          {/* Image implementation would go here */}
          <View style={styles.portfolioImagePlaceholder} />
        </View>
        {title && <Text style={styles.portfolioTitle}>{title}</Text>}
        {tags && (
          <View style={styles.portfolioTags}>
            {tags.slice(0, 2).map((tag, index) => (
              <View key={index} style={styles.portfolioTag}>
                <Text style={styles.portfolioTagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TattooCard>
  );
};

const styles = StyleSheet.create({
  // Artist Card Styles
  artistCardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: DesignTokens.colors.secondary[600],
    marginRight: DesignTokens.spacing[4],
  },
  artistInfo: {
    flex: 1,
  },
  artistName: {
    fontSize: DesignTokens.typography.sizes.lg,
    fontWeight: DesignTokens.typography.weights.bold,
    color: DesignTokens.colors.dark.text.primary,
    marginBottom: DesignTokens.spacing[1],
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: DesignTokens.spacing[2],
  },
  star: {
    fontSize: DesignTokens.typography.sizes.sm,
    marginRight: DesignTokens.spacing[1],
  },
  ratingText: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.dark.text.secondary,
    marginLeft: DesignTokens.spacing[2],
  },
  specialtiesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: DesignTokens.spacing[1],
  },
  specialtyTag: {
    backgroundColor: DesignTokens.colors.primary[500],
    borderRadius: DesignTokens.radius.full,
    paddingHorizontal: DesignTokens.spacing[2],
    paddingVertical: DesignTokens.spacing[1],
  },
  specialtyText: {
    fontSize: DesignTokens.typography.sizes.xs,
    color: DesignTokens.colors.dark.text.primary,
    fontWeight: DesignTokens.typography.weights.medium,
  },

  // Portfolio Card Styles
  portfolioCardContent: {
    alignItems: "center",
  },
  portfolioImageContainer: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: DesignTokens.radius.lg,
    overflow: "hidden",
    marginBottom: DesignTokens.spacing[2],
  },
  portfolioImagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: DesignTokens.colors.secondary[600],
  },
  portfolioTitle: {
    fontSize: DesignTokens.typography.sizes.md,
    fontWeight: DesignTokens.typography.weights.semibold,
    color: DesignTokens.colors.dark.text.primary,
    textAlign: "center",
    marginBottom: DesignTokens.spacing[2],
  },
  portfolioTags: {
    flexDirection: "row",
    gap: DesignTokens.spacing[1],
  },
  portfolioTag: {
    backgroundColor: DesignTokens.colors.accent.electric,
    borderRadius: DesignTokens.radius.base,
    paddingHorizontal: DesignTokens.spacing[2],
    paddingVertical: DesignTokens.spacing[1],
  },
  portfolioTagText: {
    fontSize: DesignTokens.typography.sizes.xs,
    color: DesignTokens.colors.dark.background,
    fontWeight: DesignTokens.typography.weights.bold,
  },
});

export default TattooCard;
