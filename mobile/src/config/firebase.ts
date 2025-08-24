import { initializeApp, getApps } from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';

// Firebase config is automatically loaded from GoogleService-Info.plist (iOS) 
// and google-services.json (Android)

// Initialize Firebase if it hasn't been initialized yet
if (getApps().length === 0) {
  initializeApp();
}

export { auth, firestore, storage };
export default { auth, firestore, storage };