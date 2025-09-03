import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MapPin, Phone, Clock, Navigation } from 'lucide-react-native';
import { VeterinaryClinic } from '@/types/index';

interface VetCardProps {
  clinic: VeterinaryClinic;
  onPress: (clinic: VeterinaryClinic) => void;
}

export default function VetCard({ clinic, onPress }: VetCardProps) {
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress(clinic)}>
      <View style={styles.cardHeader}>
        <View style={styles.clinicInfo}>
          <Text style={styles.clinicName}>{clinic.name}</Text>
          <Text style={styles.clinicAddress}>{clinic.address}</Text>
          <View style={styles.distanceContainer}>
            <Navigation color="#8B5CF6" size={14} strokeWidth={2} />
            <Text style={styles.distance}>{clinic.distance}</Text>
          </View>
        </View>
        <View style={styles.ratingContainer}>
          <Text style={styles.rating}>⭐ {clinic.rating}</Text>
        </View>
      </View>
      
      <View style={styles.cardFooter}>
        <View style={styles.hoursContainer}>
          <Clock color="#6B7280" size={14} strokeWidth={2} />
          <Text style={styles.hours}>{clinic.hours}</Text>
        </View>
        <Text style={[styles.status, clinic.isOpen ? styles.open : styles.closed]}>
          {clinic.isOpen ? 'Açık' : 'Kapalı'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  clinicInfo: {
    flex: 1,
  },
  clinicName: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  clinicAddress: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 8,
  },
  distanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  distance: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#8B5CF6',
  },
  ratingContainer: {
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hoursContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  hours: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },
  status: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  open: {
    backgroundColor: '#D1FAE5',
    color: '#065F46',
  },
  closed: {
    backgroundColor: '#FEE2E2',
    color: '#991B1B',
  },
});