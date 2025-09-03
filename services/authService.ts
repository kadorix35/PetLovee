import auth from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { LoginManager, AccessToken } from 'react-native-fbsdk-next';
import { config } from '../config/environment';
import { validateEmail, validatePassword, validateString } from '../utils/validation';
import { authRateLimiter, bruteForceProtection } from '../utils/rateLimiter';
import biometricService from './biometricService';
import twoFactorService from './twoFactorService';
import sessionService from './sessionService';
import { logSecurityEvent, generateDeviceFingerprint } from '../config/security';

export interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  sessionId?: string;
}

export interface AuthError {
  code: string;
  message: string;
}

export interface LoginResult {
  user: User;
  sessionId: string;
  requiresTwoFactor?: boolean;
  twoFactorMethod?: string;
}

class AuthService {
  // Email/Password ile kayıt
  async signUpWithEmail(email: string, password: string, displayName: string): Promise<LoginResult> {
    try {
      // Input validation
      const emailValidation = validateEmail(email);
      if (!emailValidation.isValid) {
        throw new Error(emailValidation.errors.join(', '));
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        throw new Error(passwordValidation.errors.join(', '));
      }

      const nameValidation = validateString(displayName, {
        required: true,
        minLength: 2,
        maxLength: 50,
        fieldName: 'İsim'
      });
      if (!nameValidation.isValid) {
        throw new Error(nameValidation.errors.join(', '));
      }

      // Rate limiting kontrolü
      const deviceFingerprint = generateDeviceFingerprint();
      const rateLimitCheck = await authRateLimiter.checkRateLimit(deviceFingerprint, 'signup');
      if (!rateLimitCheck.allowed) {
        throw new Error('Çok fazla kayıt denemesi yapıldı. Lütfen daha sonra tekrar deneyin.');
      }

      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      
      // Kullanıcı adını güncelle
      await userCredential.user.updateProfile({
        displayName: displayName,
      });

      // Session oluştur
      const sessionResult = await sessionService.createSession({
        userId: userCredential.user.uid,
        email: userCredential.user.email || '',
        displayName: userCredential.user.displayName || displayName,
        photoURL: userCredential.user.photoURL || undefined,
        deviceFingerprint,
        userAgent: 'PetLovee Mobile App'
      });

      if (!sessionResult.success) {
        throw new Error('Session oluşturulamadı');
      }

      // Rate limiting kaydı
      await authRateLimiter.recordRequest(deviceFingerprint, 'signup', true);

      logSecurityEvent('USER_SIGNUP_SUCCESS', {
        userId: this.maskUserId(userCredential.user.uid),
        email: this.maskEmail(email)
      });

      return {
        user: {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: userCredential.user.displayName,
          photoURL: userCredential.user.photoURL,
          sessionId: sessionResult.sessionId
        },
        sessionId: sessionResult.sessionId!
      };
    } catch (error: any) {
      // Rate limiting kaydı
      const deviceFingerprint = generateDeviceFingerprint();
      await authRateLimiter.recordRequest(deviceFingerprint, 'signup', false);

      logSecurityEvent('USER_SIGNUP_FAILED', {
        email: this.maskEmail(email),
        error: error.message
      });

      throw this.handleAuthError(error);
    }
  }

  // Email/Password ile giriş
  async signInWithEmail(email: string, password: string, twoFactorCode?: string): Promise<LoginResult> {
    try {
      // Input validation
      const emailValidation = validateEmail(email);
      if (!emailValidation.isValid) {
        throw new Error(emailValidation.errors.join(', '));
      }

      const passwordValidation = validateString(password, {
        required: true,
        minLength: 1,
        fieldName: 'Şifre'
      });
      if (!passwordValidation.isValid) {
        throw new Error(passwordValidation.errors.join(', '));
      }

      // Brute force protection
      const deviceFingerprint = generateDeviceFingerprint();
      const isLocked = await bruteForceProtection.isLocked(deviceFingerprint);
      if (isLocked) {
        throw new Error('Çok fazla başarısız deneme yapıldı. Lütfen daha sonra tekrar deneyin.');
      }

      // Rate limiting kontrolü
      const rateLimitCheck = await authRateLimiter.checkRateLimit(deviceFingerprint, 'login');
      if (!rateLimitCheck.allowed) {
        throw new Error('Çok fazla giriş denemesi yapıldı. Lütfen daha sonra tekrar deneyin.');
      }

      const userCredential = await auth().signInWithEmailAndPassword(email, password);
      
      // 2FA kontrolü
      const twoFactorStatus = await twoFactorService.getTwoFactorStatus(userCredential.user.uid);
      if (twoFactorStatus.enabled && !twoFactorCode) {
        // 2FA gerekli
        await authRateLimiter.recordRequest(deviceFingerprint, 'login', true);
        
        return {
          user: {
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            displayName: userCredential.user.displayName,
            photoURL: userCredential.user.photoURL,
          },
          sessionId: '',
          requiresTwoFactor: true,
          twoFactorMethod: twoFactorStatus.method || undefined
        };
      }

      // 2FA kodu doğrula
      if (twoFactorStatus.enabled && twoFactorCode) {
        const twoFactorResult = await twoFactorService.verifyTwoFactorCode(userCredential.user.uid, twoFactorCode);
        if (!twoFactorResult.success) {
          await authRateLimiter.recordRequest(deviceFingerprint, 'login', false);
          await bruteForceProtection.recordFailedAttempt(deviceFingerprint);
          throw new Error('İki faktörlü kimlik doğrulama kodu hatalı');
        }
      }

      // Session oluştur
      const sessionResult = await sessionService.createSession({
        userId: userCredential.user.uid,
        email: userCredential.user.email || '',
        displayName: userCredential.user.displayName || '',
        photoURL: userCredential.user.photoURL || undefined,
        deviceFingerprint,
        userAgent: 'PetLovee Mobile App'
      });

      if (!sessionResult.success) {
        throw new Error('Session oluşturulamadı');
      }

      // Başarılı giriş kaydı
      await authRateLimiter.recordRequest(deviceFingerprint, 'login', true);
      await bruteForceProtection.recordSuccessfulAttempt(deviceFingerprint);

      logSecurityEvent('USER_LOGIN_SUCCESS', {
        userId: this.maskUserId(userCredential.user.uid),
        email: this.maskEmail(email),
        hasTwoFactor: twoFactorStatus.enabled
      });

      return {
        user: {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          displayName: userCredential.user.displayName,
          photoURL: userCredential.user.photoURL,
          sessionId: sessionResult.sessionId
        },
        sessionId: sessionResult.sessionId!
      };
    } catch (error: any) {
      // Başarısız giriş kaydı
      const deviceFingerprint = generateDeviceFingerprint();
      await authRateLimiter.recordRequest(deviceFingerprint, 'login', false);
      await bruteForceProtection.recordFailedAttempt(deviceFingerprint);

      logSecurityEvent('USER_LOGIN_FAILED', {
        email: this.maskEmail(email),
        error: error.message
      });

      throw this.handleAuthError(error);
    }
  }

  // Google ile giriş
  async signInWithGoogle(): Promise<User> {
    try {
      // Google Sign-In'i yapılandır
      GoogleSignin.configure({
        webClientId: config.google.webClientId, // Environment'dan alınan web client ID
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

  // Email doğrulama gönder
  async sendEmailVerification(): Promise<void> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        throw new Error('Kullanıcı oturum açmamış');
      }

      if (currentUser.emailVerified) {
        throw new Error('E-posta adresi zaten doğrulanmış');
      }

      await currentUser.sendEmailVerification();
      
      logSecurityEvent('EMAIL_VERIFICATION_SENT', {
        userId: this.maskUserId(currentUser.uid),
        email: this.maskEmail(currentUser.email || '')
      });
    } catch (error: any) {
      logSecurityEvent('EMAIL_VERIFICATION_FAILED', {
        error: error.message
      });
      throw this.handleAuthError(error);
    }
  }

  // Email doğrulama durumunu kontrol et
  async checkEmailVerification(): Promise<boolean> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        return false;
      }

      await currentUser.reload();
      return currentUser.emailVerified;
    } catch (error) {
      return false;
    }
  }

  // Email doğrulama sayfası için kullanıcı bilgilerini al
  async getCurrentUserForVerification(): Promise<{ email: string; isVerified: boolean } | null> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser) {
        return null;
      }

      await currentUser.reload();
      return {
        email: currentUser.email || '',
        isVerified: currentUser.emailVerified
      };
    } catch (error) {
      return null;
    }
  }

  // Çıkış yap
  async signOut(sessionId?: string): Promise<void> {
    try {
      const currentUser = auth().currentUser;
      
      // Session'ı sonlandır
      if (sessionId) {
        await sessionService.invalidateSession(sessionId);
      } else if (currentUser) {
        // Kullanıcının tüm session'larını sonlandır
        await sessionService.invalidateAllUserSessions(currentUser.uid);
      }

      await auth().signOut();
      await GoogleSignin.signOut();
      await LoginManager.logOut();

      logSecurityEvent('USER_LOGOUT', {
        userId: currentUser ? this.maskUserId(currentUser.uid) : 'unknown'
      });
    } catch (error: any) {
      throw this.handleAuthError(error);
    }
  }

  // Biometric authentication ile giriş
  async signInWithBiometric(userId: string): Promise<LoginResult> {
    try {
      const biometricResult = await biometricService.loginWithBiometric(userId);
      if (!biometricResult.success) {
        throw new Error(biometricResult.error || 'Biometric authentication failed');
      }

      // Session oluştur
      const deviceFingerprint = generateDeviceFingerprint();
      const sessionResult = await sessionService.createSession({
        userId,
        email: '', // Biometric login'de email bilgisi yok
        displayName: '',
        deviceFingerprint,
        userAgent: 'PetLovee Mobile App'
      });

      if (!sessionResult.success) {
        throw new Error('Session oluşturulamadı');
      }

      logSecurityEvent('BIOMETRIC_LOGIN_SUCCESS', {
        userId: this.maskUserId(userId)
      });

      return {
        user: {
          uid: userId,
          email: null,
          displayName: null,
          photoURL: null,
          sessionId: sessionResult.sessionId
        },
        sessionId: sessionResult.sessionId!
      };
    } catch (error: any) {
      logSecurityEvent('BIOMETRIC_LOGIN_FAILED', {
        userId: this.maskUserId(userId),
        error: error.message
      });

      throw this.handleAuthError(error);
    }
  }

  // Session doğrula
  async validateSession(sessionId: string): Promise<User | null> {
    try {
      const sessionResult = await sessionService.validateSession(sessionId);
      if (!sessionResult.success || !sessionResult.sessionData) {
        return null;
      }

      const sessionData = sessionResult.sessionData;
      return {
        uid: sessionData.userId,
        email: sessionData.email,
        displayName: sessionData.displayName,
        photoURL: sessionData.photoURL,
        sessionId: sessionId
      };
    } catch (error) {
      return null;
    }
  }

  // Session yenile
  async refreshSession(sessionId: string): Promise<{ sessionId: string; user: User } | null> {
    try {
      const sessionResult = await sessionService.refreshSession(sessionId);
      if (!sessionResult.success || !sessionResult.sessionData) {
        return null;
      }

      const sessionData = sessionResult.sessionData;
      return {
        sessionId: sessionResult.sessionId!,
        user: {
          uid: sessionData.userId,
          email: sessionData.email,
          displayName: sessionData.displayName,
          photoURL: sessionData.photoURL,
          sessionId: sessionResult.sessionId
        }
      };
    } catch (error) {
      return null;
    }
  }

  // Kullanıcının aktif session'larını al
  async getUserSessions(userId: string): Promise<any[]> {
    try {
      return await sessionService.getUserSessions(userId);
    } catch (error) {
      return [];
    }
  }

  // 2FA'yı etkinleştir
  async enableTwoFactor(userId: string, method: 'totp' | 'sms' | 'email', contactInfo?: string): Promise<any> {
    try {
      return await twoFactorService.enableTwoFactor(userId, method, contactInfo);
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // 2FA'yı devre dışı bırak
  async disableTwoFactor(userId: string, password: string): Promise<any> {
    try {
      return await twoFactorService.disableTwoFactor(userId, password);
    } catch (error) {
      throw this.handleAuthError(error);
    }
  }

  // 2FA durumunu al
  async getTwoFactorStatus(userId: string): Promise<any> {
    try {
      return await twoFactorService.getTwoFactorStatus(userId);
    } catch (error) {
      return { enabled: false, method: null, backupCodesRemaining: 0 };
    }
  }

  // Biometric authentication'ı etkinleştir
  async enableBiometric(userId: string): Promise<boolean> {
    try {
      return await biometricService.enableBiometricAuth(userId);
    } catch (error) {
      return false;
    }
  }

  // Biometric authentication'ı devre dışı bırak
  async disableBiometric(userId: string): Promise<boolean> {
    try {
      return await biometricService.disableBiometricAuth(userId);
    } catch (error) {
      return false;
    }
  }

  // Biometric authentication durumunu al
  async getBiometricStatus(userId: string): Promise<any> {
    try {
      return await biometricService.getBiometricStatus(userId);
    } catch (error) {
      return { available: false, enabled: false, type: null };
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

  // Privacy için maskeleme metodları
  private maskUserId(userId: string): string {
    if (userId.length <= 4) {
      return '*'.repeat(userId.length);
    }
    return userId.slice(0, 2) + '*'.repeat(userId.length - 4) + userId.slice(-2);
  }

  private maskEmail(email: string): string {
    const [localPart, domain] = email.split('@');
    if (!localPart || !domain) return email;
    
    const maskedLocal = localPart.length > 2 
      ? localPart[0] + '*'.repeat(localPart.length - 2) + localPart[localPart.length - 1]
      : '*'.repeat(localPart.length);
    
    return `${maskedLocal}@${domain}`;
  }
}

export default new AuthService();
