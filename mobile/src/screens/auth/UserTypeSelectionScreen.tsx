import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/AppNavigator';

type UserTypeSelectionScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'UserTypeSelection'
>;

interface Props {
  navigation: UserTypeSelectionScreenNavigationProp;
}

const UserTypeSelectionScreen: React.FC<Props> = ({ navigation }) => {
  const handleUserTypeSelect = (userType: 'customer' | 'artist' | 'owner') => {
    navigation.navigate('SignUp', { userType });
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      
      <View style={styles.header}>
        <Text style={styles.title}>Tattoo Journey</Text>
        <Text style={styles.subtitle}>
          あなたにぴったりのタトゥーアーティストを見つけよう
        </Text>
      </View>

      <View style={styles.userTypeContainer}>
        <Text style={styles.selectText}>アカウントタイプを選択してください</Text>
        
        <TouchableOpacity
          style={styles.userTypeButton}
          onPress={() => handleUserTypeSelect('customer')}
        >
          <Text style={styles.userTypeEmoji}>🎨</Text>
          <Text style={styles.userTypeTitle}>お客様</Text>
          <Text style={styles.userTypeDescription}>
            タトゥーを入れたい方
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.userTypeButton}
          onPress={() => handleUserTypeSelect('artist')}
        >
          <Text style={styles.userTypeEmoji}>✨</Text>
          <Text style={styles.userTypeTitle}>アーティスト</Text>
          <Text style={styles.userTypeDescription}>
            タトゥー施術者
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.userTypeButton}
          onPress={() => handleUserTypeSelect('owner')}
        >
          <Text style={styles.userTypeEmoji}>🏢</Text>
          <Text style={styles.userTypeTitle}>オーナー</Text>
          <Text style={styles.userTypeDescription}>
            スタジオ経営者
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.loginContainer}>
        <Text style={styles.loginText}>すでにアカウントをお持ちですか？</Text>
        <TouchableOpacity onPress={handleLogin}>
          <Text style={styles.loginLink}>ログイン</Text>
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
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ff6b6b',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 22,
  },
  userTypeContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  selectText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 30,
  },
  userTypeButton: {
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#333',
  },
  userTypeEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  userTypeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  userTypeDescription: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
  },
  loginText: {
    fontSize: 14,
    color: '#aaa',
    marginRight: 8,
  },
  loginLink: {
    fontSize: 14,
    color: '#ff6b6b',
    fontWeight: '600',
  },
});

export default UserTypeSelectionScreen;