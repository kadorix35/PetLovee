import firestore from '@react-native-firebase/firestore';
import { PetProfile } from '../types';
import { validateString } from '../utils/validation';
import { logSecurityEvent } from '../config/security';

export interface CreatePetData {
  name: string;
  species: string;
  breed: string;
  age: string;
  gender: 'Erkek' | 'Dişi';
  bio: string;
  photoUrl?: string;
}

export interface UpdatePetData {
  name?: string;
  species?: string;
  breed?: string;
  age?: string;
  gender?: 'Erkek' | 'Dişi';
  bio?: string;
  photoUrl?: string;
}

class PetService {
  // Kullanıcının pet'lerini al
  async getUserPets(userId: string): Promise<PetProfile[]> {
    try {
      const petsSnapshot = await firestore()
        .collection('pets')
        .where('ownerId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

      return petsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          species: data.species,
          breed: data.breed,
          age: data.age,
          gender: data.gender,
          bio: data.bio,
          photoUrl: data.photoUrl,
          ownerId: data.ownerId,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
        };
      });
    } catch (error) {
      console.error('Pet\'ler alınamadı:', error);
      return [];
    }
  }

  // Pet oluştur
  async createPet(userId: string, data: CreatePetData): Promise<string> {
    try {
      // Input validation
      const nameValidation = validateString(data.name, {
        required: true,
        minLength: 2,
        maxLength: 50,
        fieldName: 'Pet Adı'
      });
      if (!nameValidation.isValid) {
        throw new Error(nameValidation.errors.join(', '));
      }

      const speciesValidation = validateString(data.species, {
        required: true,
        minLength: 2,
        maxLength: 30,
        fieldName: 'Tür'
      });
      if (!speciesValidation.isValid) {
        throw new Error(speciesValidation.errors.join(', '));
      }

      const breedValidation = validateString(data.breed, {
        required: true,
        minLength: 2,
        maxLength: 30,
        fieldName: 'Irk'
      });
      if (!breedValidation.isValid) {
        throw new Error(breedValidation.errors.join(', '));
      }

      const ageValidation = validateString(data.age, {
        required: true,
        minLength: 1,
        maxLength: 20,
        fieldName: 'Yaş'
      });
      if (!ageValidation.isValid) {
        throw new Error(ageValidation.errors.join(', '));
      }

      const bioValidation = validateString(data.bio, {
        maxLength: 500,
        fieldName: 'Biyografi'
      });
      if (!bioValidation.isValid) {
        throw new Error(bioValidation.errors.join(', '));
      }

      const petData = {
        name: data.name.trim(),
        species: data.species.trim(),
        breed: data.breed.trim(),
        age: data.age.trim(),
        gender: data.gender,
        bio: data.bio?.trim() || '',
        photoUrl: data.photoUrl || '',
        ownerId: userId,
        createdAt: firestore.FieldValue.serverTimestamp(),
        updatedAt: firestore.FieldValue.serverTimestamp()
      };

      const docRef = await firestore().collection('pets').add(petData);

      logSecurityEvent('PET_CREATED', {
        userId: this.maskUserId(userId),
        petId: this.maskPetId(docRef.id),
        petName: data.name
      });

      return docRef.id;
    } catch (error: any) {
      logSecurityEvent('PET_CREATE_FAILED', {
        userId: this.maskUserId(userId),
        error: error.message
      });
      throw error;
    }
  }

  // Pet güncelle
  async updatePet(petId: string, userId: string, data: UpdatePetData): Promise<boolean> {
    try {
      // Pet'in sahibi olduğunu kontrol et
      const petDoc = await firestore().collection('pets').doc(petId).get();
      if (!petDoc.exists) {
        throw new Error('Pet bulunamadı');
      }

      const petData = petDoc.data();
      if (petData?.ownerId !== userId) {
        throw new Error('Bu pet\'i güncelleme yetkiniz yok');
      }

      // Input validation
      if (data.name) {
        const nameValidation = validateString(data.name, {
          required: true,
          minLength: 2,
          maxLength: 50,
          fieldName: 'Pet Adı'
        });
        if (!nameValidation.isValid) {
          throw new Error(nameValidation.errors.join(', '));
        }
      }

      if (data.species) {
        const speciesValidation = validateString(data.species, {
          required: true,
          minLength: 2,
          maxLength: 30,
          fieldName: 'Tür'
        });
        if (!speciesValidation.isValid) {
          throw new Error(speciesValidation.errors.join(', '));
        }
      }

      if (data.breed) {
        const breedValidation = validateString(data.breed, {
          required: true,
          minLength: 2,
          maxLength: 30,
          fieldName: 'Irk'
        });
        if (!breedValidation.isValid) {
          throw new Error(breedValidation.errors.join(', '));
        }
      }

      if (data.age) {
        const ageValidation = validateString(data.age, {
          required: true,
          minLength: 1,
          maxLength: 20,
          fieldName: 'Yaş'
        });
        if (!ageValidation.isValid) {
          throw new Error(ageValidation.errors.join(', '));
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

      const updateData: any = {
        updatedAt: firestore.FieldValue.serverTimestamp()
      };

      if (data.name) updateData.name = data.name.trim();
      if (data.species) updateData.species = data.species.trim();
      if (data.breed) updateData.breed = data.breed.trim();
      if (data.age) updateData.age = data.age.trim();
      if (data.gender) updateData.gender = data.gender;
      if (data.bio !== undefined) updateData.bio = data.bio.trim();
      if (data.photoUrl !== undefined) updateData.photoUrl = data.photoUrl;

      await firestore().collection('pets').doc(petId).update(updateData);

      logSecurityEvent('PET_UPDATED', {
        userId: this.maskUserId(userId),
        petId: this.maskPetId(petId),
        fields: Object.keys(data)
      });

      return true;
    } catch (error: any) {
      logSecurityEvent('PET_UPDATE_FAILED', {
        userId: this.maskUserId(userId),
        petId: this.maskPetId(petId),
        error: error.message
      });
      throw error;
    }
  }

  // Pet sil
  async deletePet(petId: string, userId: string): Promise<boolean> {
    try {
      // Pet'in sahibi olduğunu kontrol et
      const petDoc = await firestore().collection('pets').doc(petId).get();
      if (!petDoc.exists) {
        throw new Error('Pet bulunamadı');
      }

      const petData = petDoc.data();
      if (petData?.ownerId !== userId) {
        throw new Error('Bu pet\'i silme yetkiniz yok');
      }

      // Pet ile ilgili post'ları da sil
      const postsSnapshot = await firestore()
        .collection('posts')
        .where('petId', '==', petId)
        .get();

      const batch = firestore().batch();
      postsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      // Pet'i sil
      await firestore().collection('pets').doc(petId).delete();

      logSecurityEvent('PET_DELETED', {
        userId: this.maskUserId(userId),
        petId: this.maskPetId(petId),
        petName: petData?.name
      });

      return true;
    } catch (error: any) {
      logSecurityEvent('PET_DELETE_FAILED', {
        userId: this.maskUserId(userId),
        petId: this.maskPetId(petId),
        error: error.message
      });
      throw error;
    }
  }

  // Pet detaylarını al
  async getPetById(petId: string): Promise<PetProfile | null> {
    try {
      const petDoc = await firestore().collection('pets').doc(petId).get();
      
      if (!petDoc.exists) {
        return null;
      }

      const data = petDoc.data();
      return {
        id: petDoc.id,
        name: data?.name || '',
        species: data?.species || '',
        breed: data?.breed || '',
        age: data?.age || '',
        gender: data?.gender || 'Erkek',
        bio: data?.bio || '',
        photoUrl: data?.photoUrl || '',
        ownerId: data?.ownerId || '',
        createdAt: data?.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
      };
    } catch (error) {
      console.error('Pet detayları alınamadı:', error);
      return null;
    }
  }

  // Pet arama
  async searchPets(query: string, limit: number = 20): Promise<PetProfile[]> {
    try {
      const petsSnapshot = await firestore()
        .collection('pets')
        .where('name', '>=', query)
        .where('name', '<=', query + '\uf8ff')
        .limit(limit)
        .get();

      return petsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          species: data.species,
          breed: data.breed,
          age: data.age,
          gender: data.gender,
          bio: data.bio,
          photoUrl: data.photoUrl,
          ownerId: data.ownerId,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
        };
      });
    } catch (error) {
      console.error('Pet arama hatası:', error);
      return [];
    }
  }

  // Tüm pet'leri al (keşfet sayfası için)
  async getAllPets(limit: number = 50): Promise<PetProfile[]> {
    try {
      const petsSnapshot = await firestore()
        .collection('pets')
        .orderBy('createdAt', 'desc')
        .limit(limit)
        .get();

      return petsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name,
          species: data.species,
          breed: data.breed,
          age: data.age,
          gender: data.gender,
          bio: data.bio,
          photoUrl: data.photoUrl,
          ownerId: data.ownerId,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString()
        };
      });
    } catch (error) {
      console.error('Pet\'ler alınamadı:', error);
      return [];
    }
  }

  // Privacy için maskeleme metodları
  private maskUserId(userId: string): string {
    if (userId.length <= 4) {
      return '*'.repeat(userId.length);
    }
    return userId.slice(0, 2) + '*'.repeat(userId.length - 4) + userId.slice(-2);
  }

  private maskPetId(petId: string): string {
    if (petId.length <= 4) {
      return '*'.repeat(petId.length);
    }
    return petId.slice(0, 2) + '*'.repeat(petId.length - 4) + petId.slice(-2);
  }
}

export default new PetService();
