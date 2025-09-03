import firestore from '@react-native-firebase/firestore';
import { PetProfile, Post, FollowRelation, Comment, User } from '@/types/index';
import { validatePetData, validatePostData, validateComment, validateString } from '../utils/validation';
import { sanitizeHtml, sanitizeSqlInput } from '../utils/validation';
import { logSecurityEvent } from '../config/security';
import { config } from '../config/environment';

class DatabaseService {
  private db = firestore();

  // Pet Profilleri
  async createPetProfile(petData: Omit<PetProfile, 'id' | 'createdAt'>, userId: string): Promise<string> {
    try {
      // Input validation
      const validation = validatePetData(petData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // Data sanitization
      const sanitizedData = {
        ...petData,
        name: this.sanitizeString(petData.name),
        species: this.sanitizeString(petData.species),
        breed: this.sanitizeString(petData.breed),
        age: this.sanitizeString(petData.age),
        bio: this.sanitizeString(petData.bio),
        ownerId: userId, // Güvenlik için ownerId'yi parametreden al
        createdAt: firestore.FieldValue.serverTimestamp(),
      };

      const docRef = await this.db.collection('pets').add(sanitizedData);
      
      logSecurityEvent('PET_PROFILE_CREATED', {
        userId: this.maskUserId(userId),
        petId: docRef.id
      });

      return docRef.id;
    } catch (error) {
      logSecurityEvent('PET_PROFILE_CREATE_FAILED', {
        userId: this.maskUserId(userId),
        error: error.message
      });
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

  async updatePetProfile(petId: string, updates: Partial<PetProfile>, userId: string): Promise<void> {
    try {
      // Pet'in sahibi olduğunu kontrol et
      const petDoc = await this.db.collection('pets').doc(petId).get();
      if (!petDoc.exists) {
        throw new Error('Pet profili bulunamadı');
      }

      const petData = petDoc.data() as PetProfile;
      if (petData.ownerId !== userId) {
        logSecurityEvent('UNAUTHORIZED_PET_UPDATE_ATTEMPT', {
          userId: this.maskUserId(userId),
          petId,
          actualOwnerId: this.maskUserId(petData.ownerId)
        });
        throw new Error('Bu pet profili güncelleme yetkiniz yok');
      }

      // Input validation
      if (updates.name) {
        const nameValidation = validateString(updates.name, {
          required: true,
          minLength: 1,
          maxLength: 50,
          fieldName: 'Pet adı'
        });
        if (!nameValidation.isValid) {
          throw new Error(nameValidation.errors.join(', '));
        }
      }

      // Data sanitization
      const sanitizedUpdates: any = {};
      Object.keys(updates).forEach(key => {
        if (key !== 'id' && key !== 'createdAt' && key !== 'ownerId') {
          const value = (updates as any)[key];
          if (typeof value === 'string') {
            sanitizedUpdates[key] = this.sanitizeString(value);
          } else {
            sanitizedUpdates[key] = value;
          }
        }
      });

      await this.db.collection('pets').doc(petId).update(sanitizedUpdates);
      
      logSecurityEvent('PET_PROFILE_UPDATED', {
        userId: this.maskUserId(userId),
        petId
      });
    } catch (error) {
      logSecurityEvent('PET_PROFILE_UPDATE_FAILED', {
        userId: this.maskUserId(userId),
        petId,
        error: error.message
      });
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
  async createPost(postData: Omit<Post, 'id' | 'createdAt'>, userId: string): Promise<string> {
    try {
      // Input validation
      const validation = validatePostData(postData);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // Pet'in sahibi olduğunu kontrol et
      const petDoc = await this.db.collection('pets').doc(postData.petId).get();
      if (!petDoc.exists) {
        throw new Error('Pet profili bulunamadı');
      }

      const petData = petDoc.data() as PetProfile;
      if (petData.ownerId !== userId) {
        logSecurityEvent('UNAUTHORIZED_POST_CREATE_ATTEMPT', {
          userId: this.maskUserId(userId),
          petId: postData.petId,
          actualOwnerId: this.maskUserId(petData.ownerId)
        });
        throw new Error('Bu pet için post oluşturma yetkiniz yok');
      }

      // Data sanitization
      const sanitizedData = {
        ...postData,
        caption: this.sanitizeString(postData.caption),
        createdAt: firestore.FieldValue.serverTimestamp(),
      };

      const docRef = await this.db.collection('posts').add(sanitizedData);
      
      logSecurityEvent('POST_CREATED', {
        userId: this.maskUserId(userId),
        postId: docRef.id,
        petId: postData.petId
      });

      return docRef.id;
    } catch (error) {
      logSecurityEvent('POST_CREATE_FAILED', {
        userId: this.maskUserId(userId),
        error: error.message
      });
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
  async addComment(postId: string, comment: Omit<Comment, 'id' | 'createdAt'>, userId: string): Promise<string> {
    try {
      // Input validation
      const validation = validateComment(comment.text);
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      // Post'un var olduğunu kontrol et
      const postDoc = await this.db.collection('posts').doc(postId).get();
      if (!postDoc.exists) {
        throw new Error('Post bulunamadı');
      }

      // Data sanitization
      const sanitizedComment = {
        ...comment,
        userId: userId, // Güvenlik için userId'yi parametreden al
        text: this.sanitizeString(comment.text),
        createdAt: firestore.FieldValue.serverTimestamp(),
      };

      const docRef = await this.db.collection('posts').doc(postId).collection('comments').add(sanitizedComment);
      
      // Post'un comment sayısını artır
      await this.db.collection('posts').doc(postId).update({
        comments: firestore.FieldValue.increment(1)
      });
      
      logSecurityEvent('COMMENT_ADDED', {
        userId: this.maskUserId(userId),
        postId,
        commentId: docRef.id
      });

      return docRef.id;
    } catch (error) {
      logSecurityEvent('COMMENT_ADD_FAILED', {
        userId: this.maskUserId(userId),
        postId,
        error: error.message
      });
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

  onPostChange(postId: string, callback: (post: Post | null) => void) {
    return this.db
      .collection('posts')
      .doc(postId)
      .onSnapshot((doc) => {
        if (doc.exists) {
          callback({ id: doc.id, ...doc.data() } as Post);
        } else {
          callback(null);
        }
      });
  }

  onCommentsChange(postId: string, callback: (comments: Comment[]) => void) {
    return this.db
      .collection('posts')
      .doc(postId)
      .collection('comments')
      .orderBy('createdAt', 'asc')
      .onSnapshot((snapshot) => {
        const comments = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Comment[];
        callback(comments);
      });
  }

  onLikesChange(postId: string, callback: (likes: number) => void) {
    return this.db
      .collection('posts')
      .doc(postId)
      .onSnapshot((doc) => {
        if (doc.exists) {
          const data = doc.data();
          callback(data?.likes || 0);
        }
      });
  }

  // Güvenlik yardımcı metodları
  private sanitizeString(input: string): string {
    if (typeof input !== 'string') {
      return '';
    }

    // XSS koruması
    const sanitized = sanitizeHtml(input);
    if (sanitized.hasChanges) {
      logSecurityEvent('XSS_ATTEMPT_DETECTED', {
        originalLength: input.length,
        sanitizedLength: sanitized.sanitized.length
      });
    }

    // SQL injection koruması
    return sanitizeSqlInput(sanitized.sanitized);
  }

  private maskUserId(userId: string): string {
    if (userId.length <= 4) {
      return '*'.repeat(userId.length);
    }
    return userId.slice(0, 2) + '*'.repeat(userId.length - 4) + userId.slice(-2);
  }

  // Rate limiting için comment kontrolü
  async canUserComment(userId: string, postId: string): Promise<boolean> {
    try {
      // Son 1 dakikada bu kullanıcının bu post'a yorum yapıp yapmadığını kontrol et
      const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
      const recentComments = await this.db
        .collection('posts')
        .doc(postId)
        .collection('comments')
        .where('userId', '==', userId)
        .where('createdAt', '>', oneMinuteAgo)
        .limit(1)
        .get();

      return recentComments.empty;
    } catch (error) {
      return false;
    }
  }

  // Spam detection için basit kontrol
  async detectSpam(text: string, userId: string): Promise<boolean> {
    try {
      // Son 5 dakikada aynı kullanıcının benzer yorumlar yapıp yapmadığını kontrol et
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const recentComments = await this.db
        .collectionGroup('comments')
        .where('userId', '==', userId)
        .where('createdAt', '>', fiveMinutesAgo)
        .limit(10)
        .get();

      let similarCount = 0;
      recentComments.docs.forEach(doc => {
        const commentText = doc.data().text;
        if (commentText && this.calculateSimilarity(text, commentText) > 0.8) {
          similarCount++;
        }
      });

      if (similarCount >= 3) {
        logSecurityEvent('SPAM_DETECTED', {
          userId: this.maskUserId(userId),
          similarCount,
          textLength: text.length
        });
        return true;
      }

      return false;
    } catch (error) {
      return false;
    }
  }

  // Basit string similarity hesaplama
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) {
      return 1.0;
    }
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  // Levenshtein distance hesaplama
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  // Güvenli veri temizleme
  async cleanupExpiredData(): Promise<void> {
    try {
      const now = new Date();
      const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);

      // Eski post'ları temizle (1 yıldan eski)
      const oldPosts = await this.db
        .collection('posts')
        .where('createdAt', '<', oneYearAgo)
        .limit(100)
        .get();

      const batch = this.db.batch();
      oldPosts.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      if (oldPosts.docs.length > 0) {
        await batch.commit();
        logSecurityEvent('EXPIRED_DATA_CLEANED', {
          postsDeleted: oldPosts.docs.length
        });
      }
    } catch (error) {
      logSecurityEvent('DATA_CLEANUP_FAILED', {
        error: error.message
      });
    }
  }
}

export default new DatabaseService();
