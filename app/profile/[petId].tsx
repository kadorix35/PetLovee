import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, UserPlus, UserMinus, MessageCircle, Grid2x2 as Grid, User } from 'lucide-react-native';
import { FlatGrid } from 'react-native-super-grid';
import { petProfiles, followRelations, posts } from '@/data/mockData';
import { PetProfile, Post } from '@/types/index';
import { useMessaging } from '@/contexts/MessagingContext';

const { width } = Dimensions.get('window');

export default function PetProfileScreen() {
  const { petId } = useLocalSearchParams();
  const router = useRouter();
  const { createChat } = useMessaging();
  const [pet, setPet] = useState<PetProfile | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [petPosts, setPetPosts] = useState<Post[]>([]);

  useEffect(() => {
    const foundPet = petProfiles.find(p => p.id === petId);
    if (foundPet) {
      setPet(foundPet);
      // Check if current user is following this pet
      const currentUserId = 'user1';
      const following = followRelations.some(f => 
        f.followerId === currentUserId && f.followedId === petId
      );
      setIsFollowing(following);
      
      // Get posts by this pet
      const petPostsData = posts.filter(p => p.petId === petId);
      setPetPosts(petPostsData);
    }
  }, [petId]);

  const toggleFollow = () => {
    setIsFollowing(!isFollowing);
    // Here you would typically make an API call to follow/unfollow
  };

  const handlePostPress = (post: Post) => {
    router.push(`/post/${post.id}`);
  };

  const handleMessageOwner = async () => {
    if (!pet) return;
    
    try {
      // Pet sahibi ile chat oluştur
      const currentUserId = 'user1'; // Bu auth context'ten gelecek
      const chatId = await createChat([currentUserId, pet.ownerId]);
      
      // Chat ekranına git
      router.push(`/chat/${chatId}`);
    } catch (error) {
      console.error('Chat oluşturulamadı:', error);
    }
  };

  if (!pet) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Pet bulunamadı</Text>
        </View>
      </SafeAreaView>
    );
  }

  const PostCard = ({ post }: { post: Post }) => (
    <TouchableOpacity 
      style={styles.postCard}
      onPress={() => handlePostPress(post)}
    >
      <Image source={{ uri: post.mediaUrl }} style={styles.postImage} />
      <View style={styles.postOverlay}>
        <View style={styles.postStats}>
          <View style={styles.postStatItem}>
            <Text style={styles.statText}>{post.likes}</Text>
          </View>
          <View style={styles.postStatItem}>
            <Text style={styles.statText}>{post.comments}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
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
          <Text style={styles.headerTitle}>{pet.name}</Text>
          <TouchableOpacity
            style={[styles.followButton, isFollowing && styles.followingButton]}
            onPress={toggleFollow}
          >
            {isFollowing ? (
              <UserMinus size={16} color="#FFFFFF" strokeWidth={2} />
            ) : (
              <UserPlus size={16} color="#FFFFFF" strokeWidth={2} />
            )}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {/* Pet Info */}
        <View style={styles.petInfo}>
          <Image source={{ uri: pet.photoUrl }} style={styles.petAvatar} />
          <Text style={styles.petName}>{pet.name}</Text>
          <Text style={styles.petDetails}>{pet.breed} • {pet.species} • {pet.age}</Text>
          <Text style={styles.petGender}>{pet.gender}</Text>
          <Text style={styles.petBio}>{pet.bio}</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.followActionButton]}
            onPress={toggleFollow}
          >
            <LinearGradient
              colors={isFollowing ? ['#f093fb', '#f5576c'] : ['#667eea', '#764ba2']}
              style={styles.actionButtonGradient}
            >
              {isFollowing ? (
                <UserMinus size={20} color="#FFFFFF" strokeWidth={2} />
              ) : (
                <UserPlus size={20} color="#FFFFFF" strokeWidth={2} />
              )}
              <Text style={styles.actionButtonText}>
                {isFollowing ? 'Takibi Bırak' : 'Takip Et'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, styles.messageActionButton]}
            onPress={handleMessageOwner}
          >
            <LinearGradient
              colors={['#10B981', '#059669']}
              style={styles.actionButtonGradient}
            >
              <MessageCircle size={20} color="#FFFFFF" strokeWidth={2} />
              <Text style={styles.actionButtonText}>Mesaj Gönder</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statsItem}>
            <Text style={styles.statNumber}>{petPosts.length}</Text>
            <Text style={styles.statLabel}>Gönderi</Text>
          </View>
          <View style={styles.statsItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Takipçi</Text>
          </View>
          <View style={styles.statsItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Takip</Text>
          </View>
        </View>

        {/* View Mode Toggle */}
        <View style={styles.viewModeContainer}>
          <TouchableOpacity
            style={[styles.viewModeButton, viewMode === 'grid' && styles.activeViewMode]}
            onPress={() => setViewMode('grid')}
          >
            <Grid color={viewMode === 'grid' ? '#667eea' : '#9CA3AF'} size={20} strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewModeButton, viewMode === 'list' && styles.activeViewMode]}
            onPress={() => setViewMode('list')}
          >
            <User color={viewMode === 'list' ? '#667eea' : '#9CA3AF'} size={20} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Posts */}
        {viewMode === 'grid' ? (
          <FlatGrid
            itemDimension={width / 3 - 20}
            data={petPosts}
            style={styles.postsGrid}
            spacing={10}
            renderItem={({ item }) => <PostCard post={item} />}
            ListHeaderComponent={() => (
              <View style={styles.headerSpacer} />
            )}
          />
        ) : (
          <ScrollView style={styles.postsList} showsVerticalScrollIndicator={false}>
            {petPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
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
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  followButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  followingButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  content: {
    flex: 1,
  },
  petInfo: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
  },
  petAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
    borderWidth: 4,
    borderColor: '#667eea',
  },
  petName: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  petDetails: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#667eea',
    marginBottom: 4,
  },
  petGender: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginBottom: 12,
  },
  petBio: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    textAlign: 'center',
    lineHeight: 20,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 8,
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
  followActionButton: {
    // Specific styles for follow button if needed
  },
  messageActionButton: {
    // Specific styles for message button if needed
  },
  actionButtonGradient: {
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
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 24,
    marginBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  statsItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  statNumber: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 6,
  },
  statLabel: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  viewModeContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 8,
    justifyContent: 'center',
    gap: 20,
  },
  viewModeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeViewMode: {
    backgroundColor: '#E0E7FF',
  },
  postsGrid: {
    marginHorizontal: 16,
  },
  postsList: {
    paddingHorizontal: 16,
    flex: 1,
  },
  headerSpacer: {
    height: 0,
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postImage: {
    width: '100%',
    height: 200,
  },
  postOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 8,
  },
  postStats: {
    flexDirection: 'row',
    gap: 16,
  },
  postStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
    color: '#FFFFFF',
  },
});