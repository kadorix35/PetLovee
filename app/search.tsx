import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Search, 
  X, 
  Filter, 
  MapPin, 
  Heart, 
  UserPlus, 
  UserMinus,
  SlidersHorizontal,
  Star,
  Clock
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { petProfiles, veterinaryClinics } from '@/data/mockData';
import { PetProfile, VeterinaryClinic } from '@/types/index';

const { width } = Dimensions.get('window');

interface FilterOptions {
  species: string[];
  breed: string[];
  age: string[];
  gender: string[];
  location: string;
  sortBy: 'recent' | 'popular' | 'distance';
}

export default function SearchScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'pets' | 'clinics'>('pets');
  const [showFilters, setShowFilters] = useState(false);
  const [filteredPets, setFilteredPets] = useState<PetProfile[]>([]);
  const [filteredClinics, setFilteredClinics] = useState<VeterinaryClinic[]>([]);
  const [filters, setFilters] = useState<FilterOptions>({
    species: [],
    breed: [],
    age: [],
    gender: [],
    location: '',
    sortBy: 'recent',
  });

  const speciesOptions = ['Köpek', 'Kedi', 'Kuş', 'Balık', 'Hamster', 'Tavşan'];
  const breedOptions = ['Golden Retriever', 'Persian', 'Husky', 'Poodle', 'British Shorthair'];
  const ageOptions = ['0-1 yaş', '1-3 yaş', '3-5 yaş', '5+ yaş'];
  const genderOptions = ['Erkek', 'Dişi'];

  useEffect(() => {
    performSearch();
  }, [searchQuery, filters, activeTab]);

  const performSearch = () => {
    if (activeTab === 'pets') {
      let results = petProfiles;

      // Metin araması
      if (searchQuery.trim()) {
        results = results.filter(pet =>
          pet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          pet.breed.toLowerCase().includes(searchQuery.toLowerCase()) ||
          pet.species.toLowerCase().includes(searchQuery.toLowerCase()) ||
          pet.bio.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      // Filtreleme
      if (filters.species.length > 0) {
        results = results.filter(pet => filters.species.includes(pet.species));
      }
      if (filters.breed.length > 0) {
        results = results.filter(pet => filters.breed.includes(pet.breed));
      }
      if (filters.gender.length > 0) {
        results = results.filter(pet => filters.gender.includes(pet.gender));
      }

      // Sıralama
      switch (filters.sortBy) {
        case 'popular':
          results.sort((a, b) => b.name.localeCompare(a.name));
          break;
        case 'recent':
          results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          break;
      }

      setFilteredPets(results);
    } else {
      let results = veterinaryClinics;

      // Metin araması
      if (searchQuery.trim()) {
        results = results.filter(clinic =>
          clinic.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          clinic.address.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      // Konum filtresi
      if (filters.location.trim()) {
        results = results.filter(clinic =>
          clinic.address.toLowerCase().includes(filters.location.toLowerCase())
        );
      }

      // Sıralama
      switch (filters.sortBy) {
        case 'popular':
          results.sort((a, b) => b.rating - a.rating);
          break;
        case 'distance':
          results.sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
          break;
        case 'recent':
        default:
          // Varsayılan sıralama
          break;
      }

      setFilteredClinics(results);
    }
  };

  const toggleFilter = (category: keyof FilterOptions, value: string) => {
    if (category === 'location' || category === 'sortBy') {
      setFilters(prev => ({ ...prev, [category]: value }));
    } else {
      setFilters(prev => ({
        ...prev,
        [category]: prev[category].includes(value)
          ? prev[category].filter(item => item !== value)
          : [...prev[category], value]
      }));
    }
  };

  const clearFilters = () => {
    setFilters({
      species: [],
      breed: [],
      age: [],
      gender: [],
      location: '',
      sortBy: 'recent',
    });
    setSearchQuery('');
  };

  const renderPetCard = ({ item }: { item: PetProfile }) => (
    <TouchableOpacity
      style={styles.petCard}
      onPress={() => router.push(`/profile/${item.id}`)}
    >
      <Image source={{ uri: item.photoUrl }} style={styles.petImage} />
      <View style={styles.petInfo}>
        <Text style={styles.petName}>{item.name}</Text>
        <Text style={styles.petBreed}>{item.breed} • {item.species}</Text>
        <Text style={styles.petAge}>{item.age} • {item.gender}</Text>
        <Text style={styles.petBio} numberOfLines={2}>{item.bio}</Text>
      </View>
      <TouchableOpacity style={styles.followButton}>
        <UserPlus color="#667eea" size={16} strokeWidth={2} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderClinicCard = ({ item }: { item: VeterinaryClinic }) => (
    <TouchableOpacity
      style={styles.clinicCard}
      onPress={() => {
        // Harita ekranına git ve kliniği göster
        router.push('/map');
      }}
    >
      <View style={styles.clinicHeader}>
        <Text style={styles.clinicName}>{item.name}</Text>
        <View style={styles.ratingContainer}>
          <Star color="#FFD700" size={14} strokeWidth={2} fill="#FFD700" />
          <Text style={styles.rating}>{item.rating}</Text>
        </View>
      </View>
      
      <View style={styles.clinicDetails}>
        <View style={styles.detailRow}>
          <MapPin color="#667eea" size={14} strokeWidth={2} />
          <Text style={styles.clinicAddress}>{item.address}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Clock color="#764ba2" size={14} strokeWidth={2} />
          <Text style={styles.hours}>{item.hours}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.distance}>{item.distance}</Text>
        </View>
      </View>
      
      <View style={styles.statusContainer}>
        <View style={[
          styles.statusIndicator,
          { backgroundColor: item.isOpen ? '#10B981' : '#EF4444' }
        ]}>
          <Text style={styles.statusText}>
            {item.isOpen ? 'AÇIK' : 'KAPALI'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFilterSection = (title: string, options: string[], category: keyof FilterOptions) => (
    <View style={styles.filterSection}>
      <Text style={styles.filterTitle}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterOptions}>
        {options.map((option) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.filterChip,
              filters[category].includes(option) && styles.filterChipActive
            ]}
            onPress={() => toggleFilter(category, option)}
          >
            <Text style={[
              styles.filterChipText,
              filters[category].includes(option) && styles.filterChipTextActive
            ]}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <View style={styles.filtersHeader}>
        <Text style={styles.filtersTitle}>Filtreler</Text>
        <TouchableOpacity onPress={clearFilters}>
          <Text style={styles.clearFiltersText}>Temizle</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'pets' ? (
        <>
          {renderFilterSection('Tür', speciesOptions, 'species')}
          {renderFilterSection('Cins', breedOptions, 'breed')}
          {renderFilterSection('Yaş', ageOptions, 'age')}
          {renderFilterSection('Cinsiyet', genderOptions, 'gender')}
        </>
      ) : (
        <View style={styles.filterSection}>
          <Text style={styles.filterTitle}>Konum</Text>
          <TextInput
            style={styles.locationInput}
            placeholder="Şehir veya bölge ara..."
            value={filters.location}
            onChangeText={(text) => toggleFilter('location', text)}
            placeholderTextColor="#9CA3AF"
          />
        </View>
      )}

      <View style={styles.filterSection}>
        <Text style={styles.filterTitle}>Sıralama</Text>
        <View style={styles.sortOptions}>
          {[
            { key: 'recent', label: 'En Yeni' },
            { key: 'popular', label: 'En Popüler' },
            { key: 'distance', label: 'En Yakın' }
          ].map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.sortChip,
                filters.sortBy === option.key && styles.sortChipActive
              ]}
              onPress={() => toggleFilter('sortBy', option.key)}
            >
              <Text style={[
                styles.sortChipText,
                filters.sortBy === option.key && styles.sortChipTextActive
              ]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.searchContainer}>
            <Search color="#6B7280" size={20} strokeWidth={2} />
            <TextInput
              style={styles.searchInput}
              placeholder={activeTab === 'pets' ? 'Pet ara...' : 'Klinik ara...'}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9CA3AF"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X color="#6B7280" size={20} strokeWidth={2} />
              </TouchableOpacity>
            )}
          </View>
          
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal color="#FFFFFF" size={20} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'pets' && styles.activeTab]}
            onPress={() => setActiveTab('pets')}
          >
            <Text style={[styles.tabText, activeTab === 'pets' && styles.activeTabText]}>
              Petler
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'clinics' && styles.activeTab]}
            onPress={() => setActiveTab('clinics')}
          >
            <Text style={[styles.tabText, activeTab === 'clinics' && styles.activeTabText]}>
              Klinikler
            </Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {showFilters && renderFilters()}

      <FlatList
        data={activeTab === 'pets' ? filteredPets : filteredClinics}
        keyExtractor={(item) => item.id}
        renderItem={activeTab === 'pets' ? renderPetCard : renderClinicCard}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {searchQuery.trim() ? 'Arama sonucu bulunamadı' : 'Henüz içerik yok'}
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
    marginBottom: 16,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
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
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  tabText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filtersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  filtersTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
  },
  clearFiltersText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#667eea',
  },
  filterSection: {
    marginBottom: 20,
  },
  filterTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterChipActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  filterChipText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  locationInput: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sortOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  sortChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  sortChipActive: {
    backgroundColor: '#667eea',
    borderColor: '#667eea',
  },
  sortChipText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
  },
  sortChipTextActive: {
    color: '#FFFFFF',
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  petCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  petImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
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
  petBreed: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#667eea',
    marginBottom: 2,
  },
  petAge: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 4,
  },
  petBio: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    lineHeight: 16,
  },
  followButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clinicCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  clinicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  clinicName: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  rating: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#92400E',
  },
  clinicDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  clinicAddress: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    flex: 1,
  },
  hours: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  distance: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#667eea',
  },
  statusContainer: {
    alignItems: 'flex-end',
    marginTop: 8,
  },
  statusIndicator: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
  },
});
