// Environment configuration for PetLovee
// Bu dosya production'da güvenlik için kullanılır

export interface EnvironmentConfig {
  firebase: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId: string;
    databaseURL: string;
  };
  google: {
    webClientId: string;
  };
  fcm: {
    serverKey: string;
  };
  app: {
    env: 'development' | 'production';
    debugMode: boolean;
  };
  security: {
    enableRateLimiting: boolean;
    enableBiometricAuth: boolean;
    enable2FA: boolean;
    enableEncryption: boolean;
  };
}

// Development environment (varsayılan)
const developmentConfig: EnvironmentConfig = {
  firebase: {
    apiKey: "AIzaSyCk_ZLHIbhCR-iz462UmJp3E63yAc1CdHk",
    authDomain: "petlove-app-2ef62.firebaseapp.com",
    projectId: "petlove-app-2ef62",
    storageBucket: "petlove-app-2ef62.firebasestorage.app",
    messagingSenderId: "458534082610",
    appId: "1:458534082610:web:1e424a03eee47118b0c42b",
    measurementId: "G-G4XCVG8C7T",
    databaseURL: "https://petlove-app-2ef62-default-rtdb.europe-west1.firebasedatabase.app/"
  },
  google: {
    webClientId: "458534082610-i6v4digkbnivrnlap4bcp510lvkvsrpj.apps.googleusercontent.com"
  },
  fcm: {
    serverKey: process.env.FCM_SERVER_KEY || ""
  },
  app: {
    env: 'development',
    debugMode: true
  },
  security: {
    enableRateLimiting: true,
    enableBiometricAuth: false,
    enable2FA: false,
    enableEncryption: false
  }
};

// Production environment
const productionConfig: EnvironmentConfig = {
  firebase: {
    // Production'da bu değerler environment variables'dan alınmalı
    apiKey: process.env.FIREBASE_API_KEY || "",
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || "",
    projectId: process.env.FIREBASE_PROJECT_ID || "",
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "",
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "",
    appId: process.env.FIREBASE_APP_ID || "",
    measurementId: process.env.FIREBASE_MEASUREMENT_ID || "",
    databaseURL: process.env.FIREBASE_DATABASE_URL || ""
  },
  google: {
    webClientId: process.env.GOOGLE_WEB_CLIENT_ID || ""
  },
  fcm: {
    serverKey: process.env.FCM_SERVER_KEY || ""
  },
  app: {
    env: 'production',
    debugMode: false
  },
  security: {
    enableRateLimiting: true,
    enableBiometricAuth: true,
    enable2FA: true,
    enableEncryption: true
  }
};

// Environment'ı belirle
const isProduction = process.env.NODE_ENV === 'production' || process.env.APP_ENV === 'production';

// Aktif konfigürasyonu export et
export const config: EnvironmentConfig = isProduction ? productionConfig : developmentConfig;

// Güvenlik kontrolü
export const validateConfig = (): void => {
  if (config.app.env === 'production') {
    console.warn('⚠️ Production modunda çalışıyorsunuz!');
    
    // Production'da environment variables kontrolü
    const requiredEnvVars = [
      'FIREBASE_API_KEY',
      'FIREBASE_AUTH_DOMAIN',
      'FIREBASE_PROJECT_ID',
      'FIREBASE_STORAGE_BUCKET',
      'FIREBASE_MESSAGING_SENDER_ID',
      'FIREBASE_APP_ID',
      'FIREBASE_DATABASE_URL',
      'GOOGLE_WEB_CLIENT_ID',
      'FCM_SERVER_KEY'
    ];
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.error('❌ Production için gerekli environment variables eksik:', missingVars);
      throw new Error(`Missing environment variables: ${missingVars.join(', ')}`);
    }

    // Production'da hardcoded değerlerin olmadığını kontrol et
    if (config.firebase.apiKey === "AIzaSyCk_ZLHIbhCR-iz462UmJp3E63yAc1CdHk") {
      throw new Error('Production modunda hardcoded API anahtarları kullanılamaz!');
    }
  }
};

export default config;
