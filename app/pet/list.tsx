import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { 
  ArrowLeft, 
  Plus, 
  Heart, 
  Edit, 
  Trash2,
  User
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import petService from '@/services/petService';
import { PetProfile } from '@/types';

const { width } = Dimensions.get('window');

export default function PetListScreen() {
  const router = useRouter();
  const { user: authUser } = useAuth();
  
  const [pets, setPets] = useState<PetProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPets = async () => {
    if (!authUser?.uid) return;

    try {
      const userPets = await petService.getUserPets(authUser.uid);
      setPets(userPets);
    } catch (error) {
      console.error('Pet\'ler yüklenemedi:', error);
      Alert.alert('Hata', 'Pet\'ler yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPets();
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadPets();
    }, [authUser?.uid])
  );

  const handleDeletePet = (pet: PetProfile) => {
    Alert.alert(
      'Pet\'i Sil',
      `${pet.name} adlı pet'i silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`,
      [
        {
          text: 'İptal',
          style: 'cancel'
        },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              await petService.deletePet(pet.id, authUser!.uid);
              setPets(prev => prev.filter(p => p.id !== pet.id));
              Alert.alert('Başarılı', 'Pet silindi');
            } catch (error: any) {
              Alert.alert('Hata', error.message || 'Pet silinemedi');
            }
          }
        }
      ]
    );
  };

  const handleEditPet = (pet: PetProfile) => {
    router.push(`/pet/edit/${pet.id}`);
  };

  const handleViewPet = (pet: PetProfile) => {
    router.push(`/profile/${pet.id}`);
  };

  const renderPetItem = ({ item }: { item: PetProfile }) => (
    <View style={styles.petCard}>
      <TouchableOpacity 
        style={styles.petImageContainer}
        onPress={() => handleViewPet(item)}
      >
        {item.photoUrl ? (
          <Image source={{ uri: item.photoUrl }} style={styles.petImage} />
        ) : (
          <View style={styles.defaultPetImage}>
            <Heart color="#667eea" size={32} strokeWidth={2} />
          </View>
        )}
      </TouchableOpacity>
      
      <View style={styles.petInfo}>
        <TouchableOpacity onPress={() => handleViewPet(item)}>
          <Text style={styles.petName}>{item.name}</Text>
          <Text style={styles.petDetails}>
            {item.species} • {item.breed} • {item.age}
          </Text>
          <Text style={styles.petGender}>{item.gender}</Text>
          {item.bio && (
            <Text style={styles.petBio} numberOfLines={2}>
              {item.bio}
            </Text>
          )}
        </TouchableOpacity>
        
        <View style={styles.petActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditPet(item)}
          >
            <Edit color="#667eea" size={20} strokeWidth={2} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeletePet(item)}
          >
            <Trash2 color="#EF4444" size={20} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <Heart color="#9CA3AF" size={48} strokeWidth={2} />
      </View>
      <Text style={styles.emptyTitle}>Henüz Pet Eklenmemiş</Text>
      <Text style={styles.emptySubtitle}>
        İlk pet'inizi ekleyerek başlayın ve onunla ilgili paylaşımlar yapın.
      </Text>
      <TouchableOpacity
        style={styles.addFirstPetButton}
        onPress={() => router.push('/pet/add')}
      >
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.addFirstPetGradient}
        >
          <Plus color="#FFFFFF" size={20} strokeWidth={2} />
          <Text style={styles.addFirstPetText}>İlk Pet'imi Ekle</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

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
          <Text style={styles.headerTitle}>Pet'lerim</Text>
          <TouchableOpacity 
            style={styles.addButton}
            onPress={() => router.push('/pet/add')}
          >
            <Plus color="#FFFFFF" size={24} strokeWidth={2} />
          </TouchableOpacity>
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
        <Text style={styles.headerTitle}>Pet'lerim</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => router.push('/pet/add')}
        >
          <Plus color="#FFFFFF" size={24} strokeWidth={2} />
        </TouchableOpacity>
      </LinearGradient>

      {pets.length === 0 ? (
        renderEmptyState()
      ) : (
        <View style={styles.content}>
          <View style={styles.statsContainer}>
            <Text style={styles.statsText}>
              {pets.length} pet{'\n'}kayıtlı
            </Text>
          </View>
          
          <FlatList
            data={pets}
            renderItem={renderPetItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#667eea']}
                tintColor="#667eea"
              />
            }
          />
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
  addButton: {
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
  statsContainer: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#667eea',
    textAlign: 'center',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  petCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  petImageContainer: {
    marginRight: 16,
  },
  petImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  defaultPetImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  petInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  petName: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  petDetails: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 2,
  },
  petGender: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#667eea',
    marginBottom: 8,
  },
  petBio: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    lineHeight: 18,
  },
  petActions: {
    flexDirection: 'row',
    marginTop: 12,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  deleteButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    backgroundColor: 'rgba(156, 163, 175, 0.1)',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 12,
  },
  emptySubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  addFirstPetButton: {
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  addFirstPetGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  addFirstPetText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
});
