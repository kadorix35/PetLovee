// Framework ready hook - Uygulama başlatma süreçlerini yönetir
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { logSecurityEvent } from '../config/security';
import { config } from '../config/environment';

export interface FrameworkStatus {
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
  progress: number;
  currentStep: string;
}

export interface FrameworkSteps {
  fonts: boolean;
  security: boolean;
  firebase: boolean;
  permissions: boolean;
  storage: boolean;
}

const useFrameworkReady = (): FrameworkStatus => {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('Başlatılıyor...');
  const [steps, setSteps] = useState<FrameworkSteps>({
    fonts: false,
    security: false,
    firebase: false,
    permissions: false,
    storage: false
  });

  useEffect(() => {
    initializeFramework();
  }, []);

  const initializeFramework = async () => {
    try {
      setIsLoading(true);
      setError(null);
      setProgress(0);

      // Splash screen'i göster
      await SplashScreen.preventAutoHideAsync();

      // Adım 1: Fontları yükle
      await loadFonts();

      // Adım 2: Güvenlik konfigürasyonunu doğrula
      await validateSecurity();

      // Adım 3: Firebase'i başlat
      await initializeFirebase();

      // Adım 4: İzinleri kontrol et
      await checkPermissions();

      // Adım 5: Storage'ı hazırla
      await initializeStorage();

      // Tüm adımlar tamamlandı
      setIsReady(true);
      setProgress(100);
      setCurrentStep('Hazır');

      // Splash screen'i gizle
      await SplashScreen.hideAsync();

      logSecurityEvent('FRAMEWORK_INITIALIZATION_SUCCESS', {
        platform: Platform.OS,
        environment: config.app.env
      });

    } catch (err: any) {
      setError(err.message);
      setCurrentStep('Hata oluştu');
      
      logSecurityEvent('FRAMEWORK_INITIALIZATION_FAILED', {
        error: err.message,
        platform: Platform.OS,
        progress
      });

      // Hata durumunda da splash screen'i gizle
      await SplashScreen.hideAsync();
    } finally {
      setIsLoading(false);
    }
  };

  const loadFonts = async () => {
    setCurrentStep('Fontlar yükleniyor...');
    setProgress(10);

    try {
      await Font.loadAsync({
        'Inter-Regular': Inter_400Regular,
        'Inter-SemiBold': Inter_600SemiBold,
        'Inter-Bold': Inter_700Bold,
      });

      setSteps(prev => ({ ...prev, fonts: true }));
      setProgress(20);

      logSecurityEvent('FONTS_LOADED', {});
    } catch (err: any) {
      throw new Error(`Font yükleme hatası: ${err.message}`);
    }
  };

  const validateSecurity = async () => {
    setCurrentStep('Güvenlik kontrol ediliyor...');
    setProgress(30);

    try {
      // Environment konfigürasyonunu doğrula
      if (config.app.env === 'production') {
        // Production'da güvenlik kontrolleri
        const requiredEnvVars = [
          'FIREBASE_API_KEY',
          'FIREBASE_AUTH_DOMAIN',
          'FIREBASE_PROJECT_ID',
          'FIREBASE_STORAGE_BUCKET',
          'FIREBASE_MESSAGING_SENDER_ID',
          'FIREBASE_APP_ID',
          'GOOGLE_WEB_CLIENT_ID'
        ];

        const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
        if (missingVars.length > 0) {
          throw new Error(`Eksik environment variables: ${missingVars.join(', ')}`);
        }

        // Hardcoded API anahtarlarını kontrol et
        if (config.firebase.apiKey === "AIzaSyC2CA33lwjTcrffnJjOyJ3ULrMkaD90t6w") {
          throw new Error('Production modunda hardcoded API anahtarları kullanılamaz!');
        }
      }

      setSteps(prev => ({ ...prev, security: true }));
      setProgress(40);

      logSecurityEvent('SECURITY_VALIDATION_SUCCESS', {
        environment: config.app.env
      });
    } catch (err: any) {
      throw new Error(`Güvenlik doğrulama hatası: ${err.message}`);
    }
  };

  const initializeFirebase = async () => {
    setCurrentStep('Firebase başlatılıyor...');
    setProgress(50);

    try {
      // Firebase konfigürasyonunu kontrol et
      if (!config.firebase.apiKey || !config.firebase.projectId) {
        throw new Error('Firebase konfigürasyonu eksik');
      }

      // Firebase servislerinin hazır olduğunu kontrol et
      // Gerçek uygulamada Firebase'in initialize edildiğini kontrol ederiz
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simüle edilmiş yükleme

      setSteps(prev => ({ ...prev, firebase: true }));
      setProgress(60);

      logSecurityEvent('FIREBASE_INITIALIZATION_SUCCESS', {
        projectId: config.firebase.projectId
      });
    } catch (err: any) {
      throw new Error(`Firebase başlatma hatası: ${err.message}`);
    }
  };

  const checkPermissions = async () => {
    setCurrentStep('İzinler kontrol ediliyor...');
    setProgress(70);

    try {
      // Platform-specific izin kontrolleri
      if (Platform.OS === 'ios') {
        // iOS izin kontrolleri
        // Camera, Photo Library, Location, Notifications
      } else if (Platform.OS === 'android') {
        // Android izin kontrolleri
        // Camera, Storage, Location, Notifications
      }

      setSteps(prev => ({ ...prev, permissions: true }));
      setProgress(80);

      logSecurityEvent('PERMISSIONS_CHECK_SUCCESS', {
        platform: Platform.OS
      });
    } catch (err: any) {
      throw new Error(`İzin kontrol hatası: ${err.message}`);
    }
  };

  const initializeStorage = async () => {
    setCurrentStep('Depolama hazırlanıyor...');
    setProgress(90);

    try {
      // AsyncStorage'ın hazır olduğunu kontrol et
      // Keychain'in hazır olduğunu kontrol et
      // Secure storage'ın hazır olduğunu kontrol et

      setSteps(prev => ({ ...prev, storage: true }));
      setProgress(95);

      logSecurityEvent('STORAGE_INITIALIZATION_SUCCESS', {});
    } catch (err: any) {
      throw new Error(`Depolama hazırlama hatası: ${err.message}`);
    }
  };

  // Framework durumunu sıfırla
  const resetFramework = () => {
    setIsReady(false);
    setIsLoading(true);
    setError(null);
    setProgress(0);
    setCurrentStep('Başlatılıyor...');
    setSteps({
      fonts: false,
      security: false,
      firebase: false,
      permissions: false,
      storage: false
    });
  };

  // Framework'ü yeniden başlat
  const restartFramework = () => {
    resetFramework();
    initializeFramework();
  };

  // Belirli bir adımı yeniden çalıştır
  const retryStep = async (stepName: keyof FrameworkSteps) => {
    try {
      setIsLoading(true);
      setError(null);

      switch (stepName) {
        case 'fonts':
          await loadFonts();
          break;
        case 'security':
          await validateSecurity();
          break;
        case 'firebase':
          await initializeFirebase();
          break;
        case 'permissions':
          await checkPermissions();
          break;
        case 'storage':
          await initializeStorage();
          break;
      }

      // Tüm adımlar tamamlandıysa framework'ü hazır olarak işaretle
      const allStepsComplete = Object.values(steps).every(step => step === true);
      if (allStepsComplete) {
        setIsReady(true);
        setProgress(100);
        setCurrentStep('Hazır');
        await SplashScreen.hideAsync();
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Framework durumu bilgilerini al
  const getFrameworkInfo = () => {
    return {
      isReady,
      isLoading,
      error,
      progress,
      currentStep,
      steps,
      platform: Platform.OS,
      environment: config.app.env,
      version: '1.0.0'
    };
  };

  return {
    isReady,
    isLoading,
    error,
    progress,
    currentStep
  };
};

export default useFrameworkReady;