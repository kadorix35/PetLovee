import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';

// Firebase konfigürasyonu - petlove-app-2ef62 projesi için
const firebaseConfig = {
  apiKey: "AIzaSyC2CA33lwjTcrffnJjOyJ3ULrMkaD90t6w",
  authDomain: "petlove-app-2ef62.firebaseapp.com",
  projectId: "petlove-app-2ef62",
  storageBucket: "petlove-app-2ef62.firebasestorage.app",
  messagingSenderId: "458534082610",
  appId: "1:458534082610:web:1e424a03eee47118b0c42b",
  measurementId: "G-G4XCVG8C7T"
};

// Firebase servislerini export et
export { auth, firestore, storage };

// Expo'da Firebase otomatik olarak google-services.json ve GoogleService-Info.plist dosyalarından konfigürasyonu alır
// Bu config bilgileri referans için saklanıyor
