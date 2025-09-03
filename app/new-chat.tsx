import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  ArrowLeft, 
  Search, 
  UserPlus, 
  MessageCircle,
  Users
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useMessaging } from '@/contexts/MessagingContext';
import { petProfiles } from '@/data/mockData';
import { PetProfile } from '@/types/index';

export default function NewChatScreen() {
  const router = useRouter();
  const { createChat } = useMessaging();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredPets, setFilteredPets] = useState<PetProfile[]>([]);
  const [selectedPets, setSelectedPets] = useState<Set<string>>(new Set());

  useEffect(() => {
    setFilteredPets(petProfiles);
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = petProfiles.filter(pet =>
        pet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pet.breed.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pet.species.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredPets(filtered);
    } else {
      setFilteredPets(petProfiles);
    }
  }, [searchQuery]);

  const handlePetSelect = (petId: string) => {
    const newSelected = new Set(selectedPets);
    if (newSelected.has(petId)) {
      newSelected.delete(petId);
    } else {
      newSelected.add(petId);
    }
    setSelectedPets(newSelected);
  };

  const handleCreateChat = async () => {
    if (selectedPets.size === 0) {
      Alert.alert('Uyarı', 'Lütfen en az bir pet seçin.');
      return;
    }

    try {
      const currentUserId = 'user1'; // Bu auth context'ten gelecek
      const participantIds = [currentUserId, ...Array.from(selectedPets)];
      
      const chatId = await createChat(participantIds);
      
      // Chat ekranına git
      router.push(`/chat/${chatId}`);
    } catch (error) {
      console.error('Chat oluşturulamadı:', error);
      Alert.alert('Hata', 'Chat oluşturulamadı. Lütfen tekrar deneyin.');
    }
  };

  const renderPetItem = ({ item }: { item: PetProfile }) => {
    const isSelected = selectedPets.has(item.id);
    
    return (
      <TouchableOpacity
        style={[styles.petItem, isSelected && styles.selectedPetItem]}
        onPress={() => handlePetSelect(item.id)}
      >
        <Image source={{ uri: item.photoUrl }} style={styles.petAvatar} />
        
        <View style={styles.petInfo}>
          <Text style={styles.petName}>{item.name}</Text>
          <Text style={styles.petDetails}>{item.breed} • {item.species}</Text>
          <Text style={styles.petAge}>{item.age} • {item.gender}</Text>
        </View>
        
        <View style={styles.selectionIndicator}>
          {isSelected ? (
            <View style={styles.selectedIndicator}>
              <UserPlus color="#FFFFFF" size={16} strokeWidth={2} />
            </View>
          ) : (
            <View style={styles.unselectedIndicator} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft color="#FFFFFF" size={24} strokeWidth={2} />
          </TouchableOpacity>
          
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Yeni Sohbet</Text>
            {selectedPets.size > 0 && (
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>{selectedPets.size}</Text>
              </View>
            )}
          </View>
          
          {selectedPets.size > 0 && (
            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreateChat}
            >
              <MessageCircle color="#FFFFFF" size={24} strokeWidth={2} />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search color="#6B7280" size={20} strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            placeholder="Pet ara..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
        </View>
      </View>

      <View style={styles.selectedPetsContainer}>
        <Text style={styles.sectionTitle}>
          Seçilen Petler ({selectedPets.size})
        </Text>
        {selectedPets.size > 0 ? (
          <FlatList
            data={Array.from(selectedPets)}
            horizontal
            showsHorizontalScrollIndicator={false}
            renderItem={({ item: petId }) => {
              const pet = petProfiles.find(p => p.id === petId);
              if (!pet) return null;
              
              return (
                <View style={styles.selectedPetChip}>
                  <Image source={{ uri: pet.photoUrl }} style={styles.chipAvatar} />
                  <Text style={styles.chipName}>{pet.name}</Text>
                </View>
              );
            }}
            keyExtractor={(petId) => petId}
            contentContainerStyle={styles.selectedPetsList}
          />
        ) : (
          <Text style={styles.emptySelectionText}>
            Henüz pet seçilmedi
          </Text>
        )}
      </View>

      <FlatList
        data={filteredPets}
        keyExtractor={(item) => item.id}
        renderItem={renderPetItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <Text style={styles.sectionTitle}>Tüm Petler</Text>
            <Text style={styles.sectionSubtitle}>
              Sohbet etmek istediğiniz pet sahiplerini seçin
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Users color="#9CA3AF" size={48} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>Pet bulunamadı</Text>
            <Text style={styles.emptySubtitle}>
              Arama kriterlerinize uygun pet bulunamadı
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginRight: 8,
  },
  badgeContainer: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  createButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
  },
  selectedPetsContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 16,
  },
  selectedPetsList: {
    paddingVertical: 8,
  },
  selectedPetChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0E7FF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    gap: 8,
  },
  chipAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  chipName: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#667eea',
  },
  emptySelectionText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  listContainer: {
    flexGrow: 1,
  },
  listHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  petItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  selectedPetItem: {
    backgroundColor: '#F0F9FF',
  },
  petAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  petInfo: {
    flex: 1,
  },
  petName: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  petDetails: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#667eea',
    marginBottom: 2,
  },
  petAge: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  selectionIndicator: {
    marginLeft: 16,
  },
  selectedIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unselectedIndicator: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
