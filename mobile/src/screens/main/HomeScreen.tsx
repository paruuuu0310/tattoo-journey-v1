import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';

const HomeScreen: React.FC = () => {
  const { userProfile } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.welcome}>
          ようこそ、{userProfile?.profile.firstName}さん！
        </Text>
        <Text style={styles.subtitle}>
          アカウントタイプ: {userProfile?.userType === 'customer' ? 'お客様' : 
                              userProfile?.userType === 'artist' ? 'アーティスト' : 'オーナー'}
        </Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  welcome: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#ff6b6b',
    textAlign: 'center',
  },
});

export default HomeScreen;