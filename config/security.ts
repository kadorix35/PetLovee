// Güvenlik konfigürasyonu ve yardımcı fonksiyonlar
import { Platform } from 'react-native';
import { config } from './environment';

export interface SecurityConfig {
  rateLimiting: {
    maxRequestsPerMinute: number;
    maxRequestsPerHour: number;
    maxLoginAttempts: number;
    lockoutDuration: number; // dakika
  };
  encryption: {
    algorithm: string;
    keyLength: number;
  };
  validation: {
    maxStringLength: number;
    allowedFileTypes: string[];
    maxFileSize: number; // bytes
  };
  session: {
    maxInactiveTime: number; // dakika
    refreshThreshold: number; // dakika
  };
}

// Güvenlik konfigürasyonu
export const securityConfig: SecurityConfig = {
  rateLimiting: {
    maxRequestsPerMinute: 60,
    maxRequestsPerHour: 1000,
    maxLoginAttempts: 5,
    lockoutDuration: 15,
  },
  encryption: {
    algorithm: 'AES-256-GCM',
    keyLength: 32,
  },
  validation: {
    maxStringLength: 1000,
    allowedFileTypes: ['image/jpeg', 'image/png', 'image/webp', 'video/mp4'],
    maxFileSize: 10 * 1024 * 1024, // 10MB
  },
  session: {
    maxInactiveTime: 30,
    refreshThreshold: 5,
  },
};

// Environment variables validation
export const validateEnvironmentVariables = (): void => {
  const requiredVars = [
    'FIREBASE_API_KEY',
    'FIREBASE_AUTH_DOMAIN',
    'FIREBASE_PROJECT_ID',
    'FIREBASE_STORAGE_BUCKET',
    'FIREBASE_MESSAGING_SENDER_ID',
    'FIREBASE_APP_ID',
    'GOOGLE_WEB_CLIENT_ID',
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
};

// Production güvenlik kontrolleri
export const validateProductionSecurity = (): void => {
  if (config.app.env === 'production') {
    // API anahtarlarının hardcoded olmadığını kontrol et
    const hasHardcodedKeys = 
      config.firebase.apiKey.includes('AIzaSy') && 
      config.firebase.apiKey === process.env.FIREBASE_API_KEY;
    
    if (!hasHardcodedKeys) {
      console.warn('⚠️ Production modunda hardcoded API anahtarları tespit edildi!');
    }

    // Debug modunun kapalı olduğunu kontrol et
    if (__DEV__) {
      console.warn('⚠️ Production modunda debug modu açık!');
    }
  }
};

// Güvenli string oluşturma
export const generateSecureString = (length: number = 32): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Device fingerprint oluşturma
export const generateDeviceFingerprint = (): string => {
  const deviceInfo = {
    platform: Platform.OS,
    version: Platform.Version,
    timestamp: Date.now(),
  };
  
  return btoa(JSON.stringify(deviceInfo));
};

// Güvenlik logları
export const logSecurityEvent = (event: string, details?: any): void => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    event,
    details,
    deviceFingerprint: generateDeviceFingerprint(),
  };
  
  console.log(`[SECURITY] ${timestamp}: ${event}`, details);
  
  // Production'da güvenlik loglarını remote servise gönder
  if (config.app.env === 'production') {
    // TODO: Remote logging service integration
  }
};

export default securityConfig;
