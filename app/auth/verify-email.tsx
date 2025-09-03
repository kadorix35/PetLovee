import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Mail, CheckCircle, RefreshCw, ArrowLeft, Clock } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';

const { width } = Dimensions.get('window');

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { 
    sendEmailVerification, 
    checkEmailVerification, 
    getCurrentUserForVerification,
    error, 
    clearError 
  } = useAuth();
  
  const [userEmail, setUserEmail] = useState<string>('');
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [lastSentTime, setLastSentTime] = useState<Date | null>(null);
  const [canResend, setCanResend] = useState<boolean>(true);

  useEffect(() => {
    loadUserInfo();
  }, []);

  useEffect(() => {
    // Resend timer - 60 saniye bekle
    if (lastSentTime) {
      setCanResend(false);
      const timer = setTimeout(() => {
        setCanResend(true);
      }, 60000); // 60 saniye

      return () => clearTimeout(timer);
    }
  }, [lastSentTime]);

  const loadUserInfo = async () => {
    setIsChecking(true);
    try {
      const userInfo = await getCurrentUserForVerification();
      if (userInfo) {
        setUserEmail(userInfo.email);
        setIsVerified(userInfo.isVerified);
      }
    } catch (error) {
      console.error('Kullanıcı bilgileri yüklenemedi:', error);
    } finally {
      setIsChecking(false);
    }
  };

  const handleSendVerification = async () => {
    if (!canResend) {
      Alert.alert('Bekleyin', 'Lütfen 60 saniye bekleyin');
      return;
    }

    setIsLoading(true);
    try {
      await sendEmailVerification();
      setLastSentTime(new Date());
      Alert.alert(
        'E-posta Gönderildi',
        'Doğrulama e-postası gönderildi. Lütfen e-postanızı kontrol edin.'
      );
    } catch (error) {
      // Error AuthContext'te handle ediliyor
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    setIsChecking(true);
    try {
      const verified = await checkEmailVerification();
      setIsVerified(verified);
      
      if (verified) {
        Alert.alert(
          'Başarılı!',
          'E-posta adresiniz başarıyla doğrulandı.',
          [
            {
              text: 'Tamam',
              onPress: () => router.replace('/(tabs)')
            }
          ]
        );
      } else {
        Alert.alert('Bilgi', 'E-posta adresiniz henüz doğrulanmamış. Lütfen e-postanızı kontrol edin.');
      }
    } catch (error) {
      Alert.alert('Hata', 'Doğrulama durumu kontrol edilemedi');
    } finally {
      setIsChecking(false);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'E-posta Doğrulamasını Atla',
      'E-posta doğrulamasını şimdi atlayabilirsiniz, ancak hesabınızın güvenliği için daha sonra doğrulamanızı öneririz.',
      [
        {
          text: 'İptal',
          style: 'cancel'
        },
        {
          text: 'Atla',
          onPress: () => router.replace('/(tabs)')
        }
      ]
    );
  };

  const getRemainingTime = () => {
    if (!lastSentTime || canResend) return 0;
    
    const elapsed = Date.now() - lastSentTime.getTime();
    const remaining = Math.max(0, 60000 - elapsed);
    return Math.ceil(remaining / 1000);
  };

  const remainingTime = getRemainingTime();

  if (isVerified) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.header}
        >
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft color="#FFFFFF" size={24} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>E-posta Doğrulandı</Text>
          <View style={styles.placeholder} />
        </LinearGradient>

        <View style={styles.content}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.form}>
              <View style={styles.successContainer}>
                <View style={styles.successIconContainer}>
                  <CheckCircle color="#10B981" size={64} strokeWidth={2} />
                </View>
                <Text style={styles.successTitle}>E-posta Doğrulandı!</Text>
                <Text style={styles.successMessage}>
                  <Text style={styles.emailText}>{userEmail}</Text> adresi başarıyla doğrulandı.
                </Text>
                <Text style={styles.instructionText}>
                  Artık tüm özelliklerden yararlanabilirsiniz.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.continueButton}
                onPress={() => router.replace('/(tabs)')}
              >
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.continueGradient}
                >
                  <Text style={styles.continueButtonText}>Devam Et</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft color="#FFFFFF" size={24} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>E-posta Doğrula</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <View style={styles.content}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.form}>
            <View style={styles.logoContainer}>
              <View style={styles.logoBackground}>
                <View style={styles.pawIcon}>
                  <View style={styles.pawPad} />
                  <View style={[styles.pawToe, styles.toe1]} />
                  <View style={[styles.pawToe, styles.toe2]} />
                </View>
              </View>
              <Text style={styles.logoText}>PetLove</Text>
            </View>

            <View style={styles.iconContainer}>
              <View style={styles.mailIconContainer}>
                <Mail color="#667eea" size={48} strokeWidth={2} />
              </View>
            </View>

            <Text style={styles.welcomeText}>E-posta Adresinizi Doğrulayın</Text>
            <Text style={styles.subtitle}>
              <Text style={styles.emailText}>{userEmail}</Text> adresine doğrulama e-postası gönderdik.
            </Text>

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity onPress={clearError}>
                  <Text style={styles.dismissText}>×</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.instructionContainer}>
              <Text style={styles.instructionTitle}>Yapmanız gerekenler:</Text>
              <Text style={styles.instructionText}>
                1. E-posta kutunuzu kontrol edin{'\n'}
                2. "PetLove E-posta Doğrulama" başlıklı e-postayı bulun{'\n'}
                3. E-postadaki "E-postayı Doğrula" butonuna tıklayın{'\n'}
                4. Bu sayfaya geri dönün ve "Doğrulamayı Kontrol Et" butonuna tıklayın
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.checkButton, isChecking && styles.disabledButton]}
              onPress={handleCheckVerification}
              disabled={isChecking}
            >
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.checkGradient}
              >
                {isChecking ? (
                  <RefreshCw color="#FFFFFF" size={20} strokeWidth={2} />
                ) : (
                  <CheckCircle color="#FFFFFF" size={20} strokeWidth={2} />
                )}
                <Text style={styles.checkButtonText}>
                  {isChecking ? 'Kontrol Ediliyor...' : 'Doğrulamayı Kontrol Et'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.resendButton, (!canResend || isLoading) && styles.disabledButton]}
              onPress={handleSendVerification}
              disabled={!canResend || isLoading}
            >
              <Mail color={canResend ? "#667eea" : "#9CA3AF"} size={20} strokeWidth={2} />
              <Text style={[
                styles.resendButtonText,
                { color: canResend ? "#667eea" : "#9CA3AF" }
              ]}>
                {isLoading ? 'Gönderiliyor...' : 
                 !canResend ? `Tekrar gönder (${remainingTime}s)` : 
                 'E-postayı Tekrar Gönder'}
              </Text>
            </TouchableOpacity>

            <View style={styles.helpContainer}>
              <Text style={styles.helpTitle}>E-postayı bulamıyor musunuz?</Text>
              <Text style={styles.helpText}>
                • Gelen kutunuzu kontrol edin{'\n'}
                • Spam/Junk klasörünü kontrol edin{'\n'}
                • E-posta adresinizi doğru yazdığınızdan emin olun{'\n'}
                • Birkaç dakika bekleyin, e-posta geç gelebilir
              </Text>
            </View>

            <TouchableOpacity
              style={styles.skipButton}
              onPress={handleSkip}
            >
              <Text style={styles.skipButtonText}>Şimdilik Atla</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  form: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoBackground: {
    width: 60,
    height: 60,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  pawIcon: {
    width: 30,
    height: 30,
    position: 'relative',
  },
  pawPad: {
    width: 16,
    height: 12,
    backgroundColor: '#667eea',
    borderRadius: 8,
    position: 'absolute',
    bottom: 0,
    left: 7,
  },
  pawToe: {
    width: 6,
    height: 8,
    backgroundColor: '#667eea',
    borderRadius: 3,
    position: 'absolute',
  },
  toe1: {
    top: 0,
    left: 5,
  },
  toe2: {
    top: 2,
    left: 13,
  },
  logoText: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#667eea',
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  mailIconContainer: {
    width: 80,
    height: 80,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeText: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  emailText: {
    fontFamily: 'Inter-SemiBold',
    color: '#667eea',
  },
  errorContainer: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#DC2626',
    flex: 1,
  },
  dismissText: {
    fontSize: 18,
    color: '#DC2626',
    fontWeight: 'bold',
  },
  instructionContainer: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  instructionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#0369A1',
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#0369A1',
    lineHeight: 20,
  },
  checkButton: {
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  disabledButton: {
    opacity: 0.6,
  },
  checkGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
  },
  checkButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 16,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  resendButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginLeft: 8,
  },
  helpContainer: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  helpTitle: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#374151',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    lineHeight: 18,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  skipButtonText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#9CA3AF',
  },
  // Success screen styles
  successContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  successIconContainer: {
    width: 100,
    height: 100,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  successMessage: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 24,
  },
  continueButton: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  continueGradient: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
});
