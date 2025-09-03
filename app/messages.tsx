import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  MessageCircle, 
  Plus, 
  Search, 
  MoreVertical,
  ArrowLeft,
  Trash2,
  Check,
  CheckCheck
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useMessaging } from '@/contexts/MessagingContext';
import { useAuth } from '@/contexts/AuthContext';
import { Chat } from '@/types/index';

const formatTimeAgo = (dateString: string) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'Az önce';
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
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
  }
};

export default function MessagesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { 
    chats, 
    unreadCount, 
    loading, 
    markChatAsRead, 
    deleteChat
  } = useMessaging();

  const handleChatPress = async (chat: Chat) => {
    // Chat'i okundu olarak işaretle
    await markChatAsRead(chat.id);
    
    // Chat ekranına git
    router.push(`/chat/${chat.id}`);
  };

  const handleNewChat = () => {
    // Yeni chat oluşturma ekranına git
    router.push('/new-chat');
  };

  const handleDeleteChat = async (chatId: string) => {
    // Chat silme onayı
    // Alert.alert('Chat\'i Sil', 'Bu chat\'i silmek istediğinizden emin misiniz?', [
    //   { text: 'İptal', style: 'cancel' },
    //   { text: 'Sil', style: 'destructive', onPress: () => deleteChat(chatId) },
    // ]);
    
    // Şimdilik direkt sil
    await deleteChat(chatId);
  };

  const renderChatItem = ({ item }: { item: Chat }) => {
    const hasUnreadMessages = item.lastMessage && !item.lastMessage.isRead;
    const currentUserId = user?.uid || '';
    const otherParticipantId = item.participants.find(id => id !== currentUserId);
    
    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => handleChatPress(item)}
      >
        <View style={styles.chatAvatar}>
          <Image
            source={{ uri: 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=400' }}
            style={styles.avatarImage}
          />
          {hasUnreadMessages && <View style={styles.unreadDot} />}
        </View>
        
        <View style={styles.chatContent}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatName}>
              {otherParticipantId ? `Kullanıcı ${otherParticipantId.slice(-4)}` : 'Grup Chat'}
            </Text>
            <Text style={styles.chatTime}>
              {formatTimeAgo(item.lastMessageAt)}
            </Text>
          </View>
          
          <View style={styles.chatPreview}>
            {item.lastMessage ? (
              <>
                <View style={styles.messageStatus}>
                  {item.lastMessage.senderId === currentUserId ? (
                    item.lastMessage.isRead ? (
                      <CheckCheck color="#10B981" size={16} strokeWidth={2} />
                    ) : (
                      <Check color="#6B7280" size={16} strokeWidth={2} />
                    )
                  ) : null}
                </View>
                <Text 
                  style={[
                    styles.lastMessage,
                    hasUnreadMessages && styles.unreadMessage
                  ]}
                  numberOfLines={1}
                >
                  {item.lastMessage.text}
                </Text>
              </>
            ) : (
              <Text style={styles.noMessage}>Henüz mesaj yok</Text>
            )}
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.moreButton}
          onPress={() => handleDeleteChat(item.id)}
        >
          <MoreVertical color="#9CA3AF" size={20} strokeWidth={2} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconContainer}>
        <MessageCircle color="#9CA3AF" size={48} strokeWidth={1.5} />
      </View>
      <Text style={styles.emptyTitle}>Henüz mesaj yok</Text>
      <Text style={styles.emptySubtitle}>
        Yeni bir sohbet başlatmak için + butonuna tıklayın
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
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
          
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Mesajlar</Text>
            {unreadCount > 0 && (
              <View style={styles.badgeContainer}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
          
          <TouchableOpacity
            style={styles.newChatButton}
            onPress={handleNewChat}
          >
            <Plus color="#FFFFFF" size={24} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        renderItem={renderChatItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => {}} // MessagingContext otomatik olarak güncelleniyor
            colors={['#667eea']}
            tintColor="#667eea"
          />
        }
        ListEmptyComponent={renderEmptyState}
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
  headerTextContainer: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
    marginRight: 8,
  },
  badgeContainer: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontFamily: 'Inter-Bold',
    color: '#FFFFFF',
  },
  newChatButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    flexGrow: 1,
  },
  chatItem: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  chatAvatar: {
    position: 'relative',
    marginRight: 16,
  },
  avatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  unreadDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#1F2937',
  },
  chatTime: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
  },
  chatPreview: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messageStatus: {
    marginRight: 8,
  },
  lastMessage: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    flex: 1,
  },
  unreadMessage: {
    fontFamily: 'Inter-SemiBold',
    color: '#1F2937',
  },
  noMessage: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  moreButton: {
    padding: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});
