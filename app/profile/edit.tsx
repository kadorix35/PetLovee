import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Camera, 
  Save,
  Eye,
  EyeOff
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import userService, { UpdateUserProfileData } from '@/services/userService';
import { User as UserType } from '@/types';

const { width } = Dimensions.get('window');

export default function EditProfileScreen() {
  const router = useRouter();
  const { user: authUser, error, clearError } = useAuth();
  
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<UpdateUserProfileData>({
    displayName: '',
    bio: '',
    phone: '',
    location: '',
    photoURL: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState('');

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    if (!authUser?.uid) return;

    try {
      const userProfile = await userService.getUserProfile(authUser.uid);
      if (userProfile) {
        setUser(userProfile);
        setFormData({
          displayName: userProfile.displayName || '',
          bio: userProfile.bio || '',
          phone: userProfile.phone || '',
          location: userProfile.location || '',
          photoURL: userProfile.photoURL || ''
        });
      }
    } catch (error) {
      console.error('Profil yüklenemedi:', error);
      Alert.alert('Hata', 'Profil bilgileri yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof UpdateUserProfileData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) clearError();
  };

  const validateForm = () => {
    if (!formData.displayName?.trim()) {
      Alert.alert('Hata', 'Lütfen ad ve soyadınızı girin');
      return false;
    }

    if (formData.displayName.trim().length < 2) {
      Alert.alert('Hata', 'Ad ve soyad en az 2 karakter olmalıdır');
      return false;
    }

    if (formData.bio && formData.bio.length > 500) {
      Alert.alert('Hata', 'Biyografi en fazla 500 karakter olabilir');
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm() || !authUser?.uid) return;

    setSaving(true);
    try {
      await userService.updateUserProfile(authUser.uid, formData);
      Alert.alert('Başarılı', 'Profil bilgileriniz güncellendi', [
        {
          text: 'Tamam',
          onPress: () => router.back()
        }
      ]);
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Profil güncellenemedi');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Hesabı Sil',
      'Hesabınızı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz ve tüm verileriniz silinecektir.',
      [
        {
          text: 'İptal',
          style: 'cancel'
        },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => handleConfirmDelete()
        }
      ]
    );
  };

  const handleConfirmDelete = () => {
    Alert.alert(
      'Son Uyarı',
      'Bu işlem geri alınamaz. Tüm petleriniz, postlarınız ve verileriniz kalıcı olarak silinecektir.',
      [
        {
          text: 'İptal',
          style: 'cancel'
        },
        {
          text: 'Evet, Sil',
          style: 'destructive',
          onPress: () => handleDeleteWithPassword()
        }
      ]
    );
  };

  const handleDeleteWithPassword = () => {
    Alert.prompt(
      'Şifre Onayı',
      'Hesabınızı silmek için şifrenizi girin:',
      [
        {
          text: 'İptal',
          style: 'cancel'
        },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async (password) => {
            if (!password) {
              Alert.alert('Hata', 'Şifre gerekli');
              return;
            }

            try {
              setSaving(true);
              await userService.deleteUserAccount(authUser!.uid, password);
              Alert.alert('Başarılı', 'Hesabınız silindi', [
                {
                  text: 'Tamam',
                  onPress: () => router.replace('/auth/login')
                }
              ]);
            } catch (error: any) {
              Alert.alert('Hata', error.message || 'Hesap silinemedi');
            } finally {
              setSaving(false);
            }
          }
        }
      ],
      'secure-text'
    );
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
          <Text style={styles.headerTitle}>Profil Düzenle</Text>
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
        <Text style={styles.headerTitle}>Profil Düzenle</Text>
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSave}
          disabled={saving}
        >
          <Save color="#FFFFFF" size={24} strokeWidth={2} />
        </TouchableOpacity>
      </LinearGradient>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.form}>
            {/* Profile Photo Section */}
            <View style={styles.photoSection}>
              <View style={styles.photoContainer}>
                {formData.photoURL ? (
                  <Image source={{ uri: formData.photoURL }} style={styles.profilePhoto} />
                ) : (
                  <View style={styles.defaultPhoto}>
                    <User color="#667eea" size={40} strokeWidth={2} />
                  </View>
                )}
                <TouchableOpacity style={styles.cameraButton}>
                  <Camera color="#FFFFFF" size={20} strokeWidth={2} />
                </TouchableOpacity>
              </View>
              <Text style={styles.photoText}>Profil Fotoğrafı</Text>
            </View>

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity onPress={clearError}>
                  <Text style={styles.dismissText}>×</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Display Name */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Ad ve Soyad *</Text>
              <View style={styles.inputWrapper}>
                <User color="#667eea" size={20} strokeWidth={2} />
                <TextInput
                  style={styles.input}
                  placeholder="Ad ve soyadınız"
                  placeholderTextColor="#9CA3AF"
                  value={formData.displayName}
                  onChangeText={(value) => handleInputChange('displayName', value)}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Email (Read-only) */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>E-posta</Text>
              <View style={[styles.inputWrapper, styles.readOnlyInput]}>
                <Mail color="#9CA3AF" size={20} strokeWidth={2} />
                <TextInput
                  style={[styles.input, styles.readOnlyText]}
                  value={user?.email || ''}
                  editable={false}
                />
              </View>
              <Text style={styles.helpText}>E-posta adresi değiştirilemez</Text>
            </View>

            {/* Bio */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Biyografi</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Kendiniz hakkında kısa bir açıklama yazın..."
                  placeholderTextColor="#9CA3AF"
                  value={formData.bio}
                  onChangeText={(value) => handleInputChange('bio', value)}
                  multiline
                  numberOfLines={4}
                  maxLength={500}
                />
              </View>
              <Text style={styles.characterCount}>
                {formData.bio?.length || 0}/500
              </Text>
            </View>

            {/* Phone */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Telefon</Text>
              <View style={styles.inputWrapper}>
                <Phone color="#667eea" size={20} strokeWidth={2} />
                <TextInput
                  style={styles.input}
                  placeholder="Telefon numaranız"
                  placeholderTextColor="#9CA3AF"
                  value={formData.phone}
                  onChangeText={(value) => handleInputChange('phone', value)}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Location */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Konum</Text>
              <View style={styles.inputWrapper}>
                <MapPin color="#667eea" size={20} strokeWidth={2} />
                <TextInput
                  style={styles.input}
                  placeholder="Şehir, Ülke"
                  placeholderTextColor="#9CA3AF"
                  value={formData.location}
                  onChangeText={(value) => handleInputChange('location', value)}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveButtonLarge, saving && styles.disabledButton]}
              onPress={handleSave}
              disabled={saving}
            >
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.saveGradient}
              >
                <Text style={styles.saveButtonText}>
                  {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            {/* Danger Zone */}
            <View style={styles.dangerZone}>
              <Text style={styles.dangerZoneTitle}>Tehlikeli Bölge</Text>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDeleteAccount}
                disabled={saving}
              >
                <Text style={styles.deleteButtonText}>Hesabı Sil</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  saveButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  form: {
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
  photoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  profilePhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  defaultPhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  photoText: {
    fontSize: 14,
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
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  readOnlyInput: {
    backgroundColor: '#F9FAFB',
    borderColor: '#D1D5DB',
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
    marginLeft: 12,
  },
  readOnlyText: {
    color: '#9CA3AF',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  helpText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    marginTop: 4,
  },
  characterCount: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 4,
  },
  saveButtonLarge: {
    borderRadius: 16,
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveGradient: {
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  dangerZone: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 16,
  },
  dangerZoneTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#DC2626',
    marginBottom: 12,
  },
  deleteButton: {
    backgroundColor: '#DC2626',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
});
