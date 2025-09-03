import storage from '@react-native-firebase/storage';
import { launchImageLibrary, launchCamera, ImagePickerResponse, MediaType } from 'react-native-image-picker';
import { Platform, Alert } from 'react-native';

export interface UploadResult {
  url: string;
  path: string;
}

class StorageService {
  private storageRef = storage();

  // Resim seçme seçenekleri
  private getImagePickerOptions(): any {
    return {
      mediaType: 'mixed' as MediaType,
      includeBase64: false,
      maxHeight: 2000,
      maxWidth: 2000,
      quality: 0.8,
      selectionLimit: 1,
    };
  }

  // Galeriden resim seç
  async pickImageFromGallery(): Promise<string | null> {
    return new Promise((resolve) => {
      launchImageLibrary(this.getImagePickerOptions(), (response: ImagePickerResponse) => {
        if (response.didCancel || response.errorMessage) {
          resolve(null);
          return;
        }

        if (response.assets && response.assets[0]) {
          resolve(response.assets[0].uri || null);
        } else {
          resolve(null);
        }
      });
    });
  }

  // Kameradan resim çek
  async takePhotoWithCamera(): Promise<string | null> {
    return new Promise((resolve) => {
      launchCamera(this.getImagePickerOptions(), (response: ImagePickerResponse) => {
        if (response.didCancel || response.errorMessage) {
          resolve(null);
          return;
        }

        if (response.assets && response.assets[0]) {
          resolve(response.assets[0].uri || null);
        } else {
          resolve(null);
        }
      });
    });
  }

  // Resim seçme modalı
  async showImagePicker(): Promise<string | null> {
    return new Promise((resolve) => {
      Alert.alert(
        'Resim Seç',
        'Nasıl bir resim eklemek istersiniz?',
        [
          {
            text: 'Kamera',
            onPress: async () => {
              const uri = await this.takePhotoWithCamera();
              resolve(uri);
            }
          },
          {
            text: 'Galeri',
            onPress: async () => {
              const uri = await this.pickImageFromGallery();
              resolve(uri);
            }
          },
          {
            text: 'İptal',
            style: 'cancel',
            onPress: () => resolve(null)
          }
        ]
      );
    });
  }

  // Dosyayı Firebase Storage'a yükle
  async uploadFile(
    localUri: string, 
    path: string, 
    onProgress?: (progress: number) => void
  ): Promise<UploadResult> {
    try {
      const reference = this.storageRef.ref(path);
      
      // Upload task oluştur
      const task = reference.putFile(localUri);

      // Progress listener
      if (onProgress) {
        task.on('state_changed', (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress(progress);
        });
      }

      // Upload'u bekle
      await task;

      // Download URL'ini al
      const downloadUrl = await reference.getDownloadURL();

      return {
        url: downloadUrl,
        path: path
      };
    } catch (error) {
      console.error('Dosya yükleme hatası:', error);
      throw error;
    }
  }

  // Pet profil fotoğrafı yükle
  async uploadPetProfilePhoto(
    userId: string, 
    petId: string, 
    localUri: string,
    onProgress?: (progress: number) => void
  ): Promise<UploadResult> {
    const fileName = `pet_${petId}_${Date.now()}.jpg`;
    const path = `users/${userId}/pets/${petId}/profile/${fileName}`;
    
    return this.uploadFile(localUri, path, onProgress);
  }

  // Post medyası yükle
  async uploadPostMedia(
    userId: string, 
    postId: string, 
    localUri: string,
    type: 'photo' | 'video',
    onProgress?: (progress: number) => void
  ): Promise<UploadResult> {
    const extension = type === 'photo' ? 'jpg' : 'mp4';
    const fileName = `post_${postId}_${Date.now()}.${extension}`;
    const path = `users/${userId}/posts/${postId}/media/${fileName}`;
    
    return this.uploadFile(localUri, path, onProgress);
  }

  // Dosyayı sil
  async deleteFile(path: string): Promise<void> {
    try {
      const reference = this.storageRef.ref(path);
      await reference.delete();
    } catch (error) {
      console.error('Dosya silme hatası:', error);
      throw error;
    }
  }

  // Dosya boyutunu kontrol et
  async getFileSize(localUri: string): Promise<number> {
    try {
      const response = await fetch(localUri);
      const blob = await response.blob();
      return blob.size;
    } catch (error) {
      console.error('Dosya boyutu kontrol hatası:', error);
      return 0;
    }
  }

  // Dosya türünü kontrol et
  getFileType(uri: string): 'image' | 'video' | 'unknown' {
    const extension = uri.split('.').pop()?.toLowerCase();
    
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const videoExtensions = ['mp4', 'mov', 'avi', 'mkv', 'webm'];
    
    if (imageExtensions.includes(extension || '')) {
      return 'image';
    } else if (videoExtensions.includes(extension || '')) {
      return 'video';
    }
    
    return 'unknown';
  }

  // Dosya boyutunu formatla
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Maksimum dosya boyutu kontrolü
  isFileSizeValid(size: number, maxSizeMB: number = 10): boolean {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return size <= maxSizeBytes;
  }
}

export default new StorageService();
