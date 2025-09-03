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
import { petProfiles, posts } from '@/data/mockData';
import { Post, PetProfile, Comment } from '@/types/index';

const { width } = Dimensions.get('window');

export default function PostDetailScreen() {
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [pet, setPet] = useState<PetProfile | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editCaption, setEditCaption] = useState('');
  const videoRef = useRef<Video>(null);
  const currentUserId = 'user1';

  useEffect(() => {
    if (postId) {
      const foundPost = posts.find(p => p.id === postId);
      if (foundPost) {
        setPost(foundPost);
        setLikes(foundPost.likes);
        setEditCaption(foundPost.caption);
        
        const foundPet = petProfiles.find(p => p.id === foundPost.petId);
        setPet(foundPet || null);

        // Mock comments
        setComments([
          {
            id: '1',
            userId: 'user2',
            userName: 'Ayşe',
            userAvatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100',
            text: 'Çok tatlı! 😍',
            createdAt: '2024-02-15T11:00:00Z',
          },
          {
            id: '2',
            userId: 'user3',
            userName: 'Mehmet',
            userAvatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100',
            text: 'Harika bir fotoğraf! Bizim köpeğimiz de böyle seviyor parkı.',
            createdAt: '2024-02-15T12:30:00Z',
          },
        ]);
      }
    }
  }, [postId]);

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikes(prev => isLiked ? prev - 1 : prev + 1);
  };

  const handleShare = () => {
    Alert.alert('Paylaş', 'Bu gönderiyi paylaşmak istiyor musunuz?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Paylaş', onPress: () => Alert.alert('Başarılı', 'Gönderi paylaşıldı!') }
    ]);
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      const comment: Comment = {
        id: Date.now().toString(),
        userId: currentUserId,
        userName: 'Sen',
        userAvatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=100',
        text: newComment.trim(),
        createdAt: new Date().toISOString(),
      };
      setComments([...comments, comment]);
      setNewComment('');
    }
  };

  const handleEditPost = () => {
    if (post) {
      setPost({ ...post, caption: editCaption });
      setShowEditModal(false);
      Alert.alert('Başarılı', 'Gönderi güncellendi!');
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
          onPress: () => {
            Alert.alert('Başarılı', 'Gönderi silindi!');
            router.back();
          }
        }
      ]
    );
  };

  const isOwnPost = post?.petId === 'pet1'; // Current user's pet

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
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleLike}
            >
              <Heart 
                color={isLiked ? "#FF6B6B" : "#374151"} 
                size={24} 
                strokeWidth={2}
                fill={isLiked ? "#FF6B6B" : "none"}
              />
              <Text style={[styles.actionText, isLiked && styles.likedText]}>
                {likes}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <MessageCircle color="#667eea" size={24} strokeWidth={2} />
              <Text style={styles.actionText}>{comments.length}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleShare}
            >
              <Share color="#764ba2" size={24} strokeWidth={2} />
            </TouchableOpacity>
          </View>
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
            <View key={comment.id} style={styles.commentItem}>
              <Image source={{ uri: comment.userAvatar }} style={styles.commentAvatar} />
              <View style={styles.commentContent}>
                <Text style={styles.commentText}>
                  <Text style={styles.commentUser}>{comment.userName}</Text> {comment.text}
                </Text>
                <Text style={styles.commentTime}>
                  {new Date(comment.createdAt).toLocaleDateString('tr-TR')}
                </Text>
              </View>
            </View>
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
            disabled={!newComment.trim()}
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
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionText: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#374151',
  },
  likedText: {
    color: '#FF6B6B',
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
  commentItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  commentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    lineHeight: 18,
    marginBottom: 4,
  },
  commentUser: {
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
  },
  commentTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
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