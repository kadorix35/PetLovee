import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Heart, UserPlus, UserMinus } from 'lucide-react-native';
import { PetProfile } from '@/types/index';

interface PetCardProps {
  pet: PetProfile;
  isFollowing: boolean;
  onToggleFollow: (petId: string) => void;
}

export default function PetCard({ pet, isFollowing, onToggleFollow }: PetCardProps) {
  return (
    <View style={styles.card}>
      <Image source={{ uri: pet.photoUrl }} style={styles.petImage} />
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.petName}>{pet.name}</Text>
          <TouchableOpacity
            style={[styles.followButton, isFollowing && styles.followingButton]}
            onPress={() => onToggleFollow(pet.id)}
          >
            {isFollowing ? (
              <UserMinus size={16} color="#FFFFFF" strokeWidth={2} />
            ) : (
              <UserPlus size={16} color="#FFFFFF" strokeWidth={2} />
            )}
            <Text style={styles.followButtonText}>
              {isFollowing ? 'Takibi Bırak' : 'Takip Et'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.petInfo}>
          <Text style={styles.petBreed}>{pet.breed} • {pet.species}</Text>
          <Text style={styles.petDetails}>{pet.age} • {pet.gender}</Text>
          {pet.bio && <Text style={styles.petBio}>{pet.bio}</Text>}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  petImage: {
    width: '100%',
    height: 200,
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  petName: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
  },
  followButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  followingButton: {
    backgroundColor: '#EC4899',
  },
  followButtonText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
  petInfo: {
    gap: 4,
  },
  petBreed: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#6B7280',
  },
  petDetails: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  petBio: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#4B5563',
    marginTop: 8,
    lineHeight: 20,
  },
});