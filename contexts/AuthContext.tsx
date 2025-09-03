import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AuthService, { User, AuthError } from '@/services/authService';
import NotificationService from '@/services/notificationService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithFacebook: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  sendEmailVerification: () => Promise<void>;
  checkEmailVerification: () => Promise<boolean>;
  getCurrentUserForVerification: () => Promise<{ email: string; isVerified: boolean } | null>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Auth state değişikliklerini dinle
    const unsubscribe = AuthService.onAuthStateChanged(async (user) => {
      setUser(user);
      setLoading(false);
      
      // Kullanıcı giriş yaptığında FCM token'ını kaydet
      if (user) {
        try {
          await NotificationService.initialize();
          await NotificationService.saveFCMTokenToFirestore(user.uid);
        } catch (error) {
          console.error('FCM token kaydedilemedi:', error);
        }
      }
    });

    return unsubscribe;
  }, []);

  const handleError = (error: any) => {
    if (error instanceof Error) {
      setError(error.message);
    } else if (typeof error === 'string') {
      setError(error);
    } else {
      setError('Bilinmeyen bir hata oluştu');
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      setError(null);
      setLoading(true);
      await AuthService.signUpWithEmail(email, password, displayName);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      await AuthService.signInWithEmail(email, password);
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setError(null);
      setLoading(true);
      await AuthService.signInWithGoogle();
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const signInWithFacebook = async () => {
    try {
      setError(null);
      setLoading(true);
      await AuthService.signInWithFacebook();
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      setLoading(true);
      
      // Çıkış yapmadan önce FCM token'ını sil
      if (user) {
        await NotificationService.removeFCMToken(user.uid);
      }
      
      await AuthService.signOut();
    } catch (error) {
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setError(null);
      await AuthService.resetPassword(email);
    } catch (error) {
      handleError(error);
    }
  };

  const sendEmailVerification = async () => {
    try {
      setError(null);
      await AuthService.sendEmailVerification();
    } catch (error) {
      handleError(error);
    }
  };

  const checkEmailVerification = async () => {
    try {
      setError(null);
      return await AuthService.checkEmailVerification();
    } catch (error) {
      handleError(error);
      return false;
    }
  };

  const getCurrentUserForVerification = async () => {
    try {
      setError(null);
      return await AuthService.getCurrentUserForVerification();
    } catch (error) {
      handleError(error);
      return null;
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signInWithFacebook,
    signOut,
    resetPassword,
    sendEmailVerification,
    checkEmailVerification,
    getCurrentUserForVerification,
    error,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
