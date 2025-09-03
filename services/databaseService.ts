import firestore from '@react-native-firebase/firestore';
import { PetProfile, Post, FollowRelation, Comment, User } from '@/types/index';

class DatabaseService {
  private db = firestore();

  // Pet Profilleri
  async createPetProfile(petData: Omit<PetProfile, 'id' | 'createdAt'>): Promise<string> {
    try {
      const docRef = await this.db.collection('pets').add({
        ...petData,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Pet profili oluşturma hatası:', error);
      throw error;
    }
  }

  async getPetProfile(petId: string): Promise<PetProfile | null> {
    try {
      const doc = await this.db.collection('pets').doc(petId).get();
      if (doc.exists) {
        return { id: doc.id, ...doc.data() } as PetProfile;
      }
      return null;
    } catch (error) {
      console.error('Pet profili getirme hatası:', error);
      throw error;
    }
  }

  async updatePetProfile(petId: string, updates: Partial<PetProfile>): Promise<void> {
    try {
      await this.db.collection('pets').doc(petId).update(updates);
    } catch (error) {
      console.error('Pet profili güncelleme hatası:', error);
      throw error;
    }
  }

  async getUserPets(ownerId: string): Promise<PetProfile[]> {
    try {
      const snapshot = await this.db
        .collection('pets')
        .where('ownerId', '==', ownerId)
        .orderBy('createdAt', 'desc')
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PetProfile[];
    } catch (error) {
      console.error('Kullanıcı petleri getirme hatası:', error);
      throw error;
    }
  }

  // Posts
  async createPost(postData: Omit<Post, 'id' | 'createdAt'>): Promise<string> {
    try {
      const docRef = await this.db.collection('posts').add({
        ...postData,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Post oluşturma hatası:', error);
      throw error;
    }
  }

  async getPost(postId: string): Promise<Post | null> {
    try {
      const doc = await this.db.collection('posts').doc(postId).get();
      if (doc.exists) {
        return { id: doc.id, ...doc.data() } as Post;
      }
      return null;
    } catch (error) {
      console.error('Post getirme hatası:', error);
      throw error;
    }
  }

  async getFeedPosts(limit: number = 20, lastDoc?: any): Promise<{ posts: Post[], lastDoc: any }> {
    try {
      let query = this.db
        .collection('posts')
        .orderBy('createdAt', 'desc')
        .limit(limit);

      if (lastDoc) {
        query = query.startAfter(lastDoc);
      }

      const snapshot = await query.get();
      const posts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];

      return {
        posts,
        lastDoc: snapshot.docs[snapshot.docs.length - 1]
      };
    } catch (error) {
      console.error('Feed posts getirme hatası:', error);
      throw error;
    }
  }

  async getPetPosts(petId: string): Promise<Post[]> {
    try {
      const snapshot = await this.db
        .collection('posts')
        .where('petId', '==', petId)
        .orderBy('createdAt', 'desc')
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
    } catch (error) {
      console.error('Pet posts getirme hatası:', error);
      throw error;
    }
  }

  async updatePost(postId: string, updates: Partial<Post>): Promise<void> {
    try {
      await this.db.collection('posts').doc(postId).update(updates);
    } catch (error) {
      console.error('Post güncelleme hatası:', error);
      throw error;
    }
  }

  async deletePost(postId: string): Promise<void> {
    try {
      await this.db.collection('posts').doc(postId).delete();
    } catch (error) {
      console.error('Post silme hatası:', error);
      throw error;
    }
  }

  // Follow Relations
  async followPet(followerId: string, followedId: string): Promise<void> {
    try {
      const followId = `${followerId}_${followedId}`;
      await this.db.collection('follows').doc(followId).set({
        followerId,
        followedId,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });
    } catch (error) {
      console.error('Pet takip etme hatası:', error);
      throw error;
    }
  }

  async unfollowPet(followerId: string, followedId: string): Promise<void> {
    try {
      const followId = `${followerId}_${followedId}`;
      await this.db.collection('follows').doc(followId).delete();
    } catch (error) {
      console.error('Pet takibi bırakma hatası:', error);
      throw error;
    }
  }

  async isFollowing(followerId: string, followedId: string): Promise<boolean> {
    try {
      const followId = `${followerId}_${followedId}`;
      const doc = await this.db.collection('follows').doc(followId).get();
      return doc.exists;
    } catch (error) {
      console.error('Takip durumu kontrol hatası:', error);
      throw error;
    }
  }

  async getFollowers(petId: string): Promise<FollowRelation[]> {
    try {
      const snapshot = await this.db
        .collection('follows')
        .where('followedId', '==', petId)
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FollowRelation[];
    } catch (error) {
      console.error('Takipçiler getirme hatası:', error);
      throw error;
    }
  }

  async getFollowing(userId: string): Promise<FollowRelation[]> {
    try {
      const snapshot = await this.db
        .collection('follows')
        .where('followerId', '==', userId)
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as FollowRelation[];
    } catch (error) {
      console.error('Takip edilenler getirme hatası:', error);
      throw error;
    }
  }

  // Comments
  async addComment(postId: string, comment: Omit<Comment, 'id' | 'createdAt'>): Promise<string> {
    try {
      const docRef = await this.db.collection('posts').doc(postId).collection('comments').add({
        ...comment,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Yorum ekleme hatası:', error);
      throw error;
    }
  }

  async getComments(postId: string): Promise<Comment[]> {
    try {
      const snapshot = await this.db
        .collection('posts')
        .doc(postId)
        .collection('comments')
        .orderBy('createdAt', 'asc')
        .get();
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Comment[];
    } catch (error) {
      console.error('Yorumlar getirme hatası:', error);
      throw error;
    }
  }

  // Likes
  async likePost(postId: string, userId: string): Promise<void> {
    try {
      const likeId = `${userId}_${postId}`;
      await this.db.collection('likes').doc(likeId).set({
        postId,
        userId,
        createdAt: firestore.FieldValue.serverTimestamp(),
      });

      // Post'un like sayısını artır
      await this.db.collection('posts').doc(postId).update({
        likes: firestore.FieldValue.increment(1)
      });
    } catch (error) {
      console.error('Post beğenme hatası:', error);
      throw error;
    }
  }

  async unlikePost(postId: string, userId: string): Promise<void> {
    try {
      const likeId = `${userId}_${postId}`;
      await this.db.collection('likes').doc(likeId).delete();

      // Post'un like sayısını azalt
      await this.db.collection('posts').doc(postId).update({
        likes: firestore.FieldValue.increment(-1)
      });
    } catch (error) {
      console.error('Post beğenmeme hatası:', error);
      throw error;
    }
  }

  async isPostLiked(postId: string, userId: string): Promise<boolean> {
    try {
      const likeId = `${userId}_${postId}`;
      const doc = await this.db.collection('likes').doc(likeId).get();
      return doc.exists;
    } catch (error) {
      console.error('Beğeni durumu kontrol hatası:', error);
      throw error;
    }
  }

  // Real-time listeners
  onPostsChange(callback: (posts: Post[]) => void) {
    return this.db
      .collection('posts')
      .orderBy('createdAt', 'desc')
      .onSnapshot((snapshot) => {
        const posts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Post[];
        callback(posts);
      });
  }

  onPetPostsChange(petId: string, callback: (posts: Post[]) => void) {
    return this.db
      .collection('posts')
      .where('petId', '==', petId)
      .orderBy('createdAt', 'desc')
      .onSnapshot((snapshot) => {
        const posts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Post[];
        callback(posts);
      });
  }
}

export default new DatabaseService();
