// Two-Factor Authentication (2FA) service
import * as Keychain from 'react-native-keychain';
import { logSecurityEvent } from '../config/security';
import { generateSecureString } from '../config/security';

export interface TwoFactorResult {
  success: boolean;
  error?: string;
  backupCodes?: string[];
  qrCode?: string;
  secret?: string;
}

export interface TwoFactorStatus {
  enabled: boolean;
  method: 'totp' | 'sms' | 'email' | null;
  backupCodesRemaining: number;
  lastUsed?: string;
}

export interface TwoFactorConfig {
  method: 'totp' | 'sms' | 'email';
  contactInfo?: string; // Phone number for SMS, email for email
  issuer?: string;
  accountName?: string;
}

class TwoFactorService {
  private readonly TOTP_SECRET_KEY = 'totp_secret';
  private readonly BACKUP_CODES_KEY = 'backup_codes';
  private readonly TWO_FACTOR_STATUS_KEY = 'two_factor_status';

  // 2FA'yı etkinleştir
  async enableTwoFactor(userId: string, method: 'totp' | 'sms' | 'email', contactInfo?: string): Promise<TwoFactorResult> {
    try {
      // Mevcut 2FA durumunu kontrol et
      const currentStatus = await this.getTwoFactorStatus(userId);
      if (currentStatus.enabled) {
        return {
          success: false,
          error: '2FA zaten etkin'
        };
      }

      let result: TwoFactorResult;

      switch (method) {
        case 'totp':
          result = await this.enableTOTP(userId);
          break;
        case 'sms':
          result = await this.enableSMS(userId, contactInfo);
          break;
        case 'email':
          result = await this.enableEmail(userId, contactInfo);
          break;
        default:
          return {
            success: false,
            error: 'Desteklenmeyen 2FA metodu'
          };
      }

      if (result.success) {
        // 2FA durumunu kaydet
        await this.saveTwoFactorStatus(userId, {
          enabled: true,
          method,
          backupCodesRemaining: result.backupCodes?.length || 0,
          lastUsed: new Date().toISOString()
        });

        logSecurityEvent('TWO_FACTOR_ENABLED', {
          userId: this.maskUserId(userId),
          method,
          hasBackupCodes: !!result.backupCodes
        });
      }

      return result;
    } catch (error: any) {
      logSecurityEvent('TWO_FACTOR_ENABLE_FAILED', {
        userId: this.maskUserId(userId),
        method,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  // 2FA'yı devre dışı bırak
  async disableTwoFactor(userId: string, password: string): Promise<TwoFactorResult> {
    try {
      // Şifre doğrulaması yap (gerçek uygulamada Firebase Auth ile)
      // Bu örnekte basit bir kontrol yapıyoruz
      if (!password || password.length < 6) {
        return {
          success: false,
          error: 'Geçersiz şifre'
        };
      }

      // 2FA verilerini temizle
      await this.clearTwoFactorData(userId);

      logSecurityEvent('TWO_FACTOR_DISABLED', {
        userId: this.maskUserId(userId)
      });

      return {
        success: true
      };
    } catch (error: any) {
      logSecurityEvent('TWO_FACTOR_DISABLE_FAILED', {
        userId: this.maskUserId(userId),
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  // 2FA durumunu al
  async getTwoFactorStatus(userId: string): Promise<TwoFactorStatus> {
    try {
      const credentials = await Keychain.getInternetCredentials(`${this.TWO_FACTOR_STATUS_KEY}_${userId}`);
      if (credentials) {
        return JSON.parse(credentials.password);
      }

      return {
        enabled: false,
        method: null,
        backupCodesRemaining: 0
      };
    } catch (error: any) {
      return {
        enabled: false,
        method: null,
        backupCodesRemaining: 0
      };
    }
  }

  // 2FA kodunu doğrula
  async verifyTwoFactorCode(userId: string, code: string): Promise<TwoFactorResult> {
    try {
      const status = await this.getTwoFactorStatus(userId);
      if (!status.enabled) {
        return {
          success: false,
          error: '2FA etkin değil'
        };
      }

      let isValid = false;

      switch (status.method) {
        case 'totp':
          isValid = await this.verifyTOTPCode(userId, code);
          break;
        case 'sms':
          isValid = await this.verifySMSCode(userId, code);
          break;
        case 'email':
          isValid = await this.verifyEmailCode(userId, code);
          break;
        default:
          return {
            success: false,
            error: 'Geçersiz 2FA metodu'
          };
      }

      if (isValid) {
        // Son kullanım zamanını güncelle
        await this.updateLastUsed(userId);

        logSecurityEvent('TWO_FACTOR_VERIFICATION_SUCCESS', {
          userId: this.maskUserId(userId),
          method: status.method
        });

        return {
          success: true
        };
      } else {
        logSecurityEvent('TWO_FACTOR_VERIFICATION_FAILED', {
          userId: this.maskUserId(userId),
          method: status.method
        });

        return {
          success: false,
          error: 'Geçersiz 2FA kodu'
        };
      }
    } catch (error: any) {
      logSecurityEvent('TWO_FACTOR_VERIFICATION_ERROR', {
        userId: this.maskUserId(userId),
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  // TOTP (Time-based One-Time Password) etkinleştir
  private async enableTOTP(userId: string): Promise<TwoFactorResult> {
    try {
      // TOTP secret oluştur
      const secret = generateSecureString(32);
      const backupCodes = this.generateBackupCodes(10);

      // Secret'ı kaydet
      await Keychain.setInternetCredentials(
        `${this.TOTP_SECRET_KEY}_${userId}`,
        userId,
        secret
      );

      // Backup kodları kaydet
      await Keychain.setInternetCredentials(
        `${this.BACKUP_CODES_KEY}_${userId}`,
        userId,
        JSON.stringify(backupCodes)
      );

      // QR kod için URL oluştur
      const qrCode = this.generateTOTPQRCode(userId, secret);

      return {
        success: true,
        secret,
        qrCode,
        backupCodes
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // SMS 2FA etkinleştir
  private async enableSMS(userId: string, phoneNumber?: string): Promise<TwoFactorResult> {
    try {
      if (!phoneNumber) {
        return {
          success: false,
          error: 'Telefon numarası gerekli'
        };
      }

      // Telefon numarasını kaydet
      await Keychain.setInternetCredentials(
        `${this.TOTP_SECRET_KEY}_${userId}`,
        userId,
        phoneNumber
      );

      // Backup kodları oluştur
      const backupCodes = this.generateBackupCodes(10);
      await Keychain.setInternetCredentials(
        `${this.BACKUP_CODES_KEY}_${userId}`,
        userId,
        JSON.stringify(backupCodes)
      );

      // Test SMS gönder
      const testCode = this.generateSMSCode();
      // Gerçek uygulamada SMS servisi ile gönderilir
      console.log(`Test SMS Code for ${phoneNumber}: ${testCode}`);

      return {
        success: true,
        backupCodes
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Email 2FA etkinleştir
  private async enableEmail(userId: string, email?: string): Promise<TwoFactorResult> {
    try {
      if (!email) {
        return {
          success: false,
          error: 'Email adresi gerekli'
        };
      }

      // Email adresini kaydet
      await Keychain.setInternetCredentials(
        `${this.TOTP_SECRET_KEY}_${userId}`,
        userId,
        email
      );

      // Backup kodları oluştur
      const backupCodes = this.generateBackupCodes(10);
      await Keychain.setInternetCredentials(
        `${this.BACKUP_CODES_KEY}_${userId}`,
        userId,
        JSON.stringify(backupCodes)
      );

      // Test email gönder
      const testCode = this.generateEmailCode();
      // Gerçek uygulamada email servisi ile gönderilir
      console.log(`Test Email Code for ${email}: ${testCode}`);

      return {
        success: true,
        backupCodes
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // TOTP kodu doğrula
  private async verifyTOTPCode(userId: string, code: string): Promise<boolean> {
    try {
      const credentials = await Keychain.getInternetCredentials(`${this.TOTP_SECRET_KEY}_${userId}`);
      if (!credentials) {
        return false;
      }

      const secret = credentials.password;
      
      // Basit TOTP doğrulama (gerçek uygulamada speakeasy gibi kütüphane kullanılır)
      const currentTime = Math.floor(Date.now() / 1000 / 30);
      const expectedCode = this.generateTOTPCode(secret, currentTime);
      
      return code === expectedCode;
    } catch (error: any) {
      return false;
    }
  }

  // SMS kodu doğrula
  private async verifySMSCode(userId: string, code: string): Promise<boolean> {
    try {
      // Gerçek uygulamada SMS servisi ile doğrulanır
      // Bu örnekte basit bir kontrol yapıyoruz
      return code.length === 6 && /^\d+$/.test(code);
    } catch (error: any) {
      return false;
    }
  }

  // Email kodu doğrula
  private async verifyEmailCode(userId: string, code: string): Promise<boolean> {
    try {
      // Gerçek uygulamada email servisi ile doğrulanır
      // Bu örnekte basit bir kontrol yapıyoruz
      return code.length === 6 && /^\d+$/.test(code);
    } catch (error: any) {
      return false;
    }
  }

  // Backup kodları oluştur
  private generateBackupCodes(count: number): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      codes.push(generateSecureString(8).toUpperCase());
    }
    return codes;
  }

  // TOTP QR kodu oluştur
  private generateTOTPQRCode(userId: string, secret: string): string {
    const issuer = 'PetLovee';
    const accountName = userId;
    return `otpauth://totp/${issuer}:${accountName}?secret=${secret}&issuer=${issuer}`;
  }

  // TOTP kodu oluştur
  private generateTOTPCode(secret: string, time: number): string {
    // Basit TOTP implementasyonu (gerçek uygulamada speakeasy kullanılır)
    const hash = this.simpleHash(secret + time);
    const code = (hash % 1000000).toString().padStart(6, '0');
    return code;
  }

  // Basit hash fonksiyonu
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 32bit integer'a çevir
    }
    return Math.abs(hash);
  }

  // SMS kodu oluştur
  private generateSMSCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Email kodu oluştur
  private generateEmailCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // 2FA durumunu kaydet
  private async saveTwoFactorStatus(userId: string, status: TwoFactorStatus): Promise<void> {
    await Keychain.setInternetCredentials(
      `${this.TWO_FACTOR_STATUS_KEY}_${userId}`,
      userId,
      JSON.stringify(status)
    );
  }

  // Son kullanım zamanını güncelle
  private async updateLastUsed(userId: string): Promise<void> {
    const status = await this.getTwoFactorStatus(userId);
    status.lastUsed = new Date().toISOString();
    await this.saveTwoFactorStatus(userId, status);
  }

  // 2FA verilerini temizle
  private async clearTwoFactorData(userId: string): Promise<void> {
    try {
      await Keychain.resetInternetCredentials(`${this.TOTP_SECRET_KEY}_${userId}`);
      await Keychain.resetInternetCredentials(`${this.BACKUP_CODES_KEY}_${userId}`);
      await Keychain.resetInternetCredentials(`${this.TWO_FACTOR_STATUS_KEY}_${userId}`);
    } catch (error: any) {
      console.warn('2FA verileri temizlenirken hata:', error);
    }
  }

  // Backup kodları al
  async getBackupCodes(userId: string): Promise<string[]> {
    try {
      const credentials = await Keychain.getInternetCredentials(`${this.BACKUP_CODES_KEY}_${userId}`);
      if (credentials) {
        return JSON.parse(credentials.password);
      }
      return [];
    } catch (error: any) {
      return [];
    }
  }

  // Backup kodu kullan
  async useBackupCode(userId: string, code: string): Promise<boolean> {
    try {
      const backupCodes = await this.getBackupCodes(userId);
      const codeIndex = backupCodes.indexOf(code.toUpperCase());
      
      if (codeIndex === -1) {
        return false;
      }

      // Backup kodunu kaldır
      backupCodes.splice(codeIndex, 1);
      
      // Güncellenmiş backup kodlarını kaydet
      await Keychain.setInternetCredentials(
        `${this.BACKUP_CODES_KEY}_${userId}`,
        userId,
        JSON.stringify(backupCodes)
      );

      // 2FA durumunu güncelle
      const status = await this.getTwoFactorStatus(userId);
      status.backupCodesRemaining = backupCodes.length;
      await this.saveTwoFactorStatus(userId, status);

      logSecurityEvent('BACKUP_CODE_USED', {
        userId: this.maskUserId(userId),
        remainingCodes: backupCodes.length
      });

      return true;
    } catch (error: any) {
      return false;
    }
  }

  // Yeni backup kodları oluştur
  async regenerateBackupCodes(userId: string): Promise<TwoFactorResult> {
    try {
      const status = await this.getTwoFactorStatus(userId);
      if (!status.enabled) {
        return {
          success: false,
          error: '2FA etkin değil'
        };
      }

      const newBackupCodes = this.generateBackupCodes(10);
      await Keychain.setInternetCredentials(
        `${this.BACKUP_CODES_KEY}_${userId}`,
        userId,
        JSON.stringify(newBackupCodes)
      );

      // Durumu güncelle
      status.backupCodesRemaining = newBackupCodes.length;
      await this.saveTwoFactorStatus(userId, status);

      logSecurityEvent('BACKUP_CODES_REGENERATED', {
        userId: this.maskUserId(userId)
      });

      return {
        success: true,
        backupCodes: newBackupCodes
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Kullanıcı ID'sini maskele (privacy için)
  private maskUserId(userId: string): string {
    if (userId.length <= 4) {
      return '*'.repeat(userId.length);
    }
    return userId.slice(0, 2) + '*'.repeat(userId.length - 4) + userId.slice(-2);
  }
}

export default new TwoFactorService();