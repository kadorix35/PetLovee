import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Switch,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { 
  ArrowLeft, 
  Bell, 
  Shield, 
  Globe, 
  Palette,
  Mail,
  Smartphone,
  MessageSquare,
  Eye,
  EyeOff,
  MapPin,
  Phone,
  User
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import userService, { UpdateUserPreferencesData } from '@/services/userService';
import { User as UserType, UserPreferences } from '@/types';

const { width } = Dimensions.get('window');

export default function SettingsScreen() {
  const router = useRouter();
  const { user: authUser, error, clearError } = useAuth();
  
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>({
    notifications: {
      email: true,
      push: true,
      sms: false
    },
    privacy: {
      profileVisibility: 'public',
      showEmail: false,
      showPhone: false,
      showLocation: false
    },
    language: 'tr',
    theme: 'auto'
  });

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    if (!authUser?.uid) return;

    try {
      const userProfile = await userService.getUserProfile(authUser.uid);
      if (userProfile && userProfile.preferences) {
        setUser(userProfile);
        setPreferences(userProfile.preferences);
      }
    } catch (error) {
      console.error('Profil yüklenemedi:', error);
      Alert.alert('Hata', 'Profil bilgileri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceChange = async (category: keyof UserPreferences, field: string, value: any) => {
    if (!authUser?.uid) return;

    const newPreferences = {
      ...preferences,
      [category]: {
        ...preferences[category],
        [field]: value
      }
    };

    setPreferences(newPreferences);

    try {
      const updateData: UpdateUserPreferencesData = {};
      if (category === 'notifications') {
        updateData.notifications = { [field]: value };
      } else if (category === 'privacy') {
        updateData.privacy = { [field]: value };
      } else if (category === 'language') {
        updateData.language = value;
      } else if (category === 'theme') {
        updateData.theme = value;
      }

      await userService.updateUserPreferences(authUser.uid, updateData);
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Tercihler güncellenemedi');
      // Revert on error
      setPreferences(preferences);
    }
  };

  const handleLanguageChange = () => {
    Alert.alert(
      'Dil Seçimi',
      'Hangi dili kullanmak istiyorsunuz?',
      [
        { text: 'Türkçe', onPress: () => handlePreferenceChange('language', 'language', 'tr') },
        { text: 'English', onPress: () => handlePreferenceChange('language', 'language', 'en') },
        { text: 'İptal', style: 'cancel' }
      ]
    );
  };

  const handleThemeChange = () => {
    Alert.alert(
      'Tema Seçimi',
      'Hangi temayı kullanmak istiyorsunuz?',
      [
        { text: 'Açık', onPress: () => handlePreferenceChange('theme', 'theme', 'light') },
        { text: 'Koyu', onPress: () => handlePreferenceChange('theme', 'theme', 'dark') },
        { text: 'Otomatik', onPress: () => handlePreferenceChange('theme', 'theme', 'auto') },
        { text: 'İptal', style: 'cancel' }
      ]
    );
  };

  const handleProfileVisibilityChange = () => {
    Alert.alert(
      'Profil Görünürlüğü',
      'Profilinizi kimler görebilir?',
      [
        { text: 'Herkes', onPress: () => handlePreferenceChange('privacy', 'profileVisibility', 'public') },
        { text: 'Sadece Arkadaşlar', onPress: () => handlePreferenceChange('privacy', 'profileVisibility', 'friends') },
        { text: 'Gizli', onPress: () => handlePreferenceChange('privacy', 'profileVisibility', 'private') },
        { text: 'İptal', style: 'cancel' }
      ]
    );
  };

  const getLanguageText = (lang: string) => {
    switch (lang) {
      case 'tr': return 'Türkçe';
      case 'en': return 'English';
      default: return 'Türkçe';
    }
  };

  const getThemeText = (theme: string) => {
    switch (theme) {
      case 'light': return 'Açık';
      case 'dark': return 'Koyu';
      case 'auto': return 'Otomatik';
      default: return 'Otomatik';
    }
  };

  const getVisibilityText = (visibility: string) => {
    switch (visibility) {
      case 'public': return 'Herkes';
      case 'friends': return 'Sadece Arkadaşlar';
      case 'private': return 'Gizli';
      default: return 'Herkes';
    }
  };

  if (loading) {
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
          <Text style={styles.headerTitle}>Ayarlar</Text>
          <View style={styles.placeholder} />
        </LinearGradient>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Yükleniyor...</Text>
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
        <Text style={styles.headerTitle}>Ayarlar</Text>
        <View style={styles.placeholder} />
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Notifications Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Bell color="#667eea" size={24} strokeWidth={2} />
              <Text style={styles.sectionTitle}>Bildirimler</Text>
            </View>
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Mail color="#6B7280" size={20} strokeWidth={2} />
                <Text style={styles.settingLabel}>E-posta Bildirimleri</Text>
              </View>
              <Switch
                value={preferences.notifications.email}
                onValueChange={(value) => handlePreferenceChange('notifications', 'email', value)}
                trackColor={{ false: '#E5E7EB', true: '#667eea' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Smartphone color="#6B7280" size={20} strokeWidth={2} />
                <Text style={styles.settingLabel}>Push Bildirimleri</Text>
              </View>
              <Switch
                value={preferences.notifications.push}
                onValueChange={(value) => handlePreferenceChange('notifications', 'push', value)}
                trackColor={{ false: '#E5E7EB', true: '#667eea' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <MessageSquare color="#6B7280" size={20} strokeWidth={2} />
                <Text style={styles.settingLabel}>SMS Bildirimleri</Text>
              </View>
              <Switch
                value={preferences.notifications.sms}
                onValueChange={(value) => handlePreferenceChange('notifications', 'sms', value)}
                trackColor={{ false: '#E5E7EB', true: '#667eea' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          {/* Privacy Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Shield color="#667eea" size={24} strokeWidth={2} />
              <Text style={styles.sectionTitle}>Gizlilik</Text>
            </View>

            <TouchableOpacity 
              style={styles.settingItem}
              onPress={handleProfileVisibilityChange}
            >
              <View style={styles.settingInfo}>
                <User color="#6B7280" size={20} strokeWidth={2} />
                <Text style={styles.settingLabel}>Profil Görünürlüğü</Text>
              </View>
              <View style={styles.settingValue}>
                <Text style={styles.settingValueText}>
                  {getVisibilityText(preferences.privacy.profileVisibility)}
                </Text>
                <Text style={styles.settingArrow}>›</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Mail color="#6B7280" size={20} strokeWidth={2} />
                <Text style={styles.settingLabel}>E-posta Adresini Göster</Text>
              </View>
              <Switch
                value={preferences.privacy.showEmail}
                onValueChange={(value) => handlePreferenceChange('privacy', 'showEmail', value)}
                trackColor={{ false: '#E5E7EB', true: '#667eea' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Phone color="#6B7280" size={20} strokeWidth={2} />
                <Text style={styles.settingLabel}>Telefon Numarasını Göster</Text>
              </View>
              <Switch
                value={preferences.privacy.showPhone}
                onValueChange={(value) => handlePreferenceChange('privacy', 'showPhone', value)}
                trackColor={{ false: '#E5E7EB', true: '#667eea' }}
                thumbColor="#FFFFFF"
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <MapPin color="#6B7280" size={20} strokeWidth={2} />
                <Text style={styles.settingLabel}>Konumu Göster</Text>
              </View>
              <Switch
                value={preferences.privacy.showLocation}
                onValueChange={(value) => handlePreferenceChange('privacy', 'showLocation', value)}
                trackColor={{ false: '#E5E7EB', true: '#667eea' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          {/* General Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Globe color="#667eea" size={24} strokeWidth={2} />
              <Text style={styles.sectionTitle}>Genel</Text>
            </View>

            <TouchableOpacity 
              style={styles.settingItem}
              onPress={handleLanguageChange}
            >
              <View style={styles.settingInfo}>
                <Globe color="#6B7280" size={20} strokeWidth={2} />
                <Text style={styles.settingLabel}>Dil</Text>
              </View>
              <View style={styles.settingValue}>
                <Text style={styles.settingValueText}>
                  {getLanguageText(preferences.language)}
                </Text>
                <Text style={styles.settingArrow}>›</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.settingItem}
              onPress={handleThemeChange}
            >
              <View style={styles.settingInfo}>
                <Palette color="#6B7280" size={20} strokeWidth={2} />
                <Text style={styles.settingLabel}>Tema</Text>
              </View>
              <View style={styles.settingValue}>
                <Text style={styles.settingValueText}>
                  {getThemeText(preferences.theme)}
                </Text>
                <Text style={styles.settingArrow}>›</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Account Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <User color="#667eea" size={24} strokeWidth={2} />
              <Text style={styles.sectionTitle}>Hesap</Text>
            </View>

            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => router.push('/profile/edit')}
            >
              <View style={styles.settingInfo}>
                <User color="#6B7280" size={20} strokeWidth={2} />
                <Text style={styles.settingLabel}>Profil Düzenle</Text>
              </View>
              <Text style={styles.settingArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.settingItem}
              onPress={() => router.push('/auth/verify-email')}
            >
              <View style={styles.settingInfo}>
                <Mail color="#6B7280" size={20} strokeWidth={2} />
                <Text style={styles.settingLabel}>E-posta Doğrula</Text>
              </View>
              <Text style={styles.settingArrow}>›</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginLeft: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    marginLeft: 12,
  },
  settingValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValueText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginRight: 8,
  },
  settingArrow: {
    fontSize: 18,
    color: '#9CA3AF',
    fontWeight: 'bold',
  },
});
