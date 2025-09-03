export interface PetProfile {
  id: string;
  name: string;
  species: string;
  breed: string;
  age: string;
  gender: 'Erkek' | 'Dişi';
  bio: string;
  photoUrl: string;
  ownerId: string;
  createdAt: string;
}

export interface FollowRelation {
  id: string;
  followerId: string;
  followedId: string;
  createdAt: string;
}

export interface VeterinaryClinic {
  id: string;
  name: string;
  address: string;
  phone: string;
  hours: string;
  rating: number;
  distance: string;
  latitude: number;
  longitude: number;
  isOpen: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  displayName?: string;
  photoURL?: string;
  bio?: string;
  phone?: string;
  location?: string;
  isEmailVerified?: boolean;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  privacy: {
    profileVisibility: 'public' | 'friends' | 'private';
    showEmail: boolean;
    showPhone: boolean;
    showLocation: boolean;
  };
  language: string;
  theme: 'light' | 'dark' | 'auto';
}

export interface Post {
  id: string;
  petId: string;
  type: 'photo' | 'video';
  mediaUrl: string;
  videoUrl?: string;
  caption: string;
  likes: number;
  comments: number;
  createdAt: string;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  createdAt: string;
}

export interface Chat {
  id: string;
  participants: string[];
  lastMessage?: Message;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  receiverId: string;
  text: string;
  type: 'text' | 'image' | 'video' | 'location';
  mediaUrl?: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

export interface ChatParticipant {
  id: string;
  name: string;
  avatar: string;
  isOnline: boolean;
  lastSeen?: string;
}