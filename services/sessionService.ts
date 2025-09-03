// Session management service
import * as Keychain from 'react-native-keychain';
import { logSecurityEvent, generateSecureString } from '../config/security';
import { securityConfig } from '../config/security';

export interface SessionData {
  userId: string;
  email: string;
  displayName: string;
  photoURL?: string;
  deviceFingerprint: string;
  userAgent: string;
  createdAt: string;
  lastActivity: string;
  expiresAt: string;
}

export interface SessionResult {
  success: boolean;
  sessionId?: string;
  sessionData?: SessionData;
  error?: string;
}

export interface SessionInfo {
  sessionId: string;
  userId: string;
  createdAt: string;
  lastActivity: string;
  expiresAt: string;
  deviceInfo: string;
  isActive: boolean;
}

class SessionService {
  private readonly SESSION_PREFIX = 'session_';
  private readonly USER_SESSIONS_KEY = 'user_sessions';
  private readonly ACTIVE_SESSION_KEY = 'active_session';

  // Session oluştur
  async createSession(sessionData: Omit<SessionData, 'createdAt' | 'lastActivity' | 'expiresAt'>): Promise<SessionResult> {
    try {
      const sessionId = generateSecureString(32);
      const now = new Date();
      const expiresAt = new Date(now.getTime() + (securityConfig.session.maxInactiveTime * 60 * 1000));

      const fullSessionData: SessionData = {
        ...sessionData,
        createdAt: now.toISOString(),
        lastActivity: now.toISOString(),
        expiresAt: expiresAt.toISOString()
      };

      // Session'ı keychain'e kaydet
      await Keychain.setInternetCredentials(
        `${this.SESSION_PREFIX}${sessionId}`,
        sessionId,
        JSON.stringify(fullSessionData)
      );

      // Kullanıcının aktif session'larını güncelle
      await this.addUserSession(sessionData.userId, sessionId);

      // Aktif session'ı kaydet
      await Keychain.setInternetCredentials(
        this.ACTIVE_SESSION_KEY,
        sessionData.userId,
        sessionId
      );

      logSecurityEvent('SESSION_CREATED', {
        userId: this.maskUserId(sessionData.userId),
        sessionId: this.maskSessionId(sessionId),
        deviceFingerprint: this.maskDeviceFingerprint(sessionData.deviceFingerprint)
      });

      return {
        success: true,
        sessionId,
        sessionData: fullSessionData
      };
    } catch (error: any) {
      logSecurityEvent('SESSION_CREATE_FAILED', {
        userId: this.maskUserId(sessionData.userId),
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  // Session doğrula
  async validateSession(sessionId: string): Promise<SessionResult> {
    try {
      const credentials = await Keychain.getInternetCredentials(`${this.SESSION_PREFIX}${sessionId}`);
      if (!credentials) {
        return {
          success: false,
          error: 'Session bulunamadı'
        };
      }

      const sessionData: SessionData = JSON.parse(credentials.password);
      const now = new Date();
      const expiresAt = new Date(sessionData.expiresAt);

      // Session süresi kontrolü
      if (now > expiresAt) {
        await this.invalidateSession(sessionId);
        return {
          success: false,
          error: 'Session süresi dolmuş'
        };
      }

      // Son aktivite zamanını güncelle
      sessionData.lastActivity = now.toISOString();
      await Keychain.setInternetCredentials(
        `${this.SESSION_PREFIX}${sessionId}`,
        sessionId,
        JSON.stringify(sessionData)
      );

      logSecurityEvent('SESSION_VALIDATED', {
        userId: this.maskUserId(sessionData.userId),
        sessionId: this.maskSessionId(sessionId)
      });

      return {
        success: true,
        sessionId,
        sessionData
      };
    } catch (error: any) {
      logSecurityEvent('SESSION_VALIDATION_FAILED', {
        sessionId: this.maskSessionId(sessionId),
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  // Session yenile
  async refreshSession(sessionId: string): Promise<SessionResult> {
    try {
      const validationResult = await this.validateSession(sessionId);
      if (!validationResult.success || !validationResult.sessionData) {
        return validationResult;
      }

      const sessionData = validationResult.sessionData;
      const now = new Date();
      const newExpiresAt = new Date(now.getTime() + (securityConfig.session.maxInactiveTime * 60 * 1000));

      // Session süresini uzat
      const updatedSessionData: SessionData = {
        ...sessionData,
        lastActivity: now.toISOString(),
        expiresAt: newExpiresAt.toISOString()
      };

      await Keychain.setInternetCredentials(
        `${this.SESSION_PREFIX}${sessionId}`,
        sessionId,
        JSON.stringify(updatedSessionData)
      );

      logSecurityEvent('SESSION_REFRESHED', {
        userId: this.maskUserId(sessionData.userId),
        sessionId: this.maskSessionId(sessionId)
      });

      return {
        success: true,
        sessionId,
        sessionData: updatedSessionData
      };
    } catch (error: any) {
      logSecurityEvent('SESSION_REFRESH_FAILED', {
        sessionId: this.maskSessionId(sessionId),
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  }

  // Session'ı sonlandır
  async invalidateSession(sessionId: string): Promise<boolean> {
    try {
      // Session'ı keychain'den sil
      await Keychain.resetInternetCredentials(`${this.SESSION_PREFIX}${sessionId}`);

      // Kullanıcının session listesinden kaldır
      const credentials = await Keychain.getInternetCredentials(`${this.SESSION_PREFIX}${sessionId}`);
      if (credentials) {
        const sessionData: SessionData = JSON.parse(credentials.password);
        await this.removeUserSession(sessionData.userId, sessionId);
      }

      logSecurityEvent('SESSION_INVALIDATED', {
        sessionId: this.maskSessionId(sessionId)
      });

      return true;
    } catch (error: any) {
      logSecurityEvent('SESSION_INVALIDATION_FAILED', {
        sessionId: this.maskSessionId(sessionId),
        error: error.message
      });
      return false;
    }
  }

  // Kullanıcının tüm session'larını sonlandır
  async invalidateAllUserSessions(userId: string): Promise<boolean> {
    try {
      const userSessions = await this.getUserSessions(userId);
      
      for (const sessionId of userSessions) {
        await this.invalidateSession(sessionId);
      }

      // Kullanıcı session listesini temizle
      await Keychain.resetInternetCredentials(`${this.USER_SESSIONS_KEY}_${userId}`);

      logSecurityEvent('ALL_USER_SESSIONS_INVALIDATED', {
        userId: this.maskUserId(userId),
        sessionCount: userSessions.length
      });

      return true;
    } catch (error: any) {
      logSecurityEvent('ALL_USER_SESSIONS_INVALIDATION_FAILED', {
        userId: this.maskUserId(userId),
        error: error.message
      });
      return false;
    }
  }

  // Kullanıcının session'larını al
  async getUserSessions(userId: string): Promise<string[]> {
    try {
      const credentials = await Keychain.getInternetCredentials(`${this.USER_SESSIONS_KEY}_${userId}`);
      if (credentials) {
        return JSON.parse(credentials.password);
      }
      return [];
    } catch (error: any) {
      return [];
    }
  }

  // Kullanıcının session bilgilerini al
  async getUserSessionInfo(userId: string): Promise<SessionInfo[]> {
    try {
      const sessionIds = await this.getUserSessions(userId);
      const sessionInfos: SessionInfo[] = [];

      for (const sessionId of sessionIds) {
        const credentials = await Keychain.getInternetCredentials(`${this.SESSION_PREFIX}${sessionId}`);
        if (credentials) {
          const sessionData: SessionData = JSON.parse(credentials.password);
          const now = new Date();
          const expiresAt = new Date(sessionData.expiresAt);

          sessionInfos.push({
            sessionId,
            userId: sessionData.userId,
            createdAt: sessionData.createdAt,
            lastActivity: sessionData.lastActivity,
            expiresAt: sessionData.expiresAt,
            deviceInfo: `${sessionData.userAgent} - ${this.maskDeviceFingerprint(sessionData.deviceFingerprint)}`,
            isActive: now <= expiresAt
          });
        }
      }

      return sessionInfos;
    } catch (error: any) {
      return [];
    }
  }

  // Aktif session'ı al
  async getActiveSession(userId: string): Promise<string | null> {
    try {
      const credentials = await Keychain.getInternetCredentials(this.ACTIVE_SESSION_KEY);
      if (credentials && credentials.username === userId) {
        return credentials.password;
      }
      return null;
    } catch (error: any) {
      return null;
    }
  }

  // Session'ı aktif yap
  async setActiveSession(userId: string, sessionId: string): Promise<boolean> {
    try {
      await Keychain.setInternetCredentials(
        this.ACTIVE_SESSION_KEY,
        userId,
        sessionId
      );
      return true;
    } catch (error: any) {
      return false;
    }
  }

  // Eski session'ları temizle
  async cleanupExpiredSessions(): Promise<number> {
    try {
      let cleanedCount = 0;
      const now = new Date();

      // Tüm session'ları kontrol et (bu gerçek uygulamada veritabanından yapılır)
      // Bu örnekte sadece log yazıyoruz
      logSecurityEvent('SESSION_CLEANUP_STARTED', {});

      // Gerçek implementasyonda:
      // 1. Tüm session'ları veritabanından al
      // 2. Süresi dolmuş olanları sil
      // 3. Temizlenen sayısını döndür

      logSecurityEvent('SESSION_CLEANUP_COMPLETED', {
        cleanedCount
      });

      return cleanedCount;
    } catch (error: any) {
      logSecurityEvent('SESSION_CLEANUP_FAILED', {
        error: error.message
      });
      return 0;
    }
  }

  // Session güvenlik kontrolü
  async checkSessionSecurity(sessionId: string, currentDeviceFingerprint: string): Promise<{
    isSecure: boolean;
    warnings: string[];
  }> {
    try {
      const credentials = await Keychain.getInternetCredentials(`${this.SESSION_PREFIX}${sessionId}`);
      if (!credentials) {
        return {
          isSecure: false,
          warnings: ['Session bulunamadı']
        };
      }

      const sessionData: SessionData = JSON.parse(credentials.password);
      const warnings: string[] = [];

      // Device fingerprint kontrolü
      if (sessionData.deviceFingerprint !== currentDeviceFingerprint) {
        warnings.push('Farklı cihazdan erişim tespit edildi');
      }

      // Son aktivite kontrolü
      const lastActivity = new Date(sessionData.lastActivity);
      const now = new Date();
      const inactiveTime = now.getTime() - lastActivity.getTime();
      const inactiveHours = inactiveTime / (1000 * 60 * 60);

      if (inactiveHours > 24) {
        warnings.push('Uzun süreli inaktivite tespit edildi');
      }

      // IP adresi kontrolü (gerçek uygulamada)
      // if (sessionData.ipAddress !== currentIpAddress) {
      //   warnings.push('Farklı IP adresinden erişim tespit edildi');
      // }

      const isSecure = warnings.length === 0;

      if (!isSecure) {
        logSecurityEvent('SESSION_SECURITY_WARNING', {
          sessionId: this.maskSessionId(sessionId),
          userId: this.maskUserId(sessionData.userId),
          warnings
        });
      }

      return {
        isSecure,
        warnings
      };
    } catch (error: any) {
      return {
        isSecure: false,
        warnings: ['Güvenlik kontrolü başarısız']
      };
    }
  }

  // Kullanıcı session'ına ekle
  private async addUserSession(userId: string, sessionId: string): Promise<void> {
    try {
      const existingSessions = await this.getUserSessions(userId);
      if (!existingSessions.includes(sessionId)) {
        existingSessions.push(sessionId);
        await Keychain.setInternetCredentials(
          `${this.USER_SESSIONS_KEY}_${userId}`,
          userId,
          JSON.stringify(existingSessions)
        );
      }
    } catch (error: any) {
      console.warn('Kullanıcı session eklenirken hata:', error);
    }
  }

  // Kullanıcı session'ından kaldır
  private async removeUserSession(userId: string, sessionId: string): Promise<void> {
    try {
      const existingSessions = await this.getUserSessions(userId);
      const updatedSessions = existingSessions.filter(id => id !== sessionId);
      
      if (updatedSessions.length > 0) {
        await Keychain.setInternetCredentials(
          `${this.USER_SESSIONS_KEY}_${userId}`,
          userId,
          JSON.stringify(updatedSessions)
        );
      } else {
        await Keychain.resetInternetCredentials(`${this.USER_SESSIONS_KEY}_${userId}`);
      }
    } catch (error: any) {
      console.warn('Kullanıcı session kaldırılırken hata:', error);
    }
  }

  // Session otomatik yenileme kontrolü
  async checkAutoRefresh(sessionId: string): Promise<boolean> {
    try {
      const credentials = await Keychain.getInternetCredentials(`${this.SESSION_PREFIX}${sessionId}`);
      if (!credentials) {
        return false;
      }

      const sessionData: SessionData = JSON.parse(credentials.password);
      const now = new Date();
      const expiresAt = new Date(sessionData.expiresAt);
      const refreshThreshold = new Date(expiresAt.getTime() - (securityConfig.session.refreshThreshold * 60 * 1000));

      return now >= refreshThreshold;
    } catch (error: any) {
      return false;
    }
  }

  // Session istatistikleri
  async getSessionStats(userId: string): Promise<{
    totalSessions: number;
    activeSessions: number;
    expiredSessions: number;
    lastActivity: string | null;
  }> {
    try {
      const sessionInfos = await this.getUserSessionInfo(userId);
      const now = new Date();

      const activeSessions = sessionInfos.filter(info => info.isActive).length;
      const expiredSessions = sessionInfos.filter(info => !info.isActive).length;
      const lastActivity = sessionInfos.length > 0 
        ? sessionInfos.reduce((latest, info) => 
            new Date(info.lastActivity) > new Date(latest) ? info.lastActivity : latest, 
            sessionInfos[0].lastActivity
          )
        : null;

      return {
        totalSessions: sessionInfos.length,
        activeSessions,
        expiredSessions,
        lastActivity
      };
    } catch (error: any) {
      return {
        totalSessions: 0,
        activeSessions: 0,
        expiredSessions: 0,
        lastActivity: null
      };
    }
  }

  // Privacy için maskeleme metodları
  private maskUserId(userId: string): string {
    if (userId.length <= 4) {
      return '*'.repeat(userId.length);
    }
    return userId.slice(0, 2) + '*'.repeat(userId.length - 4) + userId.slice(-2);
  }

  private maskSessionId(sessionId: string): string {
    if (sessionId.length <= 8) {
      return '*'.repeat(sessionId.length);
    }
    return sessionId.slice(0, 4) + '*'.repeat(sessionId.length - 8) + sessionId.slice(-4);
  }

  private maskDeviceFingerprint(fingerprint: string): string {
    if (fingerprint.length <= 8) {
      return '*'.repeat(fingerprint.length);
    }
    return fingerprint.slice(0, 4) + '*'.repeat(fingerprint.length - 8) + fingerprint.slice(-4);
  }
}

export default new SessionService();