import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

const ProfileScreen: React.FC = () => {
  const { userProfile, signOut } = useAuth();

  const handleSignOut = async () => {
    Alert.alert(
      'ログアウト',
      'ログアウトしますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        { text: 'ログアウト', onPress: () => signOut() },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.profileInfo}>
          <Text style={styles.name}>
            {userProfile?.profile.lastName} {userProfile?.profile.firstName}
          </Text>
          <Text style={styles.email}>{userProfile?.email}</Text>
          <Text style={styles.userType}>
            {userProfile?.userType === 'customer' ? 'お客様' : 
             userProfile?.userType === 'artist' ? 'アーティスト' : 'オーナー'}
          </Text>
        </View>
        
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>ログアウト</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  profileInfo: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    alignItems: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  email: {
    fontSize: 16,
    color: '#aaa',
    marginBottom: 8,
  },
  userType: {
    fontSize: 14,
    color: '#ff6b6b',
    fontWeight: '600',
  },
  signOutButton: {
    backgroundColor: '#ff4757',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  signOutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;