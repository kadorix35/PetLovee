import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';
import database from '@react-native-firebase/database';
import messaging from '@react-native-firebase/messaging';
import analytics from '@react-native-firebase/analytics';
import { config, validateConfig } from './config/environment';

// Environment konfigürasyonunu doğrula
validateConfig();

// Firebase konfigürasyonu - environment'dan alınan değerler
const firebaseConfig = {
  apiKey: config.firebase.apiKey,
  authDomain: config.firebase.authDomain,
  projectId: config.firebase.projectId,
  storageBucket: config.firebase.storageBucket,
  messagingSenderId: config.firebase.messagingSenderId,
  appId: config.firebase.appId,
  measurementId: config.firebase.measurementId,
  databaseURL: config.firebase.databaseURL
};

// Firebase servislerini export et
export { auth, firestore, storage, database, messaging, analytics, config };

// Firebase başlatma kontrolü
export const initializeFirebase = async () => {
  try {
    // Firebase servislerinin hazır olduğunu kontrol et
    await auth().app;
    await firestore().app;
    await storage().app;
    await database().app;
    await messaging().app;
    await analytics().app;
    
    console.log('✅ Firebase servisleri başarıyla başlatıldı');
    return true;
  } catch (error) {
    console.error('❌ Firebase başlatma hatası:', error);
    return false;
  }
};

// Push notification token al
export const getPushToken = async (): Promise<string | null> => {
  try {
    const token = await messaging().getToken();
    return token;
  } catch (error) {
    console.error('Push token alma hatası:', error);
    return null;
  }
};

// Background message handler
export const setupBackgroundMessageHandler = () => {
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log('Background message:', remoteMessage);
    // Background'da gelen mesajları işle
  });
};

// Foreground message handler
export const setupForegroundMessageHandler = () => {
  const unsubscribe = messaging().onMessage(async (remoteMessage) => {
    console.log('Foreground message:', remoteMessage);
    // Foreground'da gelen mesajları işle
  });
  
  return unsubscribe;
};

// Notification permission iste
export const requestNotificationPermission = async (): Promise<boolean> => {
  try {
    const authStatus = await messaging().requestPermission();
    const enabled = 
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    
    if (enabled) {
      console.log('✅ Notification permission granted');
    } else {
      console.log('❌ Notification permission denied');
    }
    
    return enabled;
  } catch (error) {
    console.error('Notification permission hatası:', error);
    return false;
  }
};

// Expo'da Firebase otomatik olarak google-services.json ve GoogleService-Info.plist dosyalarından konfigürasyonu alır
// Production'da environment variables kullanılır
