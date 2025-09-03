import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  SafeAreaView,
  TextInput,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
// import { Video } from 'expo-video'; // Geçici olarak kapatıldı
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Heart, MessageCircle, Share, Send, MoveHorizontal as MoreHorizontal, CreditCard as Edit3, Trash2, X } from 'lucide-react-native';
import { Post, PetProfile, Comment } from '@/types/index';
import { useAuth } from '@/contexts/AuthContext';
import databaseService from '@/services/databaseService';
import ShareModal from '@/components/ShareModal';
import SocialStats from '@/components/SocialStats';
import CommentItem from '@/components/CommentItem';
import LikeButton from '@/components/LikeButton';

const { width } = Dimensions.get('window');

export default function PostDetailScreen() {
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [pet, setPet] = useState<PetProfile | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editCaption, setEditCaption] = useState('');
  const [loading, setLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const videoRef = useRef<Video>(null);
  const currentUserId = user?.uid || '';

  useEffect(() => {
    if (postId && currentUserId) {
      loadPostData();
      setupRealTimeListeners();
    }
  }, [postId, currentUserId]);

  const setupRealTimeListeners = () => {
    if (!postId) return;
    
    // Real-time post güncellemeleri
    const unsubscribePost = databaseService.onPostChange(postId, (updatedPost) => {
      if (updatedPost) {
        setPost(updatedPost);
        setLikes(updatedPost.likes);
      }
    });
    
    // Real-time yorum güncellemeleri
    const unsubscribeComments = databaseService.onCommentsChange(postId, (updatedComments) => {
      setComments(updatedComments);
    });
    
    return () => {
      unsubscribePost();
      unsubscribeComments();
    };
  };

  const loadPostData = async () => {
    if (!postId || !currentUserId) return;
    
    try {
      setLoading(true);
      
      // Post'u yükle
      const postData = await databaseService.getPost(postId);
      if (!postData) {
        Alert.alert('Hata', 'Gönderi bulunamadı');
        router.back();
        return;
      }
      
      setPost(postData);
      setLikes(postData.likes);
      setEditCaption(postData.caption);
      
      // Pet profilini yükle
      const petData = await databaseService.getPetProfile(postData.petId);
      setPet(petData);
      
      // Beğeni durumunu kontrol et
      const liked = await databaseService.isPostLiked(postId, currentUserId);
      setIsLiked(liked);
      
      // Yorumları yükle
      const commentsData = await databaseService.getComments(postId);
      setComments(commentsData);
      
    } catch (error) {
      console.error('Post yükleme hatası:', error);
      Alert.alert('Hata', 'Gönderi yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!currentUserId || !postId) {
      Alert.alert('Hata', 'Giriş yapmanız gerekiyor');
      return;
    }

    try {
      if (isLiked) {
        await databaseService.unlikePost(postId, currentUserId);
        setIsLiked(false);
        setLikes(prev => prev - 1);
      } else {
        await databaseService.likePost(postId, currentUserId);
        setIsLiked(true);
        setLikes(prev => prev + 1);
      }
    } catch (error) {
      console.error('Beğeni işlemi hatası:', error);
      Alert.alert('Hata', 'Beğeni işlemi sırasında bir hata oluştu');
    }
  };

  const handleShare = () => {
    setShareModalVisible(true);
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !currentUserId || !postId) return;
    
    try {
      setCommentLoading(true);
      
      // Spam kontrolü
      const isSpam = await databaseService.detectSpam(newComment.trim(), currentUserId);
      if (isSpam) {
        Alert.alert('Uyarı', 'Çok benzer yorumlar gönderiyorsunuz. Lütfen bekleyin.');
        return;
      }
      
      // Rate limiting kontrolü
      const canComment = await databaseService.canUserComment(currentUserId, postId);
      if (!canComment) {
        Alert.alert('Uyarı', 'Çok hızlı yorum yapıyorsunuz. Lütfen bekleyin.');
        return;
      }
      
      const commentData = {
        userId: currentUserId,
        userName: user?.displayName || 'Kullanıcı',
        userAvatar: user?.photoURL || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100',
        text: newComment.trim(),
      };
      
      await databaseService.addComment(postId, commentData, currentUserId);
      
      // Optimistic update
      const newCommentObj: Comment = {
        id: Date.now().toString(),
        ...commentData,
        createdAt: new Date().toISOString(),
      };
      setComments([...comments, newCommentObj]);
      setNewComment('');
      
    } catch (error) {
      console.error('Yorum ekleme hatası:', error);
      Alert.alert('Hata', 'Yorum eklenirken bir hata oluştu');
    } finally {
      setCommentLoading(false);
    }
  };

  const handleEditPost = async () => {
    if (!post || !postId) return;
    
    try {
      await databaseService.updatePost(postId, { caption: editCaption });
      setPost({ ...post, caption: editCaption });
      setShowEditModal(false);
      Alert.alert('Başarılı', 'Gönderi güncellendi!');
    } catch (error) {
      console.error('Post güncelleme hatası:', error);
      Alert.alert('Hata', 'Gönderi güncellenirken bir hata oluştu');
    }
  };

  const handleDeletePost = () => {
    Alert.alert(
      'Gönderiyi Sil',
      'Bu gönderiyi silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Sil', 
          style: 'destructive',
          onPress: async () => {
            try {
              await databaseService.deletePost(postId!);
              Alert.alert('Başarılı', 'Gönderi silindi!');
              router.back();
            } catch (error) {
              console.error('Post silme hatası:', error);
              Alert.alert('Hata', 'Gönderi silinirken bir hata oluştu');
            }
          }
        }
      ]
    );
  };

  const isOwnPost = pet?.ownerId === currentUserId;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!post || !pet) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Gönderi bulunamadı</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
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
          <Text style={styles.headerTitle}>Gönderi</Text>
          {isOwnPost && (
            <TouchableOpacity 
              style={styles.optionsButton}
              onPress={() => setShowOptions(true)}
            >
              <MoreHorizontal color="#FFFFFF" size={24} strokeWidth={2} />
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Post Header */}
        <View style={styles.postHeader}>
          <TouchableOpacity 
            style={styles.userInfo}
            onPress={() => router.push(`/profile/${pet.id}`)}
          >
            <Image source={{ uri: pet.photoUrl }} style={styles.userAvatar} />
            <View style={styles.userDetails}>
              <Text style={styles.userName}>{pet.name}</Text>
              <Text style={styles.userBreed}>{pet.breed} • {pet.species}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Post Media */}
        <View style={styles.mediaContainer}>
          <Image
            source={{ uri: post.mediaUrl }}
            style={styles.postMedia}
          />
        </View>

        {/* Post Actions */}
        <View style={styles.postActions}>
          <SocialStats
            likes={likes}
            comments={comments.length}
            onLikePress={handleLike}
            onCommentPress={() => {}}
            onSharePress={handleShare}
            isLiked={isLiked}
            size="large"
          />
        </View>

        {/* Post Caption */}
        <View style={styles.captionContainer}>
          <Text style={styles.caption}>
            <Text style={styles.captionUser}>{pet.name}</Text> {post.caption}
          </Text>
        </View>

        {/* Comments Section */}
        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>Yorumlar ({comments.length})</Text>
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              onReply={(commentId, userName) => {
                setNewComment(`@${userName} `);
              }}
              onDelete={(commentId) => {
                // Yorum silme işlemi
                console.log('Delete comment:', commentId);
              }}
            />
          ))}
        </View>
      </ScrollView>

      {/* Comment Input */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.commentInputContainer}
      >
        <View style={styles.commentInput}>
          <TextInput
            style={styles.textInput}
            value={newComment}
            onChangeText={setNewComment}
            placeholder="Yorum ekle..."
            placeholderTextColor="#9CA3AF"
            multiline
          />
          <TouchableOpacity 
            style={[styles.sendButton, newComment.trim() && styles.sendButtonActive]}
            onPress={handleAddComment}
            disabled={!newComment.trim() || commentLoading}
          >
            <Send 
              color={newComment.trim() ? "#FFFFFF" : "#9CA3AF"} 
              size={18} 
              strokeWidth={2} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Options Modal */}
      <Modal visible={showOptions} transparent animationType="fade">
        <TouchableOpacity 
          style={styles.modalOverlay}
          onPress={() => setShowOptions(false)}
        >
          <View style={styles.optionsMenu}>
            <TouchableOpacity 
              style={styles.optionItem}
              onPress={() => {
                setShowOptions(false);
                setShowEditModal(true);
              }}
            >
              <Edit3 color="#667eea" size={20} strokeWidth={2} />
              <Text style={styles.optionText}>Düzenle</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.optionItem, styles.deleteOption]}
              onPress={() => {
                setShowOptions(false);
                handleDeletePost();
              }}
            >
              <Trash2 color="#EF4444" size={20} strokeWidth={2} />
              <Text style={[styles.optionText, styles.deleteText]}>Sil</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Edit Modal */}
      <Modal visible={showEditModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.editModalContainer}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            style={styles.editModalHeader}
          >
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <X color="#FFFFFF" size={24} strokeWidth={2} />
            </TouchableOpacity>
            <Text style={styles.editModalTitle}>Gönderiyi Düzenle</Text>
            <TouchableOpacity onPress={handleEditPost}>
              <Text style={styles.saveText}>Kaydet</Text>
            </TouchableOpacity>
          </LinearGradient>

          <View style={styles.editContent}>
            <Image source={{ uri: post.mediaUrl }} style={styles.editPreview} />
            <TextInput
              style={styles.editInput}
              value={editCaption}
              onChangeText={setEditCaption}
              placeholder="Açıklama ekle..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
            />
          </View>
        </SafeAreaView>
      </Modal>

      {/* Share Modal */}
      {post && pet && (
        <ShareModal
          visible={shareModalVisible}
          onClose={() => setShareModalVisible(false)}
          post={post}
          pet={pet}
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
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  postHeader: {
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
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
    backgroundColor: '#000000',
  },
  postMedia: {
    width: '100%',
    height: 400,
  },
  postActions: {
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  captionContainer: {
    backgroundColor: '#FFFFFF',
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
  commentsSection: {
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },
  commentsTitle: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
    marginBottom: 16,
  },

  commentInputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingBottom: 34, // Android navigation bar için boşluk
  },
  commentInput: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    gap: 12,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    maxHeight: 100,
    backgroundColor: '#F9FAFB',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    backgroundColor: '#667eea',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionsMenu: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 8,
    minWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  deleteOption: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  optionText: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
  },
  deleteText: {
    color: '#EF4444',
  },
  editModalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  editModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  editModalTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  saveText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  editContent: {
    padding: 20,
  },
  editPreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    height: 120,
    textAlignVertical: 'top',
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
  errorText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 100,
  },
  videoContainer: {
    position: 'relative',
  },
  videoOverlay: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  videoText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Inter-SemiBold',
  },
});