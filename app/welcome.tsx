import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Image,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Heart, PawPrint, Users, Camera, MapPin, MessageCircle } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(0));

  const slides = [
    {
      id: 1,
      title: 'Evcil Hayvan Dünyasına Hoş Geldiniz',
      subtitle: 'Sevimli dostlarınızın fotoğraflarını paylaşın ve diğer pet sahipleriyle tanışın',
      icon: PawPrint,
      color: '#667eea',
      features: ['Pet Profilleri', 'Fotoğraf Paylaşımı', 'Sosyal Etkileşim']
    },
    {
      id: 2,
      title: 'Yakındaki Veterinerleri Keşfedin',
      subtitle: 'Harita üzerinden yakınınızdaki veteriner kliniklerini bulun ve randevu alın',
      icon: MapPin,
      color: '#764ba2',
      features: ['Harita Entegrasyonu', 'Veteriner Bilgileri', 'Randevu Sistemi']
    },
    {
      id: 3,
      title: 'Pet Sahipleriyle Sohbet Edin',
      subtitle: 'Deneyimlerinizi paylaşın, tavsiyeler alın ve yeni arkadaşlıklar kurun',
      icon: MessageCircle,
      color: '#f093fb',
      features: ['Anlık Mesajlaşma', 'Grup Sohbetleri', 'Deneyim Paylaşımı']
    }
  ];

  useEffect(() => {
    // Kullanıcı zaten giriş yapmışsa ana sayfaya yönlendir
    if (!loading && user) {
      router.replace('/(tabs)');
      return;
    }

    // Animasyonları başlat
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // Otomatik slide geçişi
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [user, loading]);

  const handleGetStarted = () => {
    router.push('/auth/register');
  };

  const handleSignIn = () => {
    router.push('/auth/login');
  };

  const handleSkip = () => {
    router.push('/auth/login');
  };

  const renderSlide = (slide: typeof slides[0], index: number) => {
    const IconComponent = slide.icon;
    const isActive = index === currentSlide;

    return (
      <Animated.View
        key={slide.id}
        style={[
          styles.slide,
          {
            opacity: isActive ? 1 : 0.3,
            transform: [
              {
                scale: isActive ? 1 : 0.9,
              },
            ],
          },
        ]}
      >
        <View style={[styles.iconContainer, { backgroundColor: slide.color }]}>
          <IconComponent color="#FFFFFF" size={40} strokeWidth={2} />
        </View>
        
        <Text style={styles.slideTitle}>{slide.title}</Text>
        <Text style={styles.slideSubtitle}>{slide.subtitle}</Text>
        
        <View style={styles.featuresContainer}>
          {slide.features.map((feature, featureIndex) => (
            <View key={featureIndex} style={styles.featureItem}>
              <View style={[styles.featureDot, { backgroundColor: slide.color }]} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>
      </Animated.View>
    );
  };

  const renderDots = () => {
    return (
      <View style={styles.dotsContainer}>
        {slides.map((_, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor: index === currentSlide ? '#667eea' : '#E5E7EB',
                width: index === currentSlide ? 24 : 8,
              },
            ]}
            onPress={() => setCurrentSlide(index)}
          />
        ))}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.loadingGradient}
        >
          <View style={styles.loadingContent}>
            <View style={styles.loadingPaw}>
              <PawPrint color="#FFFFFF" size={60} strokeWidth={2} />
            </View>
            <Text style={styles.loadingText}>PetLove</Text>
            <Text style={styles.loadingSubtext}>Yükleniyor...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.logoContainer}>
            <View style={styles.logoBackground}>
              <PawPrint color="#FFFFFF" size={32} strokeWidth={2} />
            </View>
            <Text style={styles.logoText}>PetLove</Text>
          </View>
          
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Atla</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [
              {
                translateY: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.slidesContainer}>
          {slides.map((slide, index) => renderSlide(slide, index))}
        </View>

        {renderDots()}

        <View style={styles.buttonsContainer}>
          <TouchableOpacity
            style={styles.getStartedButton}
            onPress={handleGetStarted}
          >
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.getStartedGradient}
            >
              <Text style={styles.getStartedText}>Başlayalım</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.signInButton} onPress={handleSignIn}>
            <Text style={styles.signInText}>Zaten hesabım var</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
  },
  loadingGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  loadingPaw: {
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 32,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  loadingSubtext: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoBackground: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoText: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  skipText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  slidesContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  slide: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  slideTitle: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 32,
  },
  slideSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  featuresContainer: {
    alignItems: 'flex-start',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featureDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  featureText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 32,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  buttonsContainer: {
    paddingBottom: 40,
  },
  getStartedButton: {
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  getStartedGradient: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  getStartedText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  signInButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  signInText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#667eea',
  },
});