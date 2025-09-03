import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Linking,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MapPin, Phone, Clock, Navigation, X, Star, Filter } from 'lucide-react-native';
import { veterinaryClinics } from '@/data/mockData';
import { VeterinaryClinic } from '@/types/index';

const { width } = Dimensions.get('window');

export default function MapScreen() {
  const [selectedClinic, setSelectedClinic] = useState<VeterinaryClinic | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const handleClinicPress = (clinic: VeterinaryClinic) => {
    setSelectedClinic(clinic);
    setShowDetails(true);
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleNavigate = (address: string) => {
    const encodedAddress = encodeURIComponent(address);
    Linking.openURL(`https://maps.google.com/maps?q=${encodedAddress}`);
  };

  const ClinicCard = ({ clinic }: { clinic: VeterinaryClinic }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleClinicPress(clinic)}
    >
      <LinearGradient
        colors={clinic.isOpen ? ['#10B981', '#059669'] : ['#EF4444', '#DC2626']}
        style={styles.statusIndicator}
      >
        <Text style={styles.statusText}>
          {clinic.isOpen ? 'AÇIK' : 'KAPALI'}
        </Text>
      </LinearGradient>

      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.clinicName}>{clinic.name}</Text>
          <View style={styles.ratingContainer}>
            <Star color="#FFD700" size={16} strokeWidth={2} fill="#FFD700" />
            <Text style={styles.rating}>{clinic.rating}</Text>
          </View>
        </View>
        
        <View style={styles.clinicDetails}>
          <View style={styles.detailRow}>
            <MapPin color="#667eea" size={14} strokeWidth={2} />
            <Text style={styles.clinicAddress}>{clinic.address}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Clock color="#764ba2" size={14} strokeWidth={2} />
            <Text style={styles.hours}>{clinic.hours}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Navigation color="#f093fb" size={14} strokeWidth={2} />
            <Text style={styles.distance}>{clinic.distance}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const ClinicDetailsModal = () => (
    <Modal visible={showDetails} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.detailsContainer}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.detailsHeader}
          >
            <Text style={styles.detailsTitle}>{selectedClinic?.name}</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowDetails(false)}
            >
              <X color="#FFFFFF" size={24} strokeWidth={2} />
            </TouchableOpacity>
          </LinearGradient>

          <View style={styles.detailsContent}>
            <View style={styles.detailCard}>
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <MapPin color="#667eea" size={20} strokeWidth={2} />
                </View>
                <Text style={styles.detailText}>{selectedClinic?.address}</Text>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Phone color="#667eea" size={20} strokeWidth={2} />
                </View>
                <Text style={styles.detailText}>{selectedClinic?.phone}</Text>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Clock color="#667eea" size={20} strokeWidth={2} />
                </View>
                <Text style={styles.detailText}>{selectedClinic?.hours}</Text>
              </View>

              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <Star color="#FFD700" size={20} strokeWidth={2} fill="#FFD700" />
                </View>
                <Text style={styles.detailText}>{selectedClinic?.rating} / 5.0</Text>
              </View>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => selectedClinic && handleCall(selectedClinic.phone)}
              >
                <LinearGradient
                  colors={['#10B981', '#059669']}
                  style={styles.actionGradient}
                >
                  <Phone color="#FFFFFF" size={18} strokeWidth={2} />
                  <Text style={styles.actionButtonText}>Ara</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => selectedClinic && handleNavigate(selectedClinic.address)}
              >
                <LinearGradient
                  colors={['#667eea', '#764ba2']}
                  style={styles.actionGradient}
                >
                  <Navigation color="#FFFFFF" size={18} strokeWidth={2} />
                  <Text style={styles.actionButtonText}>Yol Tarifi</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.headerText}>Veteriner Haritası</Text>
            <Text style={styles.headerSubtext}>Yakınınızdaki klinikleri keşfedin</Text>
          </View>
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setShowFilters(true)}
          >
            <Filter color="#FFFFFF" size={20} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.mapPlaceholder}>
          <LinearGradient
            colors={['#F3F4F6', '#E5E7EB']}
            style={styles.mapGradient}
          >
            <View style={styles.mapIconContainer}>
              <MapPin color="#667eea" size={48} strokeWidth={2} />
            </View>
            <Text style={styles.mapPlaceholderText}>İnteraktif Harita</Text>
            <Text style={styles.mapPlaceholderSubtext}>
              Yakınınızdaki veteriner klinikleri burada görünecek
            </Text>
            <View style={styles.mapPins}>
              <View style={[styles.mapPin, { top: 40, left: 60 }]} />
              <View style={[styles.mapPin, { top: 80, right: 80 }]} />
              <View style={[styles.mapPin, { bottom: 60, left: 100 }]} />
            </View>
          </LinearGradient>
        </View>

        <View style={styles.listHeader}>
          <Text style={styles.sectionTitle}>Yakınınızdaki Klinikler</Text>
          <View style={styles.clinicCount}>
            <Text style={styles.countText}>{veterinaryClinics.length}</Text>
            <Text style={styles.countLabel}>klinik</Text>
          </View>
        </View>

        {veterinaryClinics.map((clinic) => (
          <ClinicCard key={clinic.id} clinic={clinic} />
        ))}
      </ScrollView>

      <ClinicDetailsModal />
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
    paddingVertical: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  headerSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
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
  content: {
    flex: 1,
    paddingTop: 16,
  },
  mapPlaceholder: {
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  mapGradient: {
    padding: 40,
    alignItems: 'center',
    position: 'relative',
    minHeight: 200,
  },
  mapIconContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#FFFFFF',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  mapPlaceholderText: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#374151',
    marginBottom: 8,
  },
  mapPlaceholderSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
  },
  mapPins: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  mapPin: {
    position: 'absolute',
    width: 12,
    height: 12,
    backgroundColor: '#EF4444',
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
  },
  clinicCount: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#667eea',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  countText: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  countLabel: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    position: 'relative',
  },
  statusIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 1,
  },
  statusText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  cardContent: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  clinicName: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    flex: 1,
    marginRight: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rating: {
    fontSize: 14,
    fontFamily: 'Inter-Bold',
    color: '#92400E',
  },
  clinicDetails: {
    gap: 12,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  detailsContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '80%',
    overflow: 'hidden',
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  detailsTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    flex: 1,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsContent: {
    padding: 24,
  },
  detailCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  detailIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  detailText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
});