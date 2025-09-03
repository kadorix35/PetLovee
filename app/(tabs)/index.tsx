import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  RefreshControl,
  Dimensions,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Video } from 'expo-av';
import { Heart, UserPlus, UserMinus, Search, Play, MessageCircle, Share, MoveHorizontal as MoreHorizontal, Bell } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { PetProfile, FollowRelation, Post } from '@/types/index';
import { useNotifications } from '@/contexts/NotificationContext';
import { useMessaging } from '@/contexts/MessagingContext';
import { useAuth } from '@/contexts/AuthContext';
import databaseService from '@/services/databaseService';
import ShareModal from '@/components/ShareModal';
import SocialStats from '@/components/SocialStats';
import FollowButton from '@/components/FollowButton';
import LikeButton from '@/components/LikeButton';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { unreadCount } = useNotifications();
  const { unreadCount: unreadMessages } = useMessaging();
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<PetProfile[]>([]);
  const [follows, setFollows] = useState<FollowRelation[]>([]);
  const [feedPosts, setFeedPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const currentUserId = user?.uid || '';

  useEffect(() => {
    if (currentUserId) {
      loadData();
      setupRealTimeListeners();
    }
  }, [currentUserId]);

  const loadData = async () => {
    if (!currentUserId) return;
    
    try {
      setLoading(true);
      
      // Feed posts'ları yükle
      const { posts: feedPostsData } = await databaseService.getFeedPosts(20);
      setFeedPosts(feedPostsData);
      
      // Takip edilen pet'leri yükle
      const followingData = await databaseService.getFollowing(currentUserId);
      setFollows(followingData);
      
      // Pet profillerini yükle (feed'deki post'lar için)
      const petIds = [...new Set(feedPostsData.map(post => post.petId))];
      const profilesData = await Promise.all(
        petIds.map(petId => databaseService.getPetProfile(petId))
      );
      setProfiles(profilesData.filter(Boolean) as PetProfile[]);
      
      // Beğenilen post'ları yükle
      const likedPostsSet = new Set<string>();
      for (const post of feedPostsData) {
        const isLiked = await databaseService.isPostLiked(post.id, currentUserId);
        if (isLiked) {
          likedPostsSet.add(post.id);
        }
      }
      setLikedPosts(likedPostsSet);
      
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      Alert.alert('Hata', 'Veriler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const setupRealTimeListeners = () => {
    if (!currentUserId) return;
    
    // Real-time post güncellemeleri
    const unsubscribePosts = databaseService.onPostsChange((posts) => {
      setFeedPosts(posts);
    });
    
    return () => {
      unsubscribePosts();
    };
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const isFollowing = (petId: string) => {
    return follows.some(f => f.followerId === currentUserId && f.followedId === petId);
  };

  const toggleFollow = async (petId: string) => {
    if (!currentUserId) {
      Alert.alert('Hata', 'Giriş yapmanız gerekiyor');
      return;
    }

    try {
      if (isFollowing(petId)) {
        await databaseService.unfollowPet(currentUserId, petId);
        setFollows(follows.filter(f => !(f.followerId === currentUserId && f.followedId === petId)));
      } else {
        await databaseService.followPet(currentUserId, petId);
        setFollows([...follows, {
          id: `${currentUserId}_${petId}`,
          followerId: currentUserId,
          followedId: petId,
          createdAt: new Date().toISOString()
        }]);
      }
    } catch (error) {
      console.error('Takip işlemi hatası:', error);
      Alert.alert('Hata', 'Takip işlemi sırasında bir hata oluştu');
    }
  };

  const handleLike = async (postId: string) => {
    if (!currentUserId) {
      Alert.alert('Hata', 'Giriş yapmanız gerekiyor');
      return;
    }

    try {
      const newLikedPosts = new Set(likedPosts);
      if (likedPosts.has(postId)) {
        await databaseService.unlikePost(postId, currentUserId);
        newLikedPosts.delete(postId);
      } else {
        await databaseService.likePost(postId, currentUserId);
        newLikedPosts.add(postId);
      }
      setLikedPosts(newLikedPosts);
      
      // Optimistic update
      setFeedPosts(posts => posts.map(post => 
        post.id === postId 
          ? { ...post, likes: likedPosts.has(postId) ? post.likes - 1 : post.likes + 1 }
          : post
      ));
    } catch (error) {
      console.error('Beğeni işlemi hatası:', error);
      Alert.alert('Hata', 'Beğeni işlemi sırasında bir hata oluştu');
    }
  };

  const handleComment = (postId: string) => {
    router.push(`/post/${postId}`);
  };

  const handleShare = (post: Post) => {
    setSelectedPost(post);
    setShareModalVisible(true);
  };

  const handleUserPress = (petId: string) => {
    router.push(`/profile/${petId}`);
  };

  const PostCard = ({ post }: { post: Post }) => {
    const pet = profiles.find(p => p.id === post.petId);
    const following = pet ? isFollowing(pet.id) : false;
    const isLiked = likedPosts.has(post.id);

    return (
      <View style={styles.postCard}>
        {/* Post Header */}
        <View style={styles.postHeader}>
          <TouchableOpacity 
            style={styles.userInfo}
            onPress={() => pet && handleUserPress(pet.id)}
          >
            <Image source={{ uri: pet?.photoUrl }} style={styles.userAvatar} />
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{pet?.name}</Text>
              <Text style={styles.userBreed}>{pet?.breed} • {pet?.species}</Text>
            </View>
          </TouchableOpacity>
          <FollowButton
            isFollowing={following}
            onToggle={() => pet && toggleFollow(pet.id)}
            size="small"
            variant="primary"
          />
        </View>

        {/* Post Media */}
        <View style={styles.mediaContainer}>
          {post.type === 'video' ? (
            <TouchableOpacity 
              style={styles.videoContainer}
              onPress={() => router.push(`/post/${post.id}`)}
            >
              <Image source={{ uri: post.mediaUrl }} style={styles.postMedia} />
              <View style={styles.playOverlay}>
                <View style={styles.playButton}>
                  <Play color="#FFFFFF" size={24} strokeWidth={2} fill="#FFFFFF" />
                </View>
              </View>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={() => router.push(`/post/${post.id}`)}>
              <Image source={{ uri: post.mediaUrl }} style={styles.postMedia} />
            </TouchableOpacity>
          )}
        </View>

        {/* Post Actions */}
        <View style={styles.postActions}>
          <SocialStats
            likes={post.likes}
            comments={post.comments}
            onLikePress={() => handleLike(post.id)}
            onCommentPress={() => handleComment(post.id)}
            onSharePress={() => handleShare(post)}
            isLiked={isLiked}
            size="medium"
          />
        </View>

        {/* Post Caption */}
        {post.caption && (
          <View style={styles.captionContainer}>
            <TouchableOpacity onPress={() => router.push(`/post/${post.id}`)}>
              <Text style={styles.caption}>
                <Text style={styles.captionUser}>{pet?.name}</Text> {post.caption}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Modern Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTitle}>
            <View style={styles.headerPaw}>
              <View style={styles.miniPawPad} />
              <View style={[styles.miniPawToe, styles.miniToe1]} />
              <View style={[styles.miniPawToe, styles.miniToe2]} />
            </View>
            <Text style={styles.headerText}>PetLove</Text>
          </View>
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={styles.notificationButton}
              onPress={() => router.push('/notifications')}
            >
              <Bell color="#FFFFFF" size={20} strokeWidth={2} />
              {unreadCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.badgeText}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.searchButton}
              onPress={() => router.push('/search')}
            >
              <Search color="#FFFFFF" size={20} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.headerSubtext}>Sevimli dostlarınızın dünyası</Text>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {feedPosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </ScrollView>

      {/* Share Modal */}
      {selectedPost && (
        <ShareModal
          visible={shareModalVisible}
          onClose={() => {
            setShareModalVisible(false);
            setSelectedPost(null);
          }}
          post={selectedPost}
          pet={profiles.find(p => p.id === selectedPost.petId)!}
        />
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
    marginBottom: 8,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerPaw: {
    width: 24,
    height: 24,
    position: 'relative',
  },
  miniPawPad: {
    width: 12,
    height: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    position: 'absolute',
    bottom: 0,
    left: 6,
  },
  miniPawToe: {
    width: 4,
    height: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
    position: 'absolute',
  },
  miniToe1: {
    top: 0,
    left: 4,
  },
  miniToe2: {
    top: 2,
    left: 16,
  },
  headerText: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  headerSubtext: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  searchButton: {
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
  postCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#667eea',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 2,
  },
  userBreed: {
    fontSize: 13,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
  },

  mediaContainer: {
    position: 'relative',
  },
  videoContainer: {
    position: 'relative',
  },
  postMedia: {
    width: '100%',
    height: 300,
  },
  playOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  postActions: {
    padding: 16,
  },
  captionContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  caption: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    lineHeight: 20,
  },
  captionUser: {
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
  },
  messageBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  messageBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
});