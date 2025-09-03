import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Heart, Users, MapPin, Sparkles } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
        style={styles.backgroundGradient}
      >
        <View style={styles.content}>
          {/* Floating Elements */}
          <View style={styles.floatingElements}>
            <View style={[styles.floatingCircle, styles.circle1]} />
            <View style={[styles.floatingCircle, styles.circle2]} />
            <View style={[styles.floatingCircle, styles.circle3]} />
          </View>

          {/* Hero Section */}
          <View style={styles.heroSection}>
            <View style={styles.logoContainer}>
              <View style={styles.logoBackground}>
                <View style={styles.pawIcon}>
                  <View style={styles.pawPad} />
                  <View style={[styles.pawToe, styles.toe1]} />
                  <View style={[styles.pawToe, styles.toe2]} />
                  <View style={[styles.pawToe, styles.toe3]} />
                  <View style={[styles.pawToe, styles.toe4]} />
                </View>
              </View>
              <Text style={styles.logoText}>PetLove</Text>
              <View style={styles.sparkleContainer}>
                <Sparkles color="#FFD700" size={20} strokeWidth={2} />
              </View>
            </View>

            <Image
              source={{ uri: 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=800' }}
              style={styles.heroImage}
              resizeMode="cover"
            />
          </View>

          {/* Content Section */}
          <View style={styles.contentSection}>
            <Text style={styles.title}>Evcil Hayvan Dostları{'\n'}Buluşuyor</Text>
            <Text style={styles.subtitle}>
              Sevimli dostlarınız için profil oluşturun, fotoğraf ve videolarınızı paylaşın, 
              diğer pet severlerle bağlantı kurun ve yakınınızdaki veteriner kliniklerini keşfedin.
            </Text>

            <View style={styles.featuresGrid}>
              <View style={styles.featureCard}>
                <View style={styles.featureIcon}>
                  <Heart color="#667eea" size={24} strokeWidth={2} />
                </View>
                <Text style={styles.featureTitle}>Pet Profilleri</Text>
                <Text style={styles.featureDesc}>Fotoğraf & Video</Text>
              </View>
              
              <View style={styles.featureCard}>
                <View style={styles.featureIcon}>
                  <Users color="#764ba2" size={24} strokeWidth={2} />
                </View>
                <Text style={styles.featureTitle}>Sosyal Ağ</Text>
                <Text style={styles.featureDesc}>Takip & Paylaşım</Text>
              </View>
              
              <View style={styles.featureCard}>
                <View style={styles.featureIcon}>
                  <MapPin color="#f093fb" size={24} strokeWidth={2} />
                </View>
                <Text style={styles.featureTitle}>Veteriner</Text>
                <Text style={styles.featureDesc}>Harita & Klinikler</Text>
              </View>
            </View>
          </View>

          {/* CTA Button */}
          <TouchableOpacity style={styles.ctaButton} onPress={handleGetStarted}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              style={styles.ctaGradient}
            >
              <Text style={styles.ctaText}>Hemen Başla</Text>
              <View style={styles.ctaArrow}>
                <Text style={styles.ctaArrowText}>→</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundGradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    justifyContent: 'space-between',
  },
  floatingElements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  floatingCircle: {
    position: 'absolute',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 50,
  },
  circle1: {
    width: 100,
    height: 100,
    top: 100,
    right: -20,
  },
  circle2: {
    width: 60,
    height: 60,
    top: 300,
    left: -10,
  },
  circle3: {
    width: 80,
    height: 80,
    bottom: 200,
    right: 20,
  },
  heroSection: {
    alignItems: 'center',
    marginTop: 10,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  logoBackground: {
    width: 70,
    height: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  pawIcon: {
    width: 35,
    height: 35,
    position: 'relative',
  },
  pawPad: {
    width: 20,
    height: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    position: 'absolute',
    bottom: 0,
    left: 10,
  },
  pawToe: {
    width: 8,
    height: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 5,
    position: 'absolute',
  },
  toe1: {
    top: 0,
    left: 6,
  },
  toe2: {
    top: 2,
    left: 16,
  },
  toe3: {
    top: 2,
    left: 26,
  },
  toe4: {
    top: 6,
    left: 34,
  },
  logoText: {
    fontSize: 36,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    letterSpacing: -1,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  sparkleContainer: {
    position: 'absolute',
    top: -10,
    right: -30,
  },
  heroImage: {
    width: width * 0.5,
    height: width * 0.5,
    borderRadius: width * 0.25,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  contentSection: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 34,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  featuresGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  featureCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  featureIcon: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 2,
    textAlign: 'center',
  },
  featureDesc: {
    fontSize: 10,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  ctaButton: {
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 20,
    gap: 10,
  },
  ctaText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  ctaArrow: {
    width: 32,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaArrowText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});