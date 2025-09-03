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
}

export interface Post {
  id: string;
  petId: string;
  type: 'photo' | 'video';
  mediaUrl: string;
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