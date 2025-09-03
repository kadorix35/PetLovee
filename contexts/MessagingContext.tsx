import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Chat, Message, ChatParticipant } from '@/types/index';
import messagingService from '@/services/messagingService';
import { useAuth } from './AuthContext';

interface MessagingContextType {
  chats: Chat[];
  unreadCount: number;
  currentChat: Chat | null;
  messages: Message[];
  participants: ChatParticipant[];
  loading: boolean;
  error: string | null;
  
  // Chat operations
  createChat: (participantIds: string[]) => Promise<string | null>;
  joinChat: (chatId: string) => Promise<void>;
  leaveChat: (chatId: string) => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
  
  // Message operations
  sendMessage: (chatId: string, text: string, type?: 'text' | 'image' | 'video' | 'location') => Promise<void>;
  sendImageMessage: (chatId: string, imageUri: string) => Promise<void>;
  sendVideoMessage: (chatId: string, videoUri: string) => Promise<void>;
  sendLocationMessage: (chatId: string, latitude: number, longitude: number) => Promise<void>;
  
  // Message management
  markAsRead: (messageId: string) => Promise<void>;
  markChatAsRead: (chatId: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;
  
  // Search and filter
  searchMessages: (query: string) => Message[];
  searchChats: (query: string) => Chat[];
  
  // Real-time updates
  startListening: () => void;
  stopListening: () => void;
  
  // Error handling
  clearError: () => void;
}

const MessagingContext = createContext<MessagingContextType | undefined>(undefined);

interface MessagingProviderProps {
  children: ReactNode;
}

export function MessagingProvider({ children }: MessagingProviderProps) {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentChat, setCurrentChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<ChatParticipant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize messaging service when user is available
    if (user?.uid) {
      initializeMessaging();
    }
    
    return () => {
      // Cleanup
      stopListening();
    };
  }, [user?.uid]);

  const initializeMessaging = async () => {
    if (!user?.uid) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Load user's chats
      const userChats = await messagingService.getUserChats(user.uid);
      setChats(userChats);
      
      // Calculate unread count
      const totalUnread = userChats.reduce((count, chat) => {
        return count + (chat.lastMessage && !chat.lastMessage.isRead ? 1 : 0);
      }, 0);
      setUnreadCount(totalUnread);
      
      // Start real-time listening
      startListening();
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createChat = async (participantIds: string[]): Promise<string | null> => {
    try {
      setError(null);
      const chatId = await messagingService.createChat(participantIds);
      
      if (chatId) {
        // Refresh chats list
        const updatedChats = await messagingService.getUserChats();
        setChats(updatedChats);
      }
      
      return chatId;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  };

  const joinChat = async (chatId: string): Promise<void> => {
    if (!user?.uid) return;
    
    try {
      setError(null);
      await messagingService.joinChat(chatId, user.uid);
      
      // Update chat in local state
      setChats(prevChats => 
        prevChats.map(chat => 
          chat.id === chatId 
            ? { ...chat, participants: [...chat.participants, user.uid] }
            : chat
        )
      );
    } catch (err: any) {
      setError(err.message);
    }
  };

  const leaveChat = async (chatId: string): Promise<void> => {
    if (!user?.uid) return;
    
    try {
      setError(null);
      await messagingService.leaveChat(chatId, user.uid);
      
      // Remove chat from local state
      setChats(prevChats => prevChats.filter(chat => chat.id !== chatId));
      
      // Clear current chat if it's the one we left
      if (currentChat?.id === chatId) {
        setCurrentChat(null);
        setMessages([]);
        setParticipants([]);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const deleteChat = async (chatId: string): Promise<void> => {
    try {
      setError(null);
      await messagingService.deleteChat(chatId);
      
      // Remove chat from local state
      setChats(prevChats => prevChats.filter(chat => chat.id !== chatId));
      
      // Clear current chat if it's the one we deleted
      if (currentChat?.id === chatId) {
        setCurrentChat(null);
        setMessages([]);
        setParticipants([]);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const sendMessage = async (
    chatId: string, 
    text: string, 
    type: 'text' | 'image' | 'video' | 'location' = 'text'
  ): Promise<void> => {
    if (!user?.uid) return;
    
    try {
      setError(null);
      const messageId = await messagingService.sendMessage(chatId, text, type, user.uid);
      
      if (messageId) {
        // Add message to local state
        const newMessage: Message = {
          id: messageId,
          chatId,
          senderId: user.uid,
          receiverId: '', // This should be determined based on chat participants
          text,
          type,
          isRead: false,
          createdAt: new Date().toISOString(),
        };
        
        setMessages(prevMessages => [...prevMessages, newMessage]);
        
        // Update chat's last message
        setChats(prevChats =>
          prevChats.map(chat =>
            chat.id === chatId
              ? { ...chat, lastMessage: newMessage, lastMessageAt: newMessage.createdAt }
              : chat
          )
        );
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const sendImageMessage = async (chatId: string, imageUri: string): Promise<void> => {
    if (!user?.uid) return;
    
    try {
      setError(null);
      const messageId = await messagingService.sendImageMessage(chatId, imageUri, user.uid);
      
      if (messageId) {
        const newMessage: Message = {
          id: messageId,
          chatId,
          senderId: user.uid,
          receiverId: '',
          text: 'Fotoğraf gönderildi',
          type: 'image',
          mediaUrl: imageUri,
          isRead: false,
          createdAt: new Date().toISOString(),
        };
        
        setMessages(prevMessages => [...prevMessages, newMessage]);
        
        setChats(prevChats =>
          prevChats.map(chat =>
            chat.id === chatId
              ? { ...chat, lastMessage: newMessage, lastMessageAt: newMessage.createdAt }
              : chat
          )
        );
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const sendVideoMessage = async (chatId: string, videoUri: string): Promise<void> => {
    if (!user?.uid) return;
    
    try {
      setError(null);
      const messageId = await messagingService.sendVideoMessage(chatId, videoUri, user.uid);
      
      if (messageId) {
        const newMessage: Message = {
          id: messageId,
          chatId,
          senderId: user.uid,
          receiverId: '',
          text: 'Video gönderildi',
          type: 'video',
          mediaUrl: videoUri,
          isRead: false,
          createdAt: new Date().toISOString(),
        };
        
        setMessages(prevMessages => [...prevMessages, newMessage]);
        
        setChats(prevChats =>
          prevChats.map(chat =>
            chat.id === chatId
              ? { ...chat, lastMessage: newMessage, lastMessageAt: newMessage.createdAt }
              : chat
          )
        );
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const sendLocationMessage = async (
    chatId: string, 
    latitude: number, 
    longitude: number
  ): Promise<void> => {
    if (!user?.uid) return;
    
    try {
      setError(null);
      const messageId = await messagingService.sendLocationMessage(chatId, latitude, longitude, user.uid);
      
      if (messageId) {
        const newMessage: Message = {
          id: messageId,
          chatId,
          senderId: user.uid,
          receiverId: '',
          text: 'Konum paylaşıldı',
          type: 'location',
          mediaUrl: `${latitude},${longitude}`,
          isRead: false,
          createdAt: new Date().toISOString(),
        };
        
        setMessages(prevMessages => [...prevMessages, newMessage]);
        
        setChats(prevChats =>
          prevChats.map(chat =>
            chat.id === chatId
              ? { ...chat, lastMessage: newMessage, lastMessageAt: newMessage.createdAt }
              : chat
          )
        );
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const markAsRead = async (messageId: string): Promise<void> => {
    if (!user?.uid) return;
    
    try {
      setError(null);
      await messagingService.markMessageAsRead(messageId, user.uid);
      
      // Update message in local state
      setMessages(prevMessages =>
        prevMessages.map(message =>
          message.id === messageId
            ? { ...message, isRead: true, readAt: new Date().toISOString() }
            : message
        )
      );
    } catch (err: any) {
      setError(err.message);
    }
  };

  const markChatAsRead = async (chatId: string): Promise<void> => {
    if (!user?.uid) return;
    
    try {
      setError(null);
      await messagingService.markChatAsRead(chatId, user.uid);
      
      // Update chat in local state
      setChats(prevChats =>
        prevChats.map(chat =>
          chat.id === chatId
            ? { 
                ...chat, 
                lastMessage: chat.lastMessage 
                  ? { ...chat.lastMessage, isRead: true, readAt: new Date().toISOString() }
                  : undefined
              }
            : chat
        )
      );
      
      // Update unread count
      const updatedUnreadCount = chats.reduce((count, chat) => {
        return count + (chat.lastMessage && !chat.lastMessage.isRead ? 1 : 0);
      }, 0);
      setUnreadCount(updatedUnreadCount);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const deleteMessage = async (messageId: string): Promise<void> => {
    if (!user?.uid) return;
    
    try {
      setError(null);
      await messagingService.deleteMessage(messageId, user.uid);
      
      // Remove message from local state
      setMessages(prevMessages => prevMessages.filter(message => message.id !== messageId));
    } catch (err: any) {
      setError(err.message);
    }
  };

  const searchMessages = (query: string): Message[] => {
    if (!query.trim()) return [];
    
    return messages.filter(message =>
      message.text.toLowerCase().includes(query.toLowerCase())
    );
  };

  const searchChats = (query: string): Chat[] => {
    if (!query.trim()) return chats;
    
    return chats.filter(chat =>
      chat.participants.some(participantId => {
        // This should search by participant names
        // For now, we'll just return all chats
        return true;
      })
    );
  };

  const startListening = () => {
    if (!user?.uid) return;
    
    // Start real-time listeners for messages and chats
    messagingService.onChatsChange(user.uid, (updatedChats) => {
      setChats(updatedChats);
      
      // Update unread count
      const totalUnread = updatedChats.reduce((count, chat) => {
        return count + (chat.lastMessage && !chat.lastMessage.isRead ? 1 : 0);
      }, 0);
      setUnreadCount(totalUnread);
    });

    if (currentChat?.id) {
      messagingService.onMessagesChange(currentChat.id, (updatedMessages) => {
        setMessages(updatedMessages);
      });
    }
  };

  const stopListening = () => {
    messagingService.removeAllListeners();
  };

  const clearError = () => {
    setError(null);
  };

  const value: MessagingContextType = {
    chats,
    unreadCount,
    currentChat,
    messages,
    participants,
    loading,
    error,
    createChat,
    joinChat,
    leaveChat,
    deleteChat,
    sendMessage,
    sendImageMessage,
    sendVideoMessage,
    sendLocationMessage,
    markAsRead,
    markChatAsRead,
    deleteMessage,
    searchMessages,
    searchChats,
    startListening,
    stopListening,
    clearError,
  };

  return (
    <MessagingContext.Provider value={value}>
      {children}
    </MessagingContext.Provider>
  );
}

export function useMessaging() {
  const context = useContext(MessagingContext);
  if (context === undefined) {
    throw new Error('useMessaging must be used within a MessagingProvider');
  }
  return context;
}