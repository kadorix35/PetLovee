import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import { MoreHorizontal, Heart, Reply } from 'lucide-react-native';
import { Comment } from '@/types/index';

interface CommentItemProps {
  comment: Comment;
  currentUserId?: string;
  onReply?: (commentId: string, userName: string) => void;
  onLike?: (commentId: string) => void;
  onDelete?: (commentId: string) => void;
  onEdit?: (commentId: string, newText: string) => void;
  showActions?: boolean;
  isLiked?: boolean;
  likes?: number;
}

export default function CommentItem({
  comment,
  currentUserId,
  onReply,
  onLike,
  onDelete,
  onEdit,
  showActions = true,
  isLiked = false,
  likes = 0
}: CommentItemProps) {
  const [showOptions, setShowOptions] = useState(false);
  const isOwnComment = comment.userId === currentUserId;

  const handleOptions = () => {
    if (isOwnComment) {
      Alert.alert(
        'Yorum Seçenekleri',
        'Ne yapmak istiyorsunuz?',
        [
          { text: 'İptal', style: 'cancel' },
          { text: 'Düzenle', onPress: () => handleEdit() },
          { text: 'Sil', style: 'destructive', onPress: () => handleDelete() }
        ]
      );
    } else {
      Alert.alert(
        'Yorum Seçenekleri',
        'Ne yapmak istiyorsunuz?',
        [
          { text: 'İptal', style: 'cancel' },
          { text: 'Yanıtla', onPress: () => onReply?.(comment.id, comment.userName) },
          { text: 'Bildir', style: 'destructive', onPress: () => handleReport() }
        ]
      );
    }
    setShowOptions(false);
  };

  const handleEdit = () => {
    // Edit modal açılabilir
    Alert.alert('Düzenle', 'Yorum düzenleme özelliği yakında eklenecek');
  };

  const handleDelete = () => {
    Alert.alert(
      'Yorumu Sil',
      'Bu yorumu silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Sil', 
          style: 'destructive',
          onPress: () => onDelete?.(comment.id)
        }
      ]
    );
  };

  const handleReport = () => {
    Alert.alert('Bildir', 'Bu yorum uygunsuz içerik bildirildi');
  };

  const formatTime = (timestamp: string) => {
    const now = new Date();
    const commentTime = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - commentTime.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return 'şimdi';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}dk`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}sa`;
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}g`;
    } else {
      return commentTime.toLocaleDateString('tr-TR', { 
        day: 'numeric', 
        month: 'short' 
      });
    }
  };

  return (
    <View style={styles.container}>
      <Image source={{ uri: comment.userAvatar }} style={styles.avatar} />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.userName}>{comment.userName}</Text>
          <Text style={styles.timestamp}>{formatTime(comment.createdAt)}</Text>
        </View>
        
        <Text style={styles.commentText}>{comment.text}</Text>
        
        {showActions && (
          <View style={styles.actions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => onLike?.(comment.id)}
            >
              <Heart 
                color={isLiked ? "#FF6B6B" : "#9CA3AF"} 
                size={14} 
                strokeWidth={2}
                fill={isLiked ? "#FF6B6B" : "none"}
              />
              {likes > 0 && (
                <Text style={[styles.actionText, isLiked && styles.likedText]}>
                  {likes}
                </Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => onReply?.(comment.id, comment.userName)}
            >
              <Reply color="#9CA3AF" size={14} strokeWidth={2} />
              <Text style={styles.actionText}>Yanıtla</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      <TouchableOpacity 
        style={styles.optionsButton}
        onPress={handleOptions}
      >
        <MoreHorizontal color="#9CA3AF" size={16} strokeWidth={2} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 14,
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
    marginRight: 8,
  },
  timestamp: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  commentText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#374151',
    lineHeight: 18,
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  likedText: {
    color: '#FF6B6B',
  },
  optionsButton: {
    padding: 4,
  },
});
