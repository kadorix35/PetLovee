import { getFirebaseAdminConfig } from '../firebase.config';
import { config } from '../config/environment';

/**
 * FCM (Firebase Cloud Messaging) Servisi
 * Güvenli push notification gönderimi için
 */
class FCMService {
  private projectId: string;
  private useWorkloadIdentity: boolean;

  constructor() {
    const adminConfig = getFirebaseAdminConfig();
    this.projectId = adminConfig.projectId;
    this.useWorkloadIdentity = adminConfig.useWorkloadIdentity;
  }

  /**
   * Güvenli FCM token ile notification gönder
   * Production'da Workload Identity kullanır
   */
  async sendNotification(
    fcmToken: string,
    notification: {
      title: string;
      body: string;
    },
    data?: Record<string, string>
  ): Promise<boolean> {
    try {
      if (this.useWorkloadIdentity) {
        // Production'da Workload Identity kullan
        return await this.sendWithWorkloadIdentity(fcmToken, notification, data);
      } else {
        // Development'da güvenli environment variables kullan
        return await this.sendWithEnvironmentAuth(fcmToken, notification, data);
      }
    } catch (error) {
      console.error('FCM notification gönderme hatası:', error);
      return false;
    }
  }

  /**
   * Workload Identity ile notification gönder (Production)
   */
  private async sendWithWorkloadIdentity(
    fcmToken: string,
    notification: { title: string; body: string },
    data?: Record<string, string>
  ): Promise<boolean> {
    try {
      // Workload Identity ile otomatik kimlik doğrulama
      const response = await fetch(
        `https://fcm.googleapis.com/v1/projects/${this.projectId}/messages:send`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Workload Identity token otomatik olarak eklenir
            'Authorization': `Bearer ${await this.getWorkloadIdentityToken()}`
          },
          body: JSON.stringify({
            message: {
              token: fcmToken,
              notification,
              data
            }
          })
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Workload Identity FCM hatası:', error);
      return false;
    }
  }

  /**
   * Environment variables ile notification gönder (Development)
   */
  private async sendWithEnvironmentAuth(
    fcmToken: string,
    notification: { title: string; body: string },
    data?: Record<string, string>
  ): Promise<boolean> {
    try {
      // Development için güvenli API key kullan
      const serverKey = config.fcm.serverKey;
      
      if (!serverKey) {
        throw new Error('FCM server key bulunamadı');
      }

      const response = await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `key=${serverKey}`
        },
        body: JSON.stringify({
          to: fcmToken,
          notification,
          data
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Environment FCM hatası:', error);
      return false;
    }
  }

  /**
   * Workload Identity token al
   */
  private async getWorkloadIdentityToken(): Promise<string> {
    try {
      // Google Cloud metadata server'dan token al
      const response = await fetch(
        'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token',
        {
          headers: {
            'Metadata-Flavor': 'Google'
          }
        }
      );

      const tokenData = await response.json();
      return tokenData.access_token;
    } catch (error) {
      console.error('Workload Identity token alma hatası:', error);
      throw error;
    }
  }

  /**
   * Beğeni notification'ı gönder
   */
  async sendLikeNotification(
    recipientUserId: string,
    likerName: string,
    postId: string
  ): Promise<boolean> {
    // FCM token'ı Firestore'dan al
    const fcmToken = await this.getUserFCMToken(recipientUserId);
    
    if (!fcmToken) {
      console.warn('Kullanıcı FCM token bulunamadı:', recipientUserId);
      return false;
    }

    return await this.sendNotification(
      fcmToken,
      {
        title: 'Yeni Beğeni! ❤️',
        body: `${likerName} gönderinizi beğendi`
      },
      {
        type: 'like',
        postId,
        likerName
      }
    );
  }

  /**
   * Yorum notification'ı gönder
   */
  async sendCommentNotification(
    recipientUserId: string,
    commenterName: string,
    postId: string,
    commentText: string
  ): Promise<boolean> {
    const fcmToken = await this.getUserFCMToken(recipientUserId);
    
    if (!fcmToken) {
      console.warn('Kullanıcı FCM token bulunamadı:', recipientUserId);
      return false;
    }

    return await this.sendNotification(
      fcmToken,
      {
        title: 'Yeni Yorum! 💬',
        body: `${commenterName}: ${commentText.substring(0, 50)}...`
      },
      {
        type: 'comment',
        postId,
        commenterName,
        commentText
      }
    );
  }

  /**
   * Takip notification'ı gönder
   */
  async sendFollowNotification(
    recipientUserId: string,
    followerName: string
  ): Promise<boolean> {
    const fcmToken = await this.getUserFCMToken(recipientUserId);
    
    if (!fcmToken) {
      console.warn('Kullanıcı FCM token bulunamadı:', recipientUserId);
      return false;
    }

    return await this.sendNotification(
      fcmToken,
      {
        title: 'Yeni Takipçi! 👥',
        body: `${followerName} sizi takip etmeye başladı`
      },
      {
        type: 'follow',
        followerName
      }
    );
  }

  /**
   * Kullanıcının FCM token'ını Firestore'dan al
   */
  private async getUserFCMToken(userId: string): Promise<string | null> {
    try {
      // Bu fonksiyon Firestore'dan FCM token'ı alır
      // Implementation Firestore service'e bağlı olarak yapılacak
      console.log('FCM token alınıyor:', userId);
      return null; // Placeholder
    } catch (error) {
      console.error('FCM token alma hatası:', error);
      return null;
    }
  }
}

export default new FCMService();