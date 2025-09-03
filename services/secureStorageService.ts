// Güvenli file upload ve storage service
import storage from '@react-native-firebase/storage';
import { validateFile } from '../utils/validation';
import { logSecurityEvent } from '../config/security';
import { config } from '../config/environment';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
  fileId?: string;
}

export interface FileMetadata {
  name: string;
  size: number;
  type: string;
  uploadedAt: number;
  uploadedBy: string;
  checksum?: string;
}

class SecureStorageService {
  private storage = storage();

  // Güvenli file upload
  async uploadFile(
    file: {
      uri: string;
      name: string;
      type: string;
      size: number;
    },
    userId: string,
    folder: 'pets' | 'posts' | 'profile' = 'posts'
  ): Promise<UploadResult> {
    try {
      // File validation
      const validation = validateFile({
        name: file.name,
        size: file.size,
        type: file.type
      });

      if (!validation.isValid) {
        logSecurityEvent('FILE_UPLOAD_VALIDATION_FAILED', {
          userId: this.maskUserId(userId),
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          errors: validation.errors
        });
        return {
          success: false,
          error: validation.errors.join(', ')
        };
      }

      // File size kontrolü (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        logSecurityEvent('FILE_UPLOAD_SIZE_EXCEEDED', {
          userId: this.maskUserId(userId),
          fileName: file.name,
          fileSize: file.size,
          maxSize
        });
        return {
          success: false,
          error: 'Dosya boyutu çok büyük (maksimum 10MB)'
        };
      }

      // File type kontrolü
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4'];
      if (!allowedTypes.includes(file.type)) {
        logSecurityEvent('FILE_UPLOAD_INVALID_TYPE', {
          userId: this.maskUserId(userId),
          fileName: file.name,
          fileType: file.type
        });
        return {
          success: false,
          error: 'Desteklenmeyen dosya tipi'
        };
      }

      // Güvenli dosya adı oluştur
      const fileId = this.generateSecureFileName(file.name, userId);
      const filePath = `${folder}/${userId}/${fileId}`;

      // File upload
      const reference = this.storage.ref(filePath);
      const uploadTask = reference.putFile(file.uri);

      // Upload progress tracking
      uploadTask.on('state_changed', (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log(`Upload progress: ${progress}%`);
      });

      // Upload completion
      await uploadTask;

      // Download URL al
      const downloadUrl = await reference.getDownloadURL();

      // File metadata oluştur
      const metadata: FileMetadata = {
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: Date.now(),
        uploadedBy: userId,
        checksum: await this.calculateFileChecksum(file.uri)
      };

      // Metadata'yı storage'a kaydet
      await this.saveFileMetadata(fileId, metadata);

      logSecurityEvent('FILE_UPLOAD_SUCCESS', {
        userId: this.maskUserId(userId),
        fileId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        folder
      });

      return {
        success: true,
        url: downloadUrl,
        fileId
      };
    } catch (error: any) {
      logSecurityEvent('FILE_UPLOAD_FAILED', {
        userId: this.maskUserId(userId),
        fileName: file.name,
        error: error.message
      });

      return {
        success: false,
        error: 'Dosya yükleme başarısız'
      };
    }
  }

  // File silme
  async deleteFile(fileId: string, userId: string): Promise<boolean> {
    try {
      // File metadata'yı al
      const metadata = await this.getFileMetadata(fileId);
      if (!metadata) {
        return false;
      }

      // Sadece dosya sahibi silebilir
      if (metadata.uploadedBy !== userId) {
        logSecurityEvent('UNAUTHORIZED_FILE_DELETE_ATTEMPT', {
          userId: this.maskUserId(userId),
          fileId,
          actualOwner: this.maskUserId(metadata.uploadedBy)
        });
        return false;
      }

      // File'ı storage'dan sil
      const filePath = this.getFilePathFromId(fileId);
      const reference = this.storage.ref(filePath);
      await reference.delete();

      // Metadata'yı sil
      await this.deleteFileMetadata(fileId);

      logSecurityEvent('FILE_DELETED', {
        userId: this.maskUserId(userId),
        fileId
      });

      return true;
    } catch (error) {
      logSecurityEvent('FILE_DELETE_FAILED', {
        userId: this.maskUserId(userId),
        fileId,
        error: error.message
      });
      return false;
    }
  }

  // File metadata al
  async getFileMetadata(fileId: string): Promise<FileMetadata | null> {
    try {
      const reference = this.storage.ref(`metadata/${fileId}.json`);
      const url = await reference.getDownloadURL();
      const response = await fetch(url);
      const metadata = await response.json();
      return metadata;
    } catch (error) {
      return null;
    }
  }

  // File listesi al
  async getUserFiles(userId: string, folder?: string): Promise<FileMetadata[]> {
    try {
      const path = folder ? `${folder}/${userId}` : userId;
      const reference = this.storage.ref(path);
      const listResult = await reference.listAll();

      const files: FileMetadata[] = [];
      for (const item of listResult.items) {
        const metadata = await this.getFileMetadata(item.name);
        if (metadata) {
          files.push(metadata);
        }
      }

      return files.sort((a, b) => b.uploadedAt - a.uploadedAt);
    } catch (error) {
      return [];
    }
  }

  // File integrity kontrolü
  async verifyFileIntegrity(fileId: string, expectedChecksum: string): Promise<boolean> {
    try {
      const metadata = await this.getFileMetadata(fileId);
      if (!metadata || !metadata.checksum) {
        return false;
      }

      return metadata.checksum === expectedChecksum;
    } catch (error) {
      return false;
    }
  }

  // Private methods

  private generateSecureFileName(originalName: string, userId: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = originalName.split('.').pop();
    return `${timestamp}_${randomString}_${userId.slice(0, 8)}.${extension}`;
  }

  private async saveFileMetadata(fileId: string, metadata: FileMetadata): Promise<void> {
    try {
      const reference = this.storage.ref(`metadata/${fileId}.json`);
      const jsonString = JSON.stringify(metadata);
      const blob = new Blob([jsonString], { type: 'application/json' });
      await reference.put(blob);
    } catch (error) {
      console.warn('Failed to save file metadata:', error);
    }
  }

  private async deleteFileMetadata(fileId: string): Promise<void> {
    try {
      const reference = this.storage.ref(`metadata/${fileId}.json`);
      await reference.delete();
    } catch (error) {
      console.warn('Failed to delete file metadata:', error);
    }
  }

  private getFilePathFromId(fileId: string): string {
    // File ID'den path'i çıkar (basit implementasyon)
    // Gerçek uygulamada daha güvenli bir yöntem kullanılmalı
    return `files/${fileId}`;
  }

  private async calculateFileChecksum(fileUri: string): Promise<string> {
    try {
      // Basit checksum hesaplama
      // Gerçek uygulamada crypto-js veya benzeri kütüphane kullanılmalı
      const response = await fetch(fileUri);
      const arrayBuffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      let hash = 0;
      for (let i = 0; i < uint8Array.length; i++) {
        hash = ((hash << 5) - hash + uint8Array[i]) & 0xffffffff;
      }
      
      return hash.toString(16);
    } catch (error) {
      return '';
    }
  }

  private maskUserId(userId: string): string {
    if (userId.length <= 4) {
      return '*'.repeat(userId.length);
    }
    return userId.slice(0, 2) + '*'.repeat(userId.length - 4) + userId.slice(-2);
  }

  // Malware detection (basit implementasyon)
  async scanFileForMalware(fileUri: string): Promise<boolean> {
    try {
      // Gerçek uygulamada antivirus API entegrasyonu yapılmalı
      // Bu basit implementasyon sadece dosya boyutu ve tip kontrolü yapar
      
      const response = await fetch(fileUri);
      const arrayBuffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Dosya başlığını kontrol et
      const header = Array.from(uint8Array.slice(0, 10));
      
      // Bilinen dosya imzaları
      const knownSignatures = [
        [0xFF, 0xD8, 0xFF], // JPEG
        [0x89, 0x50, 0x4E, 0x47], // PNG
        [0x52, 0x49, 0x46, 0x46], // WebP
        [0x00, 0x00, 0x00, 0x18, 0x66, 0x74, 0x79, 0x70], // MP4
      ];
      
      for (const signature of knownSignatures) {
        if (this.arrayStartsWith(header, signature)) {
          return true; // Güvenli dosya
        }
      }
      
      // Bilinmeyen imza - şüpheli
      logSecurityEvent('SUSPICIOUS_FILE_DETECTED', {
        header: header.slice(0, 4),
        fileSize: arrayBuffer.byteLength
      });
      
      return false;
    } catch (error) {
      return false;
    }
  }

  private arrayStartsWith(array: number[], prefix: number[]): boolean {
    if (array.length < prefix.length) {
      return false;
    }
    
    for (let i = 0; i < prefix.length; i++) {
      if (array[i] !== prefix[i]) {
        return false;
      }
    }
    
    return true;
  }

  // File compression (görüntü optimizasyonu)
  async compressImage(fileUri: string, quality: number = 0.8): Promise<string> {
    try {
      // React Native'de görüntü sıkıştırma için react-native-image-resizer kullanılabilir
      // Bu basit implementasyon sadece placeholder
      
      logSecurityEvent('IMAGE_COMPRESSION_REQUESTED', {
        quality,
        originalUri: fileUri
      });
      
      return fileUri; // Gerçek implementasyon gerekli
    } catch (error) {
      return fileUri;
    }
  }

  // Storage quota kontrolü
  async checkUserStorageQuota(userId: string): Promise<{
    used: number;
    limit: number;
    available: number;
  }> {
    try {
      const files = await this.getUserFiles(userId);
      const used = files.reduce((total, file) => total + file.size, 0);
      const limit = 100 * 1024 * 1024; // 100MB limit
      const available = Math.max(0, limit - used);
      
      return {
        used,
        limit,
        available
      };
    } catch (error) {
      return {
        used: 0,
        limit: 100 * 1024 * 1024,
        available: 100 * 1024 * 1024
      };
    }
  }
}

export default new SecureStorageService();
