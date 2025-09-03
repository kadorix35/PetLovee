import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Video } from 'expo-video';
import { Camera, CreditCard as Edit3, Save, X, Plus, Play, Grid2x2 as Grid, User, ChevronDown, Settings, Heart } from 'lucide-react-native';
import { FlatGrid } from 'react-native-super-grid';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

interface UserPost {
  id: string;
  type: 'photo' | 'video';
  mediaUrl: string;
  caption: string;
  likes: number;
  comments: number;
  createdAt: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'info'>('posts');
  const [userPosts, setUserPosts] = useState<UserPost[]>([
    {
      id: 'post1',
      type: 'photo',
      mediaUrl: 'https://images.pexels.com/photos/1805164/pexels-photo-1805164.jpeg?auto=compress&cs=tinysrgb&w=400',
      caption: 'Parkta güzel bir gün geçirdik! 🌞',
      likes: 24,
      comments: 8,
      createdAt: '2024-01-15T10:00:00Z',
    },
    {
      id: 'post2',
      type: 'video',
      mediaUrl: 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=400',
      videoUrl: 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4',
      caption: 'Top oynamayı çok seviyor! 🎾',
      likes: 45,
      comments: 12,
      createdAt: '2024-01-20T14:30:00Z',
    },
    {
      id: 'post3',
      type: 'photo',
      mediaUrl: 'https://images.pexels.com/photos/1629781/pexels-photo-1629781.jpeg?auto=compress&cs=tinysrgb&w=400',
      caption: 'Yeni arkadaşımla tanıştık! 🐕',
      likes: 67,
      comments: 15,
      createdAt: '2024-02-01T09:15:00Z',
    },
    {
      id: 'post4',
      type: 'photo',
      mediaUrl: 'https://images.pexels.com/photos/1390361/pexels-photo-1390361.jpeg?auto=compress&cs=tinysrgb&w=400',
      caption: 'Uyku zamanı 😴',
      likes: 32,
      comments: 6,
      createdAt: '2024-02-10T16:45:00Z',
    },
  ]);

  const [userPets, setUserPets] = useState([
    {
      id: 'pet1',
      name: 'Pamuk',
      species: 'Köpek',
      breed: 'Golden Retriever',
      age: '3',
      gender: 'Erkek',
      bio: 'Çok oyuncu ve sevimli bir köpek. Parkta koşmayı ve top oynamayı çok seviyor. Her gün yeni maceralar arıyor!',
      photoUrl: 'https://images.pexels.com/photos/1805164/pexels-photo-1805164.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      id: 'pet2',
      name: 'Luna',
      species: 'Kedi',
      breed: 'Persian',
      age: '2',
      gender: 'Dişi',
      bio: 'Çok sakin ve sevecen bir kedi. Güneşli yerlerde uyumayı seviyor.',
      photoUrl: 'https://images.pexels.com/photos/1170986/pexels-photo-1170986.jpeg?auto=compress&cs=tinysrgb&w=400'
    },
    {
      id: 'pet3',
      name: 'Rocky',
      species: 'Köpek',
      breed: 'Husky',
      age: '4',
      gender: 'Erkek',
      bio: 'Enerjik ve maceraperest. Uzun yürüyüşler ve koşular favorisi.',
      photoUrl: 'https://images.pexels.com/photos/1629781/pexels-photo-1629781.jpeg?auto=compress&cs=tinysrgb&w=400'
    }
  ]);

  const [selectedPetId, setSelectedPetId] = useState('pet1');
  const [showPetSelector, setShowPetSelector] = useState(false);

  const selectedPet = userPets.find(pet => pet.id === selectedPetId) || userPets[0];

  const handlePostPress = (post: UserPost) => {
    router.push(`/post/${post.id}` as any);
  };

  const handlePetSelect = (petId: string) => {
    setSelectedPetId(petId);
    setShowPetSelector(false);
  };

  const handleSave = () => {
    if (!selectedPetId) {
      Alert.alert('Hata', 'Lütfen bir pet seçin.');
      return;
    }
    
    Alert.alert('Başarılı', `${selectedPet.name} için gönderi başarıyla eklendi!`);
    setShowCreateForm(false);
  };

  const handlePhotoPress = () => {
    Alert.alert(
      'Fotoğraf Seç',
      'Nasıl bir fotoğraf eklemek istersiniz?',
      [
        { text: 'Kamera', onPress: () => {} },
        { text: 'Galeri', onPress: () => {} },
        { text: 'İptal', style: 'cancel' }
      ]
    );
  };

  const renderPostItem = ({ item }: { item: UserPost }) => (
    <TouchableOpacity 
      style={styles.gridItem}
      onPress={() => handlePostPress(item)}
    >
      <View style={styles.gridMediaContainer}>
        <Image source={{ uri: item.mediaUrl }} style={styles.gridMedia} />
        {item.type === 'video' && (
          <View style={styles.videoIndicator}>
            <View style={styles.playIcon} />
          </View>
        )}
        <View style={styles.postStats}>
          <Text style={styles.likesCount}>{item.likes}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const CreatePetForm = () => (
    <Modal visible={showCreateForm} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.modalHeader}
        >
          <TouchableOpacity onPress={() => setShowCreateForm(false)}>
            <X color="#FFFFFF" size={24} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Gönderi Ekle</Text>
          <TouchableOpacity onPress={handleSave}>
            <Save color="#FFFFFF" size={24} strokeWidth={2} />
          </TouchableOpacity>
        </LinearGradient>

        <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
          {/* Pet Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Pet Seç *</Text>
            <View style={styles.petSelectionContainer}>
              {userPets.map((pet) => (
                <TouchableOpacity
                  key={pet.id}
                  style={[
                    styles.petSelectionOption,
                    selectedPetId === pet.id && styles.selectedPetSelectionOption
                  ]}
                  onPress={() => setSelectedPetId(pet.id)}
                >
                  <Image source={{ uri: pet.photoUrl }} style={styles.petSelectionImage} />
                  <Text style={[
                    styles.petSelectionName,
                    selectedPetId === pet.id && styles.selectedPetSelectionText
                  ]}>
                    {pet.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Photo Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Fotoğraf/Video Seç *</Text>
            <TouchableOpacity style={styles.photoContainer} onPress={handlePhotoPress}>
              <View style={styles.photoPlaceholder}>
                <Camera color="#667eea" size={32} strokeWidth={2} />
                <Text style={styles.photoPlaceholderText}>Fotoğraf veya video ekle</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Caption */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Açıklama</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Gönderiniz hakkında bir şeyler yazın..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <View style={styles.profileHeader}>
          <Image source={{ uri: selectedPet.photoUrl }} style={styles.profileImage} />
          <View style={styles.profileInfo}>
            <TouchableOpacity 
              style={styles.petSelector}
              onPress={() => setShowPetSelector(true)}
            >
              <Text style={styles.profileName}>{selectedPet.name}</Text>
              <ChevronDown color="#FFFFFF" size={16} strokeWidth={2} />
            </TouchableOpacity>
            <Text style={styles.profileBreed}>{selectedPet.breed} • {selectedPet.species}</Text>
            <Text style={styles.profileAge}>{selectedPet.age} yaşında • {selectedPet.gender}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={() => router.push('/pet/list')}
            >
              <Heart color="#FFFFFF" size={20} strokeWidth={2} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={() => router.push('/profile/settings')}
            >
              <Settings color="#FFFFFF" size={20} strokeWidth={2} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.headerActionButton}
              onPress={() => setShowCreateForm(true)}
            >
              <Edit3 color="#FFFFFF" size={20} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{userPosts.length}</Text>
            <Text style={styles.statLabel}>Gönderi</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>156</Text>
            <Text style={styles.statLabel}>Takipçi</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>89</Text>
            <Text style={styles.statLabel}>Takip</Text>
          </View>
        </View>

        {selectedPet.bio && (
          <Text style={styles.profileBio}>{selectedPet.bio}</Text>
        )}
      </LinearGradient>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'posts' && styles.activeTab]}
          onPress={() => setActiveTab('posts')}
        >
          <Grid color={activeTab === 'posts' ? '#667eea' : '#9CA3AF'} size={20} strokeWidth={2} />
          <Text style={[styles.tabText, activeTab === 'posts' && styles.activeTabText]}>
            Gönderiler
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'info' && styles.activeTab]}
          onPress={() => setActiveTab('info')}
        >
          <User color={activeTab === 'info' ? '#667eea' : '#9CA3AF'} size={20} strokeWidth={2} />
          <Text style={[styles.tabText, activeTab === 'info' && styles.activeTabText]}>
            Bilgiler
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'posts' ? (
        <View style={styles.postsContainer}>
          <FlatGrid
            itemDimension={(width - 48) / 3 - 8}
            data={userPosts}
            style={styles.gridList}
            spacing={4}
            renderItem={renderPostItem}
            showsVerticalScrollIndicator={false}
          />
          

        </View>
      ) : (
        <ScrollView style={styles.infoContainer}>
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Pet Bilgileri</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Tür:</Text>
              <Text style={styles.infoValue}>{selectedPet.species}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Cins:</Text>
              <Text style={styles.infoValue}>{selectedPet.breed}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Yaş:</Text>
              <Text style={styles.infoValue}>{selectedPet.age} yaşında</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Cinsiyet:</Text>
              <Text style={styles.infoValue}>{selectedPet.gender}</Text>
            </View>
          </View>
        </ScrollView>
      )}

      <CreatePetForm />
      
      {/* Pet Selector Modal */}
      <Modal visible={showPetSelector} transparent animationType="fade">
        <TouchableOpacity 
          style={styles.modalOverlay}
          onPress={() => setShowPetSelector(false)}
        >
          <View style={styles.petSelectorModal}>
            <Text style={styles.petSelectorTitle}>Pet Seç</Text>
            {userPets.map((pet) => (
              <TouchableOpacity
                key={pet.id}
                style={[
                  styles.petOption,
                  selectedPetId === pet.id && styles.selectedPetOption
                ]}
                onPress={() => handlePetSelect(pet.id)}
              >
                <Image source={{ uri: pet.photoUrl }} style={styles.petOptionImage} />
                <View style={styles.petOptionInfo}>
                  <Text style={[
                    styles.petOptionName,
                    selectedPetId === pet.id && styles.selectedPetOptionText
                  ]}>
                    {pet.name}
                  </Text>
                  <Text style={[
                    styles.petOptionBreed,
                    selectedPetId === pet.id && styles.selectedPetOptionText
                  ]}>
                    {pet.breed} • {pet.species}
                  </Text>
                </View>
                {selectedPetId === pet.id && (
                  <View style={styles.selectedIndicator}>
                    <Text style={styles.selectedIndicatorText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
      
      {/* Floating Action Buttons */}
      <View style={styles.floatingButtons}>
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => router.push('/pet/add')}
        >
          <Heart color="#FFFFFF" size={20} strokeWidth={2} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.floatingAddButton}
          onPress={() => setShowCreateForm(true)}
        >
          <Plus color="#FFFFFF" size={24} strokeWidth={2} />
        </TouchableOpacity>
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
    paddingHorizontal: 24,
    paddingVertical: 24,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  profileBreed: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 2,
  },
  profileAge: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  profileBio: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: -16,
    borderRadius: 16,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  activeTab: {
    backgroundColor: '#F8FAFC',
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#9CA3AF',
  },
  activeTabText: {
    color: '#667eea',
  },
  postsContainer: {
    flex: 1,
    position: 'relative',
  },
  gridList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  gridItem: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gridMediaContainer: {
    position: 'relative',
  },
  gridMedia: {
    width: '100%',
    aspectRatio: 1,
  },
  videoIndicator: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playIcon: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 0,
    borderTopWidth: 5,
    borderBottomWidth: 5,
    borderLeftColor: '#FFFFFF',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    marginLeft: 2,
  },
  postStats: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  likesCount: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },

  infoContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  infoTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  form: {
    flex: 1,
    paddingHorizontal: 20,
  },
  photoContainer: {
    alignSelf: 'center',
    marginVertical: 24,
    position: 'relative',
  },
  photoPreview: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    backgroundColor: '#667eea',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 4,
  },
  genderContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  genderButtonActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  genderButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
  },
  genderButtonTextActive: {
    color: '#FFFFFF',
  },
  petSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  petSelectorModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    maxHeight: '70%',
    minWidth: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  petSelectorTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 20,
  },
  petOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F9FAFB',
  },
  selectedPetOption: {
    backgroundColor: '#E0E7FF',
    borderWidth: 2,
    borderColor: '#667eea',
  },
  petOptionImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  petOptionInfo: {
    flex: 1,
  },
  petOptionName: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  petOptionBreed: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  selectedPetOptionText: {
    color: '#667eea',
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedIndicatorText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'Inter-Bold',
  },
  petSelectionContainer: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  petSelectionOption: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    minWidth: 80,
  },
  selectedPetSelectionOption: {
    borderColor: '#667eea',
    backgroundColor: '#E0E7FF',
  },
  petSelectionImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 8,
  },
  petSelectionName: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
    textAlign: 'center',
  },
  selectedPetSelectionText: {
    color: '#667eea',
  },
  photoPlaceholder: {
    height: 200,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  photoPlaceholderText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    marginTop: 8,
  },

  floatingButtons: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    alignItems: 'center',
    gap: 12,
  },
  floatingButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  floatingAddButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});