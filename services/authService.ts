import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { LoginManager, AccessToken } from 'react-native-fbsdk-next';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface AuthError {
  code: string;
  message: string;
}

class AuthService {
  // Email/Password ile kayıt
  async signUpWithEmail(email: string, password: string, displayName: string): Promise<User> {
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      
      // Kullanıcı adını güncelle
      await userCredential.user.updateProfile({
        displayName: displayName,
      });

      return {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName,
        photoURL: userCredential.user.photoURL,
      };
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // Email/Password ile giriş
  async signInWithEmail(email: string, password: string): Promise<User> {
    try {
      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      
      return {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName,
        photoURL: userCredential.user.photoURL,
      };
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // Google ile giriş
  async signInWithGoogle(): Promise<User> {
    try {
      // Google Sign-In'i yapılandır
      GoogleSignin.configure({
        webClientId: 'your-web-client-id', // Firebase Console'dan alın
      });

      // Google'da oturum aç
      await GoogleSignin.hasPlayServices();
      const { idToken } = await GoogleSignin.signIn();

      // Firebase credential oluştur
      const googleCredential = auth.GoogleAuthProvider.credential(idToken);

      // Firebase'de oturum aç
      const userCredential = await auth().signInWithCredential(googleCredential);
      
      return {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName,
        photoURL: userCredential.user.photoURL,
      };
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // Facebook ile giriş
  async signInWithFacebook(): Promise<User> {
    try {
      // Facebook'ta oturum aç
      const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);

      if (result.isCancelled) {
        throw new Error('Facebook girişi iptal edildi');
      }

      // Access token al
      const data = await AccessToken.getCurrentAccessToken();

      if (!data) {
        throw new Error('Facebook access token alınamadı');
      }

      // Firebase credential oluştur
      const facebookCredential = auth.FacebookAuthProvider.credential(data.accessToken);

      // Firebase'de oturum aç
      const userCredential = await auth().signInWithCredential(facebookCredential);
      
      return {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName,
        photoURL: userCredential.user.photoURL,
      };
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // Şifre sıfırlama
  async resetPassword(email: string): Promise<void> {
    try {
      await auth().sendPasswordResetEmail(email);
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // Çıkış yap
  async signOut(): Promise<void> {
    try {
      await auth().signOut();
      await GoogleSignin.signOut();
      await LoginManager.logOut();
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // Mevcut kullanıcıyı al
  getCurrentUser(): User | null {
    const user = auth().currentUser;
    if (!user) return null;

    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
    };
  }

  // Auth state değişikliklerini dinle
  onAuthStateChanged(callback: (user: User | null) => void) {
    return auth().onAuthStateChanged((user) => {
      if (user) {
        callback({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
        });
      } else {
        callback(null);
      }
    });
  }

  // Hata yönetimi
  private handleAuthError(error: any): AuthError {
    let message = 'Bilinmeyen bir hata oluştu';
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        message = 'Bu e-posta adresi zaten kullanımda';
        break;
      case 'auth/weak-password':
        message = 'Şifre çok zayıf';
        break;
      case 'auth/invalid-email':
        message = 'Geçersiz e-posta adresi';
        break;
      case 'auth/user-not-found':
        message = 'Kullanıcı bulunamadı';
        break;
      case 'auth/wrong-password':
        message = 'Yanlış şifre';
        break;
      case 'auth/too-many-requests':
        message = 'Çok fazla deneme yapıldı. Lütfen daha sonra tekrar deneyin';
        break;
      case 'auth/network-request-failed':
        message = 'Ağ bağlantısı hatası';
        break;
      default:
        message = error.message || message;
    }

    return {
      code: error.code,
      message,
    };
  }
}

export default new AuthService();
