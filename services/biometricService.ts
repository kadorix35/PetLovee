// Biometric authentication service
import { Platform, Alert } from 'react-native';
import TouchID from 'react-native-touch-id';
import * as Keychain from 'react-native-keychain';
import { logSecurityEvent } from '../config/security';

export interface BiometricResult {
  success: boolean;
  error?: string;
  biometryType?: string;
}

export interface BiometricStatus {
  available: boolean;
  enabled: boolean;
  type: string | null;
  error?: string;
}

class BiometricService {
  private readonly BIOMETRIC_KEY = 'biometric_auth_enabled';
  private readonly USER_CREDENTIALS_KEY = 'user_biometric_credentials';

  // Biometric authentication'ın mevcut olup olmadığını kontrol et
  async isBiometricAvailable(): Promise<BiometricStatus> {
    try {
      if (Platform.OS === 'ios') {
        const biometryType = await TouchID.isSupported();
        return {
          available: true,
          enabled: false,
          type: biometryType || 'TouchID'
        };
      } else if (Platform.OS === 'android') {
        const biometryType = await TouchID.isSupported();
        return {
          available: true,
          enabled: false,
          type: biometryType || 'Fingerprint'
        };
      }
      
      return {
        available: false,
        enabled: false,
        type: null,
        error: 'Platform desteklenmiyor'
      };
    } catch (error: any) {
      logSecurityEvent('BIOMETRIC_AVAILABILITY_CHECK_FAILED', {
        error: error.message,
        platform: Platform.OS
      });
      
      return {
        available: false,
        enabled: false,
        type: null,
        error: error.message
      };
    }
  }

  // Biometric authentication'ı etkinleştir
  async enableBiometricAuth(userId: string): Promise<boolean> {
    try {
      // Önce biometric authentication'ın mevcut olduğunu kontrol et
      const status = await this.isBiometricAvailable();
      if (!status.available) {
        throw new Error('Biometric authentication bu cihazda desteklenmiyor');
      }

      // Test authentication yap
      const testResult = await this.authenticateWithBiometric('Biometric authentication\'ı etkinleştirmek için kimliğinizi doğrulayın');
      if (!testResult.success) {
        throw new Error(testResult.error || 'Biometric authentication testi başarısız');
      }

      // Kullanıcı bilgilerini keychain'e kaydet
      await Keychain.setInternetCredentials(
        this.USER_CREDENTIALS_KEY,
        userId,
        JSON.stringify({
          userId,
          enabledAt: new Date().toISOString(),
          biometryType: status.type
        })
      );

      // Etkinleştirme durumunu kaydet
      await Keychain.setInternetCredentials(
        this.BIOMETRIC_KEY,
        userId,
        'enabled'
      );

      logSecurityEvent('BIOMETRIC_AUTH_ENABLED', {
        userId: this.maskUserId(userId),
        biometryType: status.type
      });

      return true;
    } catch (error: any) {
      logSecurityEvent('BIOMETRIC_AUTH_ENABLE_FAILED', {
        userId: this.maskUserId(userId),
        error: error.message
      });
      return false;
    }
  }

  // Biometric authentication'ı devre dışı bırak
  async disableBiometricAuth(userId: string): Promise<boolean> {
    try {
      // Keychain'den kullanıcı bilgilerini sil
      await Keychain.resetInternetCredentials(this.USER_CREDENTIALS_KEY);
      await Keychain.resetInternetCredentials(this.BIOMETRIC_KEY);

      logSecurityEvent('BIOMETRIC_AUTH_DISABLED', {
        userId: this.maskUserId(userId)
      });

      return true;
    } catch (error: any) {
      logSecurityEvent('BIOMETRIC_AUTH_DISABLE_FAILED', {
        userId: this.maskUserId(userId),
        error: error.message
      });
      return false;
    }
  }

  // Biometric authentication durumunu al
  async getBiometricStatus(userId: string): Promise<BiometricStatus> {
    try {
      const availability = await this.isBiometricAvailable();
      if (!availability.available) {
        return availability;
      }

      // Keychain'den etkinleştirme durumunu kontrol et
      const credentials = await Keychain.getInternetCredentials(this.BIOMETRIC_KEY);
      const isEnabled = credentials && credentials.password === 'enabled';

      return {
        available: true,
        enabled: isEnabled,
        type: availability.type
      };
    } catch (error: any) {
      return {
        available: false,
        enabled: false,
        type: null,
        error: error.message
      };
    }
  }

  // Biometric authentication ile giriş yap
  async loginWithBiometric(userId: string): Promise<BiometricResult> {
    try {
      // Önce biometric authentication'ın etkin olduğunu kontrol et
      const status = await this.getBiometricStatus(userId);
      if (!status.enabled) {
        return {
          success: false,
          error: 'Biometric authentication etkin değil'
        };
      }

      // Keychain'den kullanıcı bilgilerini al
      const credentials = await Keychain.getInternetCredentials(this.USER_CREDENTIALS_KEY);
      if (!credentials) {
        return {
          success: false,
          error: 'Biometric credentials bulunamadı'
        };
      }

      const userData = JSON.parse(credentials.password);
      if (userData.userId !== userId) {
        return {
          success: false,
          error: 'Geçersiz kullanıcı kimliği'
        };
      }

      // Biometric authentication yap
      const authResult = await this.authenticateWithBiometric('Giriş yapmak için kimliğinizi doğrulayın');
      if (!authResult.success) {
        return authResult;
      }

      logSecurityEvent('BIOMETRIC_LOGIN_SUCCESS', {
        userId: this.maskUserId(userId),
        biometryType: status.type
      });

      return {
        success: true,
        biometryType: status.type
      };
    } catch (error: any) {
      logSecurityEvent('BIOMETRIC_LOGIN_FAILED', {
        userId: this.maskUserId(userId),
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  // Biometric authentication yap
  private async authenticateWithBiometric(reason: string): Promise<BiometricResult> {
    try {
      const biometryType = await TouchID.authenticate(reason, {
        title: 'Biometric Authentication',
        subTitle: 'Kimliğinizi doğrulayın',
        description: reason,
        fallbackLabel: 'Şifre Kullan',
        cancelLabel: 'İptal'
      });

      return {
        success: true,
        biometryType: biometryType || 'Biometric'
      };
    } catch (error: any) {
      let errorMessage = 'Biometric authentication başarısız';
      
      if (error.code === 'UserCancel') {
        errorMessage = 'Kullanıcı iptal etti';
      } else if (error.code === 'UserFallback') {
        errorMessage = 'Kullanıcı şifre kullanmayı seçti';
      } else if (error.code === 'SystemCancel') {
        errorMessage = 'Sistem tarafından iptal edildi';
      } else if (error.code === 'PasscodeNotSet') {
        errorMessage = 'Passcode ayarlanmamış';
      } else if (error.code === 'FingerprintScannerNotAvailable') {
        errorMessage = 'Fingerprint scanner mevcut değil';
      } else if (error.code === 'FingerprintScannerNotEnrolled') {
        errorMessage = 'Fingerprint kayıtlı değil';
      } else if (error.code === 'FingerprintScannerLockout') {
        errorMessage = 'Fingerprint scanner kilitli';
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  // Biometric authentication'ı test et
  async testBiometricAuth(): Promise<BiometricResult> {
    try {
      const status = await this.isBiometricAvailable();
      if (!status.available) {
        return {
          success: false,
          error: status.error || 'Biometric authentication desteklenmiyor'
        };
      }

      return await this.authenticateWithBiometric('Biometric authentication testi');
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Biometric authentication'ı sıfırla
  async resetBiometricAuth(): Promise<boolean> {
    try {
      await Keychain.resetInternetCredentials(this.USER_CREDENTIALS_KEY);
      await Keychain.resetInternetCredentials(this.BIOMETRIC_KEY);
      
      logSecurityEvent('BIOMETRIC_AUTH_RESET', {});
      return true;
    } catch (error: any) {
      logSecurityEvent('BIOMETRIC_AUTH_RESET_FAILED', {
        error: error.message
      });
      return false;
    }
  }

  // Kullanıcı ID'sini maskele (privacy için)
  private maskUserId(userId: string): string {
    if (userId.length <= 4) {
      return '*'.repeat(userId.length);
    }
    return userId.slice(0, 2) + '*'.repeat(userId.length - 4) + userId.slice(-2);
  }

  // Biometric authentication ayarlarını göster
  async showBiometricSettings(): Promise<void> {
    try {
      if (Platform.OS === 'ios') {
        await TouchID.isSupported();
        // iOS'ta otomatik olarak ayarlar açılır
      } else if (Platform.OS === 'android') {
        // Android'de ayarlar uygulamasını aç
        Alert.alert(
          'Biometric Ayarları',
          'Biometric authentication ayarlarını yapmak için cihaz ayarlarına gidin.',
          [
            { text: 'İptal', style: 'cancel' },
            { text: 'Ayarlar', onPress: () => {
              // Android ayarlar uygulamasını aç
              // Bu kısım native module gerektirir
            }}
          ]
        );
      }
    } catch (error: any) {
      logSecurityEvent('BIOMETRIC_SETTINGS_OPEN_FAILED', {
        error: error.message
      });
    }
  }
}

export default new BiometricService();