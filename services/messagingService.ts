// Messaging service with Firebase Realtime Database
import database from '@react-native-firebase/database';
import firestore from '@react-native-firebase/firestore';
import { Chat, Message, ChatParticipant } from '@/types/index';
import { logSecurityEvent } from '../config/security';
import { validateString } from '../utils/validation';

class MessagingService {
  private db = database();
  private firestore = firestore();
  private listeners: { [key: string]: any } = {};

  // Chat Operations

  // Chat oluştur
  async createChat(participantIds: string[]): Promise<string | null> {
    try {
      if (participantIds.length < 2) {
        throw new Error('En az 2 katılımcı gerekli');
      }

      // Chat ID oluştur
      const chatId = this.db.ref('chats').push().key;
      if (!chatId) {
        throw new Error('Chat ID oluşturulamadı');
      }

      const now = new Date().toISOString();
      const chatData: Chat = {
        id: chatId,
        participants: participantIds,
        lastMessageAt: now,
        createdAt: now,
        updatedAt: now,
      };

      // Realtime Database'e chat oluştur
      await this.db.ref(`chats/${chatId}`).set(chatData);

      // Her katılımcı için chat referansı oluştur
      const userChatPromises = participantIds.map(userId => 
        this.db.ref(`userChats/${userId}/${chatId}`).set({
          chatId,
          joinedAt: now,
          lastReadAt: now,
        })
      );

      await Promise.all(userChatPromises);

      logSecurityEvent('CHAT_CREATED', {
        chatId,
        participantCount: participantIds.length
      });

      return chatId;
    } catch (error: any) {
      logSecurityEvent('CHAT_CREATE_FAILED', {
        error: error.message,
        participantCount: participantIds.length
      });
      throw error;
    }
  }

  // Chat'e katıl
  async joinChat(chatId: string, userId: string): Promise<void> {
    try {
      const chatRef = this.db.ref(`chats/${chatId}`);
      const chatSnapshot = await chatRef.once('value');
      
      if (!chatSnapshot.exists()) {
        throw new Error('Chat bulunamadı');
      }

      const chatData = chatSnapshot.val();
      
      // Kullanıcı zaten katılımcı mı kontrol et
      if (chatData.participants && chatData.participants.includes(userId)) {
        return; // Zaten katılımcı
      }

      // Kullanıcıyı katılımcılara ekle
      const updatedParticipants = [...(chatData.participants || []), userId];
      
      await chatRef.update({
        participants: updatedParticipants,
        updatedAt: new Date().toISOString(),
      });

      // Kullanıcının chat listesine ekle
      await this.db.ref(`userChats/${userId}/${chatId}`).set({
        chatId,
        joinedAt: new Date().toISOString(),
        lastReadAt: new Date().toISOString(),
      });

      logSecurityEvent('USER_JOINED_CHAT', {
        chatId,
        userId: this.maskUserId(userId)
      });
    } catch (error: any) {
      logSecurityEvent('USER_JOIN_CHAT_FAILED', {
        chatId,
        userId: this.maskUserId(userId),
        error: error.message
      });
      throw error;
    }
  }

  // Chat'ten ayrıl
  async leaveChat(chatId: string, userId: string): Promise<void> {
    try {
      const chatRef = this.db.ref(`chats/${chatId}`);
      const chatSnapshot = await chatRef.once('value');
      
      if (!chatSnapshot.exists()) {
        throw new Error('Chat bulunamadı');
      }

      const chatData = chatSnapshot.val();
      const updatedParticipants = (chatData.participants || []).filter((id: string) => id !== userId);
      
      if (updatedParticipants.length === 0) {
        // Son katılımcı ayrılıyorsa chat'i sil
        await this.deleteChat(chatId);
      } else {
        // Kullanıcıyı katılımcılardan çıkar
        await chatRef.update({
          participants: updatedParticipants,
          updatedAt: new Date().toISOString(),
        });
      }

      // Kullanıcının chat listesinden kaldır
      await this.db.ref(`userChats/${userId}/${chatId}`).remove();

      logSecurityEvent('USER_LEFT_CHAT', {
        chatId,
        userId: this.maskUserId(userId)
      });
    } catch (error: any) {
      logSecurityEvent('USER_LEAVE_CHAT_FAILED', {
        chatId,
        userId: this.maskUserId(userId),
        error: error.message
      });
      throw error;
    }
  }

  // Chat sil
  async deleteChat(chatId: string): Promise<void> {
    try {
      // Chat'i sil
      await this.db.ref(`chats/${chatId}`).remove();
      
      // Chat mesajlarını sil
      await this.db.ref(`messages/${chatId}`).remove();
      
      // Tüm kullanıcıların chat listesinden kaldır
      const userChatsSnapshot = await this.db.ref('userChats').once('value');
      const userChats = userChatsSnapshot.val();
      
      if (userChats) {
        const updatePromises = Object.keys(userChats).map(userId => 
          this.db.ref(`userChats/${userId}/${chatId}`).remove()
        );
        await Promise.all(updatePromises);
      }

      logSecurityEvent('CHAT_DELETED', { chatId });
    } catch (error: any) {
      logSecurityEvent('CHAT_DELETE_FAILED', {
        chatId,
        error: error.message
      });
      throw error;
    }
  }

  // Kullanıcının chat'lerini al
  async getUserChats(userId: string): Promise<Chat[]> {
    try {
      const userChatsSnapshot = await this.db.ref(`userChats/${userId}`).once('value');
      const userChats = userChatsSnapshot.val();
      
      if (!userChats) {
        return [];
      }

      const chatIds = Object.keys(userChats);
      const chatPromises = chatIds.map(chatId => 
        this.db.ref(`chats/${chatId}`).once('value')
      );

      const chatSnapshots = await Promise.all(chatPromises);
      const chats: Chat[] = [];

      chatSnapshots.forEach((snapshot, index) => {
        if (snapshot.exists()) {
          const chatData = snapshot.val();
          chats.push({
            id: chatIds[index],
            ...chatData,
          });
        }
      });

      // Son mesaj zamanına göre sırala
      return chats.sort((a, b) => 
        new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
      );
    } catch (error: any) {
      logSecurityEvent('GET_USER_CHATS_FAILED', {
        userId: this.maskUserId(userId),
        error: error.message
      });
      throw error;
    }
  }

  // Message Operations

  // Mesaj gönder
  async sendMessage(
    chatId: string, 
    text: string, 
    type: 'text' | 'image' | 'video' | 'location' = 'text',
    senderId: string,
    mediaUrl?: string
  ): Promise<string | null> {
    try {
      // Input validation
      const textValidation = validateString(text, {
        required: true,
        minLength: 1,
        maxLength: 1000,
        fieldName: 'Mesaj'
      });
      
      if (!textValidation.isValid) {
        throw new Error(textValidation.errors.join(', '));
      }

      // Chat'in var olduğunu kontrol et
      const chatSnapshot = await this.db.ref(`chats/${chatId}`).once('value');
      if (!chatSnapshot.exists()) {
        throw new Error('Chat bulunamadı');
      }

      const chatData = chatSnapshot.val();
      if (!chatData.participants.includes(senderId)) {
        throw new Error('Bu chat\'e mesaj gönderme yetkiniz yok');
      }

      // Mesaj ID oluştur
      const messageId = this.db.ref(`messages/${chatId}`).push().key;
      if (!messageId) {
        throw new Error('Mesaj ID oluşturulamadı');
      }

      const now = new Date().toISOString();
      const messageData: Message = {
        id: messageId,
        chatId,
        senderId,
        receiverId: '', // Group chat için boş
        text: this.sanitizeMessage(text),
        type,
        mediaUrl,
        isRead: false,
        createdAt: now,
      };

      // Mesajı Realtime Database'e kaydet
      await this.db.ref(`messages/${chatId}/${messageId}`).set(messageData);

      // Chat'in son mesaj bilgilerini güncelle
      await this.db.ref(`chats/${chatId}`).update({
        lastMessage: {
          id: messageId,
          text: messageData.text,
          senderId: senderId,
          type: type,
          createdAt: now,
        },
        lastMessageAt: now,
        updatedAt: now,
      });

      // Katılımcıların okunmamış mesaj sayısını güncelle
      await this.updateUnreadCounts(chatId, senderId);

      logSecurityEvent('MESSAGE_SENT', {
        chatId,
        messageId,
        senderId: this.maskUserId(senderId),
        type
      });

      return messageId;
    } catch (error: any) {
      logSecurityEvent('MESSAGE_SEND_FAILED', {
        chatId,
        senderId: this.maskUserId(senderId),
        error: error.message
      });
      throw error;
    }
  }

  // Resim mesajı gönder
  async sendImageMessage(chatId: string, imageUri: string, senderId: string): Promise<string | null> {
    try {
      // Resmi Firebase Storage'a yükle
      const imageUrl = await this.uploadImage(imageUri);
      
      return await this.sendMessage(chatId, 'Fotoğraf gönderildi', 'image', senderId, imageUrl);
    } catch (error: any) {
      logSecurityEvent('IMAGE_MESSAGE_SEND_FAILED', {
        chatId,
        senderId: this.maskUserId(senderId),
        error: error.message
      });
      throw error;
    }
  }

  // Video mesajı gönder
  async sendVideoMessage(chatId: string, videoUri: string, senderId: string): Promise<string | null> {
    try {
      // Videoyu Firebase Storage'a yükle
      const videoUrl = await this.uploadVideo(videoUri);
      
      return await this.sendMessage(chatId, 'Video gönderildi', 'video', senderId, videoUrl);
    } catch (error: any) {
      logSecurityEvent('VIDEO_MESSAGE_SEND_FAILED', {
        chatId,
        senderId: this.maskUserId(senderId),
        error: error.message
      });
      throw error;
    }
  }

  // Konum mesajı gönder
  async sendLocationMessage(
    chatId: string, 
    latitude: number, 
    longitude: number, 
    senderId: string
  ): Promise<string | null> {
    try {
      const locationData = `${latitude},${longitude}`;
      return await this.sendMessage(chatId, 'Konum paylaşıldı', 'location', senderId, locationData);
    } catch (error: any) {
      logSecurityEvent('LOCATION_MESSAGE_SEND_FAILED', {
        chatId,
        senderId: this.maskUserId(senderId),
        error: error.message
      });
      throw error;
    }
  }

  // Chat mesajlarını al
  async getChatMessages(chatId: string, limit: number = 50): Promise<Message[]> {
    try {
      const messagesSnapshot = await this.db
        .ref(`messages/${chatId}`)
        .orderByChild('createdAt')
        .limitToLast(limit)
        .once('value');

      if (!messagesSnapshot.exists()) {
        return [];
      }

      const messages: Message[] = [];
      messagesSnapshot.forEach((childSnapshot) => {
        const messageData = childSnapshot.val();
        messages.push({
          id: childSnapshot.key!,
          ...messageData,
        });
      });

      return messages.sort((a, b) => 
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    } catch (error: any) {
      logSecurityEvent('GET_CHAT_MESSAGES_FAILED', {
        chatId,
        error: error.message
      });
      throw error;
    }
  }

  // Mesajı okundu olarak işaretle
  async markMessageAsRead(messageId: string, userId: string): Promise<void> {
    try {
      // Mesajın hangi chat'te olduğunu bul
      const messagesSnapshot = await this.db.ref('messages').once('value');
      let messageChatId = '';
      let messageData: any = null;

      messagesSnapshot.forEach((chatSnapshot) => {
        chatSnapshot.forEach((messageSnapshot) => {
          if (messageSnapshot.key === messageId) {
            messageChatId = chatSnapshot.key!;
            messageData = messageSnapshot.val();
          }
        });
      });

      if (!messageChatId || !messageData) {
        throw new Error('Mesaj bulunamadı');
      }

      // Mesajı okundu olarak işaretle
      await this.db.ref(`messages/${messageChatId}/${messageId}`).update({
        isRead: true,
        readAt: new Date().toISOString(),
        readBy: {
          ...messageData.readBy,
          [userId]: new Date().toISOString(),
        },
      });

      logSecurityEvent('MESSAGE_MARKED_AS_READ', {
        messageId,
        chatId: messageChatId,
        userId: this.maskUserId(userId)
      });
    } catch (error: any) {
      logSecurityEvent('MESSAGE_MARK_AS_READ_FAILED', {
        messageId,
        userId: this.maskUserId(userId),
        error: error.message
      });
      throw error;
    }
  }

  // Chat'i okundu olarak işaretle
  async markChatAsRead(chatId: string, userId: string): Promise<void> {
    try {
      // Kullanıcının chat'teki son okuma zamanını güncelle
      await this.db.ref(`userChats/${userId}/${chatId}`).update({
        lastReadAt: new Date().toISOString(),
      });

      // Chat'teki tüm mesajları okundu olarak işaretle
      const messagesSnapshot = await this.db.ref(`messages/${chatId}`).once('value');
      const updatePromises: Promise<void>[] = [];

      messagesSnapshot.forEach((messageSnapshot) => {
        const messageData = messageSnapshot.val();
        if (messageData.senderId !== userId && !messageData.isRead) {
          updatePromises.push(
            this.db.ref(`messages/${chatId}/${messageSnapshot.key}`).update({
              isRead: true,
              readAt: new Date().toISOString(),
              readBy: {
                ...messageData.readBy,
                [userId]: new Date().toISOString(),
              },
            })
          );
        }
      });

      await Promise.all(updatePromises);

      logSecurityEvent('CHAT_MARKED_AS_READ', {
        chatId,
        userId: this.maskUserId(userId)
      });
    } catch (error: any) {
      logSecurityEvent('CHAT_MARK_AS_READ_FAILED', {
        chatId,
        userId: this.maskUserId(userId),
        error: error.message
      });
      throw error;
    }
  }

  // Mesaj sil
  async deleteMessage(messageId: string, userId: string): Promise<void> {
    try {
      // Mesajın hangi chat'te olduğunu bul
      const messagesSnapshot = await this.db.ref('messages').once('value');
      let messageChatId = '';
      let messageData: any = null;

      messagesSnapshot.forEach((chatSnapshot) => {
        chatSnapshot.forEach((messageSnapshot) => {
          if (messageSnapshot.key === messageId) {
            messageChatId = chatSnapshot.key!;
            messageData = messageSnapshot.val();
          }
        });
      });

      if (!messageChatId || !messageData) {
        throw new Error('Mesaj bulunamadı');
      }

      // Sadece mesaj gönderen silebilir
      if (messageData.senderId !== userId) {
        throw new Error('Bu mesajı silme yetkiniz yok');
      }

      // Mesajı sil
      await this.db.ref(`messages/${messageChatId}/${messageId}`).remove();

      logSecurityEvent('MESSAGE_DELETED', {
        messageId,
        chatId: messageChatId,
        userId: this.maskUserId(userId)
      });
    } catch (error: any) {
      logSecurityEvent('MESSAGE_DELETE_FAILED', {
        messageId,
        userId: this.maskUserId(userId),
        error: error.message
      });
      throw error;
    }
  }

  // Real-time Listeners

  // Chat değişikliklerini dinle
  onChatsChange(userId: string, callback: (chats: Chat[]) => void): () => void {
    const listener = this.db.ref(`userChats/${userId}`).on('value', async (snapshot) => {
      if (!snapshot.exists()) {
        callback([]);
        return;
      }

      const userChats = snapshot.val();
      const chatIds = Object.keys(userChats);
      const chatPromises = chatIds.map(chatId => 
        this.db.ref(`chats/${chatId}`).once('value')
      );

      const chatSnapshots = await Promise.all(chatPromises);
      const chats: Chat[] = [];

      chatSnapshots.forEach((chatSnapshot, index) => {
        if (chatSnapshot.exists()) {
          const chatData = chatSnapshot.val();
          chats.push({
            id: chatIds[index],
            ...chatData,
          });
        }
      });

      // Son mesaj zamanına göre sırala
      const sortedChats = chats.sort((a, b) => 
        new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
      );

      callback(sortedChats);
    });

    this.listeners[`chats_${userId}`] = listener;
    return () => this.db.ref(`userChats/${userId}`).off('value', listener);
  }

  // Mesaj değişikliklerini dinle
  onMessagesChange(chatId: string, callback: (messages: Message[]) => void): () => void {
    const listener = this.db.ref(`messages/${chatId}`)
      .orderByChild('createdAt')
      .on('value', (snapshot) => {
        if (!snapshot.exists()) {
          callback([]);
          return;
        }

        const messages: Message[] = [];
        snapshot.forEach((childSnapshot) => {
          const messageData = childSnapshot.val();
          messages.push({
            id: childSnapshot.key!,
            ...messageData,
          });
        });

        // Zaman sırasına göre sırala
        const sortedMessages = messages.sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );

        callback(sortedMessages);
      });

    this.listeners[`messages_${chatId}`] = listener;
    return () => this.db.ref(`messages/${chatId}`).off('value', listener);
  }

  // Yeni mesaj dinleyicisi
  onNewMessage(chatId: string, callback: (message: Message) => void): () => void {
    const listener = this.db.ref(`messages/${chatId}`)
      .orderByChild('createdAt')
      .limitToLast(1)
      .on('child_added', (snapshot) => {
        const messageData = snapshot.val();
        const message: Message = {
          id: snapshot.key!,
          ...messageData,
        };
        callback(message);
      });

    this.listeners[`newMessage_${chatId}`] = listener;
    return () => this.db.ref(`messages/${chatId}`).off('child_added', listener);
  }

  // Push token kaydet
  async registerPushToken(token: string, userId: string): Promise<void> {
    try {
      await this.db.ref(`userPushTokens/${userId}`).set({
        token,
        platform: 'mobile',
        registeredAt: new Date().toISOString(),
      });

      logSecurityEvent('PUSH_TOKEN_REGISTERED', {
        userId: this.maskUserId(userId)
      });
    } catch (error: any) {
      logSecurityEvent('PUSH_TOKEN_REGISTER_FAILED', {
        userId: this.maskUserId(userId),
        error: error.message
      });
      throw error;
    }
  }

  // Tüm dinleyicileri kaldır
  removeAllListeners(): void {
    Object.values(this.listeners).forEach(listener => {
      if (typeof listener === 'function') {
        listener();
      }
    });
    this.listeners = {};
  }

  // Helper Methods

  // Okunmamış mesaj sayılarını güncelle
  private async updateUnreadCounts(chatId: string, senderId: string): Promise<void> {
    try {
      const chatSnapshot = await this.db.ref(`chats/${chatId}`).once('value');
      const chatData = chatSnapshot.val();
      
      if (!chatData || !chatData.participants) {
        return;
      }

      const updatePromises = chatData.participants
        .filter((userId: string) => userId !== senderId)
        .map((userId: string) => 
          this.db.ref(`userChats/${userId}/${chatId}`).update({
            unreadCount: this.db.ServerValue.increment(1),
            lastMessageAt: new Date().toISOString(),
          })
        );

      await Promise.all(updatePromises);
    } catch (error: any) {
      console.warn('Unread count update failed:', error);
    }
  }

  // Resim yükle
  private async uploadImage(imageUri: string): Promise<string> {
    // Bu kısım Firebase Storage implementasyonu gerektirir
    // Şimdilik placeholder
    return `https://example.com/images/${Date.now()}.jpg`;
  }

  // Video yükle
  private async uploadVideo(videoUri: string): Promise<string> {
    // Bu kısım Firebase Storage implementasyonu gerektirir
    // Şimdilik placeholder
    return `https://example.com/videos/${Date.now()}.mp4`;
  }

  // Mesaj sanitization
  private sanitizeMessage(text: string): string {
    // XSS koruması için basit sanitization
    return text
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  // Kullanıcı ID'sini maskele
  private maskUserId(userId: string): string {
    if (userId.length <= 4) {
      return '*'.repeat(userId.length);
    }
    return userId.slice(0, 2) + '*'.repeat(userId.length - 4) + userId.slice(-2);
  }
}

export default new MessagingService();