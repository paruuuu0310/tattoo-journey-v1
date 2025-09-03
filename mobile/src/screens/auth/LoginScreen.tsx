import React from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  StatusBar,
} from "react-native";
import { Button } from "../../components/ui";
import { DesignTokens } from "../../styles/DesignTokens";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface LoginScreenProps {
  onLogin: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const handleGoogleLogin = () => {
    // Mock login - navigate to onboarding
    setTimeout(onLogin, 500);
  };

  const handleAppleLogin = () => {
    // Mock login - navigate to onboarding
    setTimeout(onLogin, 500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={DesignTokens.colors.dark.background}
      />

      {/* Hero Section */}
      <View style={styles.heroSection}>
        <View style={styles.logoContainer}>
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>TJ</Text>
          </View>
          <Text style={styles.appName}>Tattoo Journey</Text>
          <Text style={styles.tagline}>
            理想のタトゥーアーティストを見つけよう
          </Text>
        </View>

        {/* Hero Image Placeholder */}
        <View style={styles.heroImageContainer}>
          <View style={styles.heroImage}>
            <Text style={styles.heroImageText}>🎨</Text>
          </View>
        </View>
      </View>

      {/* Login Section */}
      <View style={styles.loginSection}>
        <View style={styles.loginContainer}>
          <Text style={styles.loginTitle}>始めましょう</Text>
          <Text style={styles.loginSubtitle}>
            アカウントを作成して、あなたにぴったりのアーティストを見つけてください
          </Text>

          <View style={styles.buttonContainer}>
            {/* Google Login Button */}
            <Button
              title="Googleで続行"
              onPress={handleGoogleLogin}
              variant="secondary"
              size="large"
              fullWidth
              style={styles.socialButton}
            />

            {/* Apple Login Button */}
            <Button
              title="Appleで続行"
              onPress={handleAppleLogin}
              variant="primary"
              size="large"
              fullWidth
              style={styles.socialButton}
            />
          </View>

          {/* Terms */}
          <View style={styles.termsContainer}>
            <Text style={styles.termsText}>
              続行することで、
              <Text style={styles.termsLink}>利用規約</Text>
              および
              <Text style={styles.termsLink}>プライバシーポリシー</Text>
              に同意したものとみなされます。
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: DesignTokens.colors.dark.background,
  },
  heroSection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: DesignTokens.spacing[6],
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: DesignTokens.spacing[8],
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: DesignTokens.colors.primary[500],
    alignItems: "center",
    justifyContent: "center",
    marginBottom: DesignTokens.spacing[4],
    ...DesignTokens.shadows.lg,
  },
  logoText: {
    fontSize: DesignTokens.typography.sizes["4xl"],
    fontWeight: DesignTokens.typography.weights.bold,
    color: DesignTokens.colors.dark.text.primary,
  },
  appName: {
    fontSize: DesignTokens.typography.sizes["3xl"],
    fontWeight: DesignTokens.typography.weights.bold,
    color: DesignTokens.colors.dark.text.primary,
    marginBottom: DesignTokens.spacing[2],
  },
  tagline: {
    fontSize: DesignTokens.typography.sizes.md,
    color: DesignTokens.colors.dark.text.secondary,
    textAlign: "center",
    lineHeight: 22,
  },
  heroImageContainer: {
    marginTop: DesignTokens.spacing[6],
  },
  heroImage: {
    width: 120,
    height: 120,
    borderRadius: DesignTokens.radius.full,
    backgroundColor: DesignTokens.colors.dark.surface,
    alignItems: "center",
    justifyContent: "center",
    ...DesignTokens.shadows.base,
  },
  heroImageText: {
    fontSize: 48,
  },
  loginSection: {
    backgroundColor: DesignTokens.colors.dark.surface,
    borderTopLeftRadius: DesignTokens.radius["3xl"],
    borderTopRightRadius: DesignTokens.radius["3xl"],
    paddingTop: DesignTokens.spacing[8],
    paddingBottom: DesignTokens.spacing[6],
  },
  loginContainer: {
    paddingHorizontal: DesignTokens.spacing[6],
  },
  loginTitle: {
    fontSize: DesignTokens.typography.sizes["2xl"],
    fontWeight: DesignTokens.typography.weights.bold,
    color: DesignTokens.colors.dark.text.primary,
    textAlign: "center",
    marginBottom: DesignTokens.spacing[3],
  },
  loginSubtitle: {
    fontSize: DesignTokens.typography.sizes.md,
    color: DesignTokens.colors.dark.text.secondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: DesignTokens.spacing[8],
  },
  buttonContainer: {
    gap: DesignTokens.spacing[4],
    marginBottom: DesignTokens.spacing[6],
  },
  socialButton: {
    borderRadius: DesignTokens.radius.xl,
  },
  termsContainer: {
    paddingHorizontal: DesignTokens.spacing[4],
  },
  termsText: {
    fontSize: DesignTokens.typography.sizes.sm,
    color: DesignTokens.colors.dark.text.tertiary,
    textAlign: "center",
    lineHeight: 20,
  },
  termsLink: {
    color: DesignTokens.colors.primary[500],
    fontWeight: DesignTokens.typography.weights.medium,
  },
});

export default LoginScreen;
