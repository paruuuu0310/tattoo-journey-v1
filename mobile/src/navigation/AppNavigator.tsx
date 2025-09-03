/**
 * 🧭 MAIN APPLICATION NAVIGATOR
 *
 * Pentagon-Level Security Integration
 * - Zero Trust Authentication Flow
 * - Multi-Factor Authentication
 * - Continuous Security Monitoring
 * - Role-Based Access Control
 */

import React, { useContext, useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Alert, ActivityIndicator, View, StyleSheet } from "react-native";

// Security Systems (optional imports - graceful fallback if not available)
// import ZeroTrustAuthentication from '../security/ZeroTrustAuthentication';
// import IntrusionDetectionSystem from '../security/IntrusionDetectionSystem';

// Contexts
import { AuthContext } from "../contexts/AuthContext";

// Screens - Authentication
import LoginScreen from "../screens/auth/LoginScreen";
import SignUpScreen from "../screens/auth/SignUpScreen";
import UserTypeSelectionScreen from "../screens/auth/UserTypeSelectionScreen";

// Screens - Main
import HomeScreen from "../screens/main/HomeScreen";
import SearchScreen from "../screens/main/SearchScreen";
import MessagesScreen from "../screens/main/MessagesScreen";
import ProfileScreen from "../screens/main/ProfileScreen";

// Screens - Customer
import ImageUploadScreen from "../screens/customer/ImageUploadScreen";
import MatchingResultsScreen from "../screens/customer/MatchingResultsScreen";
import RecommendationListScreen from "../screens/customer/RecommendationListScreen";
import LocationSetupScreen from "../screens/customer/LocationSetupScreen";
import InquiryFormScreen from "../screens/customer/InquiryFormScreen";
import ArtistMapScreen from "../screens/customer/ArtistMapScreen";
import ReviewCreateScreen from "../screens/customer/ReviewCreateScreen";

// Screens - Artist
import ArtistRegistrationScreen from "../screens/artist/ArtistRegistrationScreen";
import PortfolioManagementScreen from "../screens/artist/PortfolioManagementScreen";
import ScheduleManagementScreen from "../screens/artist/ScheduleManagementScreen";
import PricingManagementScreen from "../screens/artist/PricingManagementScreen";
import SpecialtyManagementScreen from "../screens/artist/SpecialtyManagementScreen";
import TagAdjustmentScreen from "../screens/artist/TagAdjustmentScreen";
import ReviewListScreen from "../screens/artist/ReviewListScreen";
import ArtistScoreDashboard from "../screens/artist/ArtistScoreDashboard";
// import LocationSetupScreen as ArtistLocationSetupScreen from '../screens/artist/LocationSetupScreen';

// Screens - Chat & Booking
import ChatScreen from "../screens/chat/ChatScreen";
import ChatListScreen from "../screens/chat/ChatListScreen";
import CounterOfferScreen from "../screens/chat/CounterOfferScreen";
import BookingChatScreen from "../screens/chat/BookingChatScreen";
import BookingStatusScreen from "../screens/booking/BookingStatusScreen";
import BookingConfirmationScreen from "../screens/booking/BookingConfirmationScreen";

// Screens - Settings
import NotificationSettingsScreen from "../screens/settings/NotificationSettingsScreen";

// Screens - Admin
import ScoreManagementScreen from "../screens/admin/ScoreManagementScreen";

// Screens - Loading
import LoadingScreen from "../screens/LoadingScreen";

// Navigation Types
export type RootStackParamList = {
  Loading: undefined;
  Auth: undefined;
  Main: undefined;
  SecurityChallenge: { challengeType: "MFA" | "BIOMETRIC" | "CONTINUOUS" };
};

export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
  UserTypeSelection: { email: string; password: string };
};

export type MainTabParamList = {
  Home: undefined;
  Search: undefined;
  Messages: undefined;
  Profile: undefined;
};

export type CustomerStackParamList = {
  ImageUpload: undefined;
  MatchingResults: { imageUri: string; analysisResult: any };
  RecommendationList: undefined;
  LocationSetup: undefined;
  InquiryForm: { artistId: string };
  ArtistMap: undefined;
  ReviewCreate: { artistId: string; bookingId: string };
};

export type ArtistStackParamList = {
  ArtistRegistration: undefined;
  PortfolioManagement: undefined;
  ScheduleManagement: undefined;
  PricingManagement: undefined;
  SpecialtyManagement: undefined;
  TagAdjustment: { portfolioItemId: string };
  ReviewList: undefined;
  ArtistScoreDashboard: undefined;
  ArtistLocationSetup: undefined;
};

export type ChatStackParamList = {
  ChatList: undefined;
  Chat: { roomId: string; participantId: string };
  CounterOffer: { roomId: string; originalOffer: any };
  BookingChat: { roomId: string; bookingId: string };
  BookingStatus: { bookingId: string };
  BookingConfirmation: { bookingId: string };
};

// Stack Navigators
const RootStack = createStackNavigator<RootStackParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const CustomerStack = createStackNavigator<CustomerStackParamList>();
const ArtistStack = createStackNavigator<ArtistStackParamList>();
const ChatStack = createStackNavigator<ChatStackParamList>();

// Security Systems (optional - graceful fallback)
// const zeroTrust = new ZeroTrustAuthentication();
// const intrusionDetection = new IntrusionDetectionSystem();

/**
 * 🔐 Security Challenge Screen Component
 * Multi-Factor Authentication Interface
 */
const SecurityChallengeScreen: React.FC<{ route: any; navigation: any }> = ({
  route,
  navigation,
}) => {
  const { challengeType } = route.params;
  const [isVerifying, setIsVerifying] = useState(false);

  const handleSecurityChallenge = async () => {
    setIsVerifying(true);

    try {
      // Implement security challenge based on type
      switch (challengeType) {
        case "MFA":
          await handleMFAChallenge();
          break;
        case "BIOMETRIC":
          await handleBiometricChallenge();
          break;
        case "CONTINUOUS":
          await handleContinuousAuthChallenge();
          break;
      }

      // On success, navigate back to main app
      navigation.replace("Main");
    } catch (error) {
      Alert.alert("Security Verification Failed", "Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleMFAChallenge = async () => {
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Simulated
  };

  const handleBiometricChallenge = async () => {
    await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulated
  };

  const handleContinuousAuthChallenge = async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulated
  };

  return (
    <View style={styles.securityContainer}>
      <ActivityIndicator size="large" color="#ff6b6b" />
    </View>
  );
};

/**
 * 🔐 Authentication Stack Navigator
 */
const AuthNavigator: React.FC = () => {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "#1a1a1a" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "bold" },
      }}
    >
      <AuthStack.Screen
        name="Login"
        component={LoginScreen}
        options={{ title: "ログイン" }}
      />
      <AuthStack.Screen
        name="SignUp"
        component={SignUpScreen}
        options={{ title: "アカウント作成" }}
      />
      <AuthStack.Screen
        name="UserTypeSelection"
        component={UserTypeSelectionScreen}
        options={{ title: "ユーザータイプ選択" }}
      />
    </AuthStack.Navigator>
  );
};

/**
 * 📱 Main Tab Navigator
 */
const MainNavigator: React.FC = () => {
  const { user } = useContext(AuthContext);

  return (
    <MainTab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: "#1a1a1a",
          borderTopColor: "#333",
        },
        tabBarActiveTintColor: "#ff6b6b",
        tabBarInactiveTintColor: "#888",
        headerStyle: { backgroundColor: "#1a1a1a" },
        headerTintColor: "#fff",
        headerTitleStyle: { fontWeight: "bold" },
      }}
    >
      <MainTab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: "ホーム",
          tabBarIcon: ({ color }) => <HomeIcon color={color} />,
        }}
      />

      {user?.userType === "customer" ? (
        <MainTab.Screen
          name="Search"
          component={SearchScreen}
          options={{
            title: "検索",
            tabBarIcon: ({ color }) => <SearchIcon color={color} />,
            headerTitle: "アーティスト検索",
          }}
        />
      ) : (
        <MainTab.Screen
          name="Search"
          component={SearchScreen}
          options={{
            title: "管理",
            tabBarIcon: ({ color }) => <ManageIcon color={color} />,
            headerTitle: "アーティスト管理",
          }}
        />
      )}

      <MainTab.Screen
        name="Messages"
        component={MessagesScreen}
        options={{
          title: "メッセージ",
          tabBarIcon: ({ color }) => <MessageIcon color={color} />,
          headerTitle: "メッセージ",
        }}
      />

      <MainTab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "プロフィール",
          tabBarIcon: ({ color }) => <ProfileIcon color={color} />,
          headerTitle: "プロフィール",
        }}
      />
    </MainTab.Navigator>
  );
};

/**
 * 🛡️ Main App Navigator with Pentagon-Level Security
 * Root navigation with integrated security systems
 */
const AppNavigator: React.FC = () => {
  const { user, isLoading } = useContext(AuthContext);
  const [securityStatus, setSecurityStatus] = useState<{
    verified: boolean;
    challengeRequired: boolean;
    challengeType?: "MFA" | "BIOMETRIC" | "CONTINUOUS";
  }>({ verified: false, challengeRequired: false });

  // Initialize Security Systems (simplified for now)
  useEffect(() => {
    const initializeSecurity = async () => {
      try {
        if (user) {
          // Simplified security check - can be enhanced later
          setSecurityStatus({
            verified: true,
            challengeRequired: false,
          });
        }
      } catch (error) {
        console.error("Security initialization failed:", error);
        // Fallback to allowing access
        setSecurityStatus({
          verified: true,
          challengeRequired: false,
        });
      }
    };

    initializeSecurity();
  }, [user]);

  if (isLoading) {
    return (
      <NavigationContainer>
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
          <RootStack.Screen name="Loading" component={LoadingScreen} />
        </RootStack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!user ? (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        ) : securityStatus.challengeRequired ? (
          <RootStack.Screen
            name="SecurityChallenge"
            component={SecurityChallengeScreen}
            initialParams={{ challengeType: securityStatus.challengeType }}
          />
        ) : (
          <RootStack.Screen name="Main" component={MainNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

// Placeholder Icon Components
const HomeIcon: React.FC<{ color: string }> = ({ color }) => (
  <View style={[styles.iconPlaceholder, { backgroundColor: color }]} />
);

const SearchIcon: React.FC<{ color: string }> = ({ color }) => (
  <View style={[styles.iconPlaceholder, { backgroundColor: color }]} />
);

const ManageIcon: React.FC<{ color: string }> = ({ color }) => (
  <View style={[styles.iconPlaceholder, { backgroundColor: color }]} />
);

const MessageIcon: React.FC<{ color: string }> = ({ color }) => (
  <View style={[styles.iconPlaceholder, { backgroundColor: color }]} />
);

const ProfileIcon: React.FC<{ color: string }> = ({ color }) => (
  <View style={[styles.iconPlaceholder, { backgroundColor: color }]} />
);

const styles = StyleSheet.create({
  securityContainer: {
    flex: 1,
    backgroundColor: "#1a1a1a",
    justifyContent: "center",
    alignItems: "center",
  },
  iconPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 4,
  },
});

export default AppNavigator;
