import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  RefreshControl,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Video } from 'expo-av';
import { Heart, UserPlus, UserMinus, Search, Play, MessageCircle, Share, MoveHorizontal as MoreHorizontal } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { petProfiles, followRelations, posts } from '@/data/mockData';
import { PetProfile, FollowRelation, Post } from '@/types/index';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<PetProfile[]>([]);
  const [follows, setFollows] = useState<FollowRelation[]>([]);
  const [feedPosts, setFeedPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const currentUserId = 'user1';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setProfiles(petProfiles);
    setFollows(followRelations);
    setFeedPosts(posts);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const isFollowing = (petId: string) => {
    return follows.some(f => f.followerId === currentUserId && f.followedId === petId);
  };

  const toggleFollow = (petId: string) => {
    if (isFollowing(petId)) {
      setFollows(follows.filter(f => !(f.followerId === currentUserId && f.followedId === petId)));
    } else {
      setFollows([...follows, {
        id: `${currentUserId}-${petId}-${Date.now()}`,
        followerId: currentUserId,
        followedId: petId,
        createdAt: new Date().toISOString()
      }]);
    }
  };

  const handleLike = (postId: string) => {
    const newLikedPosts = new Set(likedPosts);
    if (likedPosts.has(postId)) {
      newLikedPosts.delete(postId);
    } else {
      newLikedPosts.add(postId);
    }
    setLikedPosts(newLikedPosts);
    
    setFeedPosts(posts => posts.map(post => 
      post.id === postId 
        ? { ...post, likes: likedPosts.has(postId) ? post.likes - 1 : post.likes + 1 }
        : post
    ));
  };

  const handleComment = (postId: string) => {
    router.push(`/post/${postId}`);
  };

  const handleShare = (post: Post) => {
    // Share functionality would be implemented here
    console.log('Sharing post:', post.id);
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
          <TouchableOpacity
            style={[styles.followBtn, following && styles.followingBtn]}
            onPress={() => pet && toggleFollow(pet.id)}
          >
            {following ? (
              <UserMinus size={14} color="#FFFFFF" strokeWidth={2} />
            ) : (
              <UserPlus size={14} color="#FFFFFF" strokeWidth={2} />
            )}
          </TouchableOpacity>
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
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleLike(post.id)}
            >
              <Heart 
                color={isLiked ? "#FF6B6B" : "#374151"} 
                size={22} 
                strokeWidth={2}
                fill={isLiked ? "#FF6B6B" : "none"}
              />
              <Text style={styles.actionText}>{post.likes}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleComment(post.id)}
            >
              <MessageCircle color="#667eea" size={22} strokeWidth={2} />
              <Text style={styles.actionText}>{post.comments}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => handleShare(post)}
            >
              <Share color="#764ba2" size={22} strokeWidth={2} />
            </TouchableOpacity>
          </View>
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
          <TouchableOpacity style={styles.searchButton}>
            <Search color="#FFFFFF" size={20} strokeWidth={2} />
          </TouchableOpacity>
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
  followBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#667eea',
    justifyContent: 'center',
    alignItems: 'center',
  },
  followingBtn: {
    backgroundColor: '#f093fb',
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
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
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
});