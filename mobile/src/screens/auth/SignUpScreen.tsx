import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  ScrollView,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useAuth } from '../../contexts/AuthContext';
import { UserType } from '../../types';

type SignUpScreenRouteProp = RouteProp<RootStackParamList, 'SignUp'>;

interface Props {
  route: SignUpScreenRouteProp;
}

const SignUpScreen: React.FC<Props> = ({ route }) => {
  const { userType } = route.params;
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    bio: '',
  });
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  const handleSignUp = async () => {
    // バリデーション
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      Alert.alert('エラー', '必須項目を入力してください');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('エラー', 'パスワードが一致しません');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('エラー', 'パスワードは6文字以上で入力してください');
      return;
    }

    setLoading(true);
    try {
      const profile = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        bio: formData.bio,
        phone: formData.phone,
        location: {
          address: '',
          city: '',
          prefecture: '',
          postalCode: '',
          latitude: 0,
          longitude: 0,
        },
      };

      await signUp(formData.email, formData.password, userType as UserType, profile);
    } catch (error: any) {
      Alert.alert('登録エラー', error.message);
    } finally {
      setLoading(false);
    }
  };

  const getUserTypeTitle = () => {
    switch (userType) {
      case 'customer':
        return 'お客様';
      case 'artist':
        return 'アーティスト';
      case 'owner':
        return 'オーナー';
      default:
        return '';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.form}>
          <Text style={styles.title}>新規登録</Text>
          <Text style={styles.subtitle}>{getUserTypeTitle()}として登録</Text>
          
          <TextInput
            style={styles.input}
            placeholder="姓 *"
            placeholderTextColor="#666"
            value={formData.lastName}
            onChangeText={(text) => setFormData({...formData, lastName: text})}
          />
          
          <TextInput
            style={styles.input}
            placeholder="名 *"
            placeholderTextColor="#666"
            value={formData.firstName}
            onChangeText={(text) => setFormData({...formData, firstName: text})}
          />
          
          <TextInput
            style={styles.input}
            placeholder="メールアドレス *"
            placeholderTextColor="#666"
            value={formData.email}
            onChangeText={(text) => setFormData({...formData, email: text})}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <TextInput
            style={styles.input}
            placeholder="パスワード *"
            placeholderTextColor="#666"
            value={formData.password}
            onChangeText={(text) => setFormData({...formData, password: text})}
            secureTextEntry
          />
          
          <TextInput
            style={styles.input}
            placeholder="パスワード確認 *"
            placeholderTextColor="#666"
            value={formData.confirmPassword}
            onChangeText={(text) => setFormData({...formData, confirmPassword: text})}
            secureTextEntry
          />
          
          <TextInput
            style={styles.input}
            placeholder="電話番号"
            placeholderTextColor="#666"
            value={formData.phone}
            onChangeText={(text) => setFormData({...formData, phone: text})}
            keyboardType="phone-pad"
          />
          
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="自己紹介"
            placeholderTextColor="#666"
            value={formData.bio}
            onChangeText={(text) => setFormData({...formData, bio: text})}
            multiline
            numberOfLines={4}
          />
          
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSignUp}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? '登録中...' : '登録'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  scrollView: {
    flex: 1,
    padding: 20,
  },
  form: {
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#ff6b6b',
    textAlign: 'center',
    marginBottom: 32,
  },
  input: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    color: '#fff',
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#ff6b6b',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SignUpScreen;