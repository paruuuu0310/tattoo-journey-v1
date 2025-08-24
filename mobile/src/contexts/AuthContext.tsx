import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User as FirebaseUser } from '@react-native-firebase/auth';
import { auth, firestore } from '../config/firebase';
import { User, UserType } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: User | null;
  loading: boolean;
  signUp: (email: string, password: string, userType: UserType, profile: any) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (profile: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // サインアップ
  const signUp = async (email: string, password: string, userType: UserType, profile: any) => {
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      // Firestoreにユーザープロフィールを作成
      const userProfile: User = {
        uid: user.uid,
        email: user.email!,
        displayName: profile.firstName + ' ' + profile.lastName,
        userType,
        createdAt: new Date(),
        updatedAt: new Date(),
        profile,
      };

      await firestore().collection('users').doc(user.uid).set(userProfile);
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  // サインイン
  const signIn = async (email: string, password: string) => {
    try {
      await auth().signInWithEmailAndPassword(email, password);
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    }
  };

  // サインアウト
  const signOut = async () => {
    try {
      await auth().signOut();
      setUserProfile(null);
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  // プロフィール更新
  const updateProfile = async (profile: Partial<User>) => {
    if (!currentUser) return;

    try {
      const updatedProfile = {
        ...profile,
        updatedAt: new Date(),
      };

      await firestore().collection('users').doc(currentUser.uid).update(updatedProfile);
      
      // ローカル状態を更新
      if (userProfile) {
        setUserProfile({ ...userProfile, ...updatedProfile });
      }
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  };

  // ユーザープロフィールを取得
  const fetchUserProfile = async (uid: string) => {
    try {
      const userDoc = await firestore().collection('users').doc(uid).get();
      if (userDoc.exists) {
        const userData = userDoc.data() as User;
        setUserProfile(userData);
      }
    } catch (error) {
      console.error('Fetch user profile error:', error);
    }
  };

  // 認証状態の変化を監視
  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (user) => {
      setCurrentUser(user);
      
      if (user) {
        await fetchUserProfile(user.uid);
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};