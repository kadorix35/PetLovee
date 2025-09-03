import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import { User, UserPreferences } from '../types';
import { validateString, validateEmail, validatePhone } from '../utils/validation';
import { logSecurityEvent } from '../config/security';

export interface UpdateUserProfileData {
  displayName?: string;
  bio?: string;
  phone?: string;
  location?: string;
  photoURL?: string;
}

export interface UpdateUserPreferencesData {
  notifications?: {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
  };
  privacy?: {
    profileVisibility?: 'public' | 'friends' | 'private';
    showEmail?: boolean;
    showPhone?: boolean;
    showLocation?: boolean;
  };
  language?: string;
  theme?: 'light' | 'dark' | 'auto';
}

class UserService {
  // Kullanıcı profilini al
  async getUserProfile(userId: string): Promise<User | null> {
    try {
      const userDoc = await firestore().collection('users').doc(userId).get();
      
      if (!userDoc.exists) {
        return null;
      }

      const userData = userDoc.data();
      return {
        id: userDoc.id,
        name: userData?.displayName || userData?.name || '',
        email: userData?.email || '',
        createdAt: userData?.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        displayName: userData?.displayName,
        photoURL: userData?.photoURL,
        bio: userData?.bio,
        phone: userData?.phone,
        location: userData?.location,
        isEmailVerified: userData?.isEmailVerified || false,
        preferences: userData?.preferences || this.getDefaultPreferences()
      };
    } catch (error) {
      console.error('Kullanıcı profili alınamadı:', error);
      return null;
    }
  }

  // Kullanıcı profilini güncelle
  async updateUserProfile(userId: string, data: UpdateUserProfileData): Promise<boolean> {
    try {
      // Input validation
      if (data.displayName) {
        const nameValidation = validateString(data.displayName, {
          required: true,
          minLength: 2,
          maxLength: 50,
          fieldName: 'Ad ve Soyad'
        });
        if (!nameValidation.isValid) {
          throw new Error(nameValidation.errors.join(', '));
        }
      }

      if (data.phone) {
        const phoneValidation = validatePhone(data.phone);
        if (!phoneValidation.isValid) {
          throw new Error(phoneValidation.errors.join(', '));
        }
      }

      if (data.bio) {
        const bioValidation = validateString(data.bio, {
          maxLength: 500,
          fieldName: 'Biyografi'
        });
        if (!bioValidation.isValid) {
          throw new Error(bioValidation.errors.join(', '));
        }
      }

      // Firebase Auth profilini güncelle
      const currentUser = auth().currentUser;
      if (currentUser && currentUser.uid === userId) {
        const updateData: any = {};
        
        if (data.displayName) {
          updateData.displayName = data.displayName;
        }
        
        if (data.photoURL) {
          updateData.photoURL = data.photoURL;
        }

        if (Object.keys(updateData).length > 0) {
          await currentUser.updateProfile(updateData);
        }
      }

      // Firestore'da kullanıcı verilerini güncelle
      const updateData: any = {
        updatedAt: firestore.FieldValue.serverTimestamp()
      };

      if (data.displayName) updateData.displayName = data.displayName;
      if (data.bio !== undefined) updateData.bio = data.bio;
      if (data.phone !== undefined) updateData.phone = data.phone;
      if (data.location !== undefined) updateData.location = data.location;
      if (data.photoURL !== undefined) updateData.photoURL = data.photoURL;

      await firestore().collection('users').doc(userId).update(updateData);

      logSecurityEvent('USER_PROFILE_UPDATED', {
        userId: this.maskUserId(userId),
        fields: Object.keys(data)
      });

      return true;
    } catch (error: any) {
      logSecurityEvent('USER_PROFILE_UPDATE_FAILED', {
        userId: this.maskUserId(userId),
        error: error.message
      });
      throw error;
    }
  }

  // Kullanıcı tercihlerini güncelle
  async updateUserPreferences(userId: string, data: UpdateUserPreferencesData): Promise<boolean> {
    try {
      const updateData: any = {
        'preferences.updatedAt': firestore.FieldValue.serverTimestamp()
      };

      if (data.notifications) {
        if (data.notifications.email !== undefined) {
          updateData['preferences.notifications.email'] = data.notifications.email;
        }
        if (data.notifications.push !== undefined) {
          updateData['preferences.notifications.push'] = data.notifications.push;
        }
        if (data.notifications.sms !== undefined) {
          updateData['preferences.notifications.sms'] = data.notifications.sms;
        }
      }

      if (data.privacy) {
        if (data.privacy.profileVisibility) {
          updateData['preferences.privacy.profileVisibility'] = data.privacy.profileVisibility;
        }
        if (data.privacy.showEmail !== undefined) {
          updateData['preferences.privacy.showEmail'] = data.privacy.showEmail;
        }
        if (data.privacy.showPhone !== undefined) {
          updateData['preferences.privacy.showPhone'] = data.privacy.showPhone;
        }
        if (data.privacy.showLocation !== undefined) {
          updateData['preferences.privacy.showLocation'] = data.privacy.showLocation;
        }
      }

      if (data.language) {
        updateData['preferences.language'] = data.language;
      }

      if (data.theme) {
        updateData['preferences.theme'] = data.theme;
      }

      await firestore().collection('users').doc(userId).update(updateData);

      logSecurityEvent('USER_PREFERENCES_UPDATED', {
        userId: this.maskUserId(userId),
        fields: Object.keys(data)
      });

      return true;
    } catch (error: any) {
      logSecurityEvent('USER_PREFERENCES_UPDATE_FAILED', {
        userId: this.maskUserId(userId),
        error: error.message
      });
      throw error;
    }
  }

  // Kullanıcı hesabını sil
  async deleteUserAccount(userId: string, password?: string): Promise<boolean> {
    try {
      const currentUser = auth().currentUser;
      if (!currentUser || currentUser.uid !== userId) {
        throw new Error('Kullanıcı oturum açmamış');
      }

      // Şifre doğrulama (eğer email/password ile giriş yapılmışsa)
      if (password && currentUser.email) {
        try {
          await auth().signInWithEmailAndPassword(currentUser.email, password);
        } catch (error) {
          throw new Error('Şifre yanlış');
        }
      }

      // Firestore'dan kullanıcı verilerini sil
      await firestore().collection('users').doc(userId).delete();

      // Kullanıcının pet'lerini sil
      const petsSnapshot = await firestore()
        .collection('pets')
        .where('ownerId', '==', userId)
        .get();

      const batch = firestore().batch();
      petsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      // Kullanıcının post'larını sil
      const postsSnapshot = await firestore()
        .collection('posts')
        .where('userId', '==', userId)
        .get();

      const postsBatch = firestore().batch();
      postsSnapshot.docs.forEach(doc => {
        postsBatch.delete(doc.ref);
      });
      await postsBatch.commit();

      // Firebase Auth'dan kullanıcıyı sil
      await currentUser.delete();

      logSecurityEvent('USER_ACCOUNT_DELETED', {
        userId: this.maskUserId(userId)
      });

      return true;
    } catch (error: any) {
      logSecurityEvent('USER_ACCOUNT_DELETE_FAILED', {
        userId: this.maskUserId(userId),
        error: error.message
      });
      throw error;
    }
  }

  // Kullanıcı istatistiklerini al
  async getUserStats(userId: string): Promise<{
    petsCount: number;
    postsCount: number;
    followersCount: number;
    followingCount: number;
  }> {
    try {
      const [petsSnapshot, postsSnapshot, followersSnapshot, followingSnapshot] = await Promise.all([
        firestore().collection('pets').where('ownerId', '==', userId).get(),
        firestore().collection('posts').where('userId', '==', userId).get(),
        firestore().collection('follows').where('followedId', '==', userId).get(),
        firestore().collection('follows').where('followerId', '==', userId).get()
      ]);

      return {
        petsCount: petsSnapshot.size,
        postsCount: postsSnapshot.size,
        followersCount: followersSnapshot.size,
        followingCount: followingSnapshot.size
      };
    } catch (error) {
      console.error('Kullanıcı istatistikleri alınamadı:', error);
      return {
        petsCount: 0,
        postsCount: 0,
        followersCount: 0,
        followingCount: 0
      };
    }
  }

  // Kullanıcı arama
  async searchUsers(query: string, limit: number = 20): Promise<User[]> {
    try {
      const usersSnapshot = await firestore()
        .collection('users')
        .where('displayName', '>=', query)
        .where('displayName', '<=', query + '\uf8ff')
        .limit(limit)
        .get();

      return usersSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.displayName || data.name || '',
          email: data.email || '',
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          displayName: data.displayName,
          photoURL: data.photoURL,
          bio: data.bio,
          phone: data.phone,
          location: data.location,
          isEmailVerified: data.isEmailVerified || false,
          preferences: data.preferences || this.getDefaultPreferences()
        };
      });
    } catch (error) {
      console.error('Kullanıcı arama hatası:', error);
      return [];
    }
  }

  // Varsayılan tercihler
  private getDefaultPreferences(): UserPreferences {
    return {
      notifications: {
        email: true,
        push: true,
        sms: false
      },
      privacy: {
        profileVisibility: 'public',
        showEmail: false,
        showPhone: false,
        showLocation: false
      },
      language: 'tr',
      theme: 'auto'
    };
  }

  // Privacy için maskeleme metodu
  private maskUserId(userId: string): string {
    if (userId.length <= 4) {
      return '*'.repeat(userId.length);
    }
    return userId.slice(0, 2) + '*'.repeat(userId.length - 4) + userId.slice(-2);
  }
}

export default new UserService();
