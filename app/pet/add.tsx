import React, { useState } from 'react';
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
  Camera, 
  Save,
  User,
  Heart,
  Calendar,
  MapPin
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import petService, { CreatePetData } from '@/services/petService';

const { width } = Dimensions.get('window');

const SPECIES_OPTIONS = [
  'Köpek', 'Kedi', 'Kuş', 'Balık', 'Hamster', 'Tavşan', 'Kaplumbağa', 'Diğer'
];

const GENDER_OPTIONS = [
  { label: 'Erkek', value: 'Erkek' as const },
  { label: 'Dişi', value: 'Dişi' as const }
];

export default function AddPetScreen() {
  const router = useRouter();
  const { user: authUser, error, clearError } = useAuth();
  
  const [formData, setFormData] = useState<CreatePetData>({
    name: '',
    species: '',
    breed: '',
    age: '',
    gender: 'Erkek',
    bio: '',
    photoUrl: ''
  });
  const [saving, setSaving] = useState(false);
  const [showSpeciesModal, setShowSpeciesModal] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);

  const handleInputChange = (field: keyof CreatePetData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (error) clearError();
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Hata', 'Lütfen pet adını girin');
      return false;
    }

    if (formData.name.trim().length < 2) {
      Alert.alert('Hata', 'Pet adı en az 2 karakter olmalıdır');
      return false;
    }

    if (!formData.species.trim()) {
      Alert.alert('Hata', 'Lütfen pet türünü seçin');
      return false;
    }

    if (!formData.breed.trim()) {
      Alert.alert('Hata', 'Lütfen pet ırkını girin');
      return false;
    }

    if (!formData.age.trim()) {
      Alert.alert('Hata', 'Lütfen pet yaşını girin');
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
      await petService.createPet(authUser.uid, formData);
      Alert.alert('Başarılı', 'Pet profili oluşturuldu', [
        {
          text: 'Tamam',
          onPress: () => router.back()
        }
      ]);
    } catch (error: any) {
      Alert.alert('Hata', error.message || 'Pet profili oluşturulamadı');
    } finally {
      setSaving(false);
    }
  };

  const handleSpeciesSelect = (species: string) => {
    setFormData(prev => ({ ...prev, species }));
    setShowSpeciesModal(false);
  };

  const handleGenderSelect = (gender: 'Erkek' | 'Dişi') => {
    setFormData(prev => ({ ...prev, gender }));
    setShowGenderModal(false);
  };

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
        <Text style={styles.headerTitle}>Pet Ekle</Text>
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
            {/* Pet Photo Section */}
            <View style={styles.photoSection}>
              <View style={styles.photoContainer}>
                {formData.photoUrl ? (
                  <Image source={{ uri: formData.photoUrl }} style={styles.petPhoto} />
                ) : (
                  <View style={styles.defaultPhoto}>
                    <Heart color="#667eea" size={40} strokeWidth={2} />
                  </View>
                )}
                <TouchableOpacity style={styles.cameraButton}>
                  <Camera color="#FFFFFF" size={20} strokeWidth={2} />
                </TouchableOpacity>
              </View>
              <Text style={styles.photoText}>Pet Fotoğrafı</Text>
            </View>

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity onPress={clearError}>
                  <Text style={styles.dismissText}>×</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Pet Name */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Pet Adı *</Text>
              <View style={styles.inputWrapper}>
                <User color="#667eea" size={20} strokeWidth={2} />
                <TextInput
                  style={styles.input}
                  placeholder="Pet adını girin"
                  placeholderTextColor="#9CA3AF"
                  value={formData.name}
                  onChangeText={(value) => handleInputChange('name', value)}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Species */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Tür *</Text>
              <TouchableOpacity 
                style={styles.inputWrapper}
                onPress={() => setShowSpeciesModal(true)}
              >
                <Heart color="#667eea" size={20} strokeWidth={2} />
                <Text style={[
                  styles.input,
                  !formData.species && styles.placeholderText
                ]}>
                  {formData.species || 'Tür seçin'}
                </Text>
                <Text style={styles.dropdownArrow}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Breed */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Irk *</Text>
              <View style={styles.inputWrapper}>
                <Heart color="#667eea" size={20} strokeWidth={2} />
                <TextInput
                  style={styles.input}
                  placeholder="Irk girin (örn: Golden Retriever)"
                  placeholderTextColor="#9CA3AF"
                  value={formData.breed}
                  onChangeText={(value) => handleInputChange('breed', value)}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Age */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Yaş *</Text>
              <View style={styles.inputWrapper}>
                <Calendar color="#667eea" size={20} strokeWidth={2} />
                <TextInput
                  style={styles.input}
                  placeholder="Yaş girin (örn: 2 yaş, 6 ay)"
                  placeholderTextColor="#9CA3AF"
                  value={formData.age}
                  onChangeText={(value) => handleInputChange('age', value)}
                />
              </View>
            </View>

            {/* Gender */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Cinsiyet *</Text>
              <TouchableOpacity 
                style={styles.inputWrapper}
                onPress={() => setShowGenderModal(true)}
              >
                <Heart color="#667eea" size={20} strokeWidth={2} />
                <Text style={[
                  styles.input,
                  !formData.gender && styles.placeholderText
                ]}>
                  {formData.gender || 'Cinsiyet seçin'}
                </Text>
                <Text style={styles.dropdownArrow}>›</Text>
              </TouchableOpacity>
            </View>

            {/* Bio */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Biyografi</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  placeholder="Pet hakkında kısa bir açıklama yazın..."
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
                  {saving ? 'Kaydediliyor...' : 'Pet Profili Oluştur'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Species Modal */}
      {showSpeciesModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Tür Seçin</Text>
            <ScrollView style={styles.modalList}>
              {SPECIES_OPTIONS.map((species) => (
                <TouchableOpacity
                  key={species}
                  style={styles.modalItem}
                  onPress={() => handleSpeciesSelect(species)}
                >
                  <Text style={styles.modalItemText}>{species}</Text>
                  {formData.species === species && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowSpeciesModal(false)}
            >
              <Text style={styles.modalCloseText}>İptal</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Gender Modal */}
      {showGenderModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cinsiyet Seçin</Text>
            <ScrollView style={styles.modalList}>
              {GENDER_OPTIONS.map((gender) => (
                <TouchableOpacity
                  key={gender.value}
                  style={styles.modalItem}
                  onPress={() => handleGenderSelect(gender.value)}
                >
                  <Text style={styles.modalItemText}>{gender.label}</Text>
                  {formData.gender === gender.value && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowGenderModal(false)}
            >
              <Text style={styles.modalCloseText}>İptal</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
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
  content: {
    flex: 1,
  },
  form: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  petPhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  defaultPhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
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
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
    marginLeft: 12,
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  dropdownArrow: {
    fontSize: 18,
    color: '#9CA3AF',
    fontWeight: 'bold',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
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
  // Modal styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    margin: 20,
    maxHeight: '70%',
    minWidth: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    textAlign: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalList: {
    maxHeight: 300,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalItemText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#374151',
  },
  checkmark: {
    fontSize: 18,
    color: '#667eea',
    fontWeight: 'bold',
  },
  modalCloseButton: {
    paddingVertical: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  modalCloseText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#667eea',
  },
});
