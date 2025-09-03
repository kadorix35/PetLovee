import admin from 'firebase-admin';
import { config } from '@/config/environment';

// Firebase Admin SDK'yı initialize et
let isInitialized = false;

const initializeFirebaseAdmin = () => {
  if (isInitialized) return;

  try {
    // Environment'dan FCM server key'ini al
    const fcmServerKey = process.env.FCM_SERVER_KEY;
    
    if (!fcmServerKey) {
      throw new Error('FCM_SERVER_KEY environment variable bulunamadı');
    }

    // Base64 decode et
    const serviceAccount = JSON.parse(
      Buffer.from(fcmServerKey, 'base64').toString('utf-8')
    );

    // Firebase Admin SDK'yı initialize et
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: config.firebase.projectId,
    });

    isInitialized = true;
    console.log('Firebase Admin SDK başarıyla initialize edildi');
  } catch (error) {
    console.error('Firebase Admin SDK initialize edilemedi:', error);
    throw error;
  }
};

export interface FCMNotificationData {
  title: string;
  body: string;
  data?: { [key: string]: string };
  imageUrl?: string;
}

export interface FCMMessage {
  token?: string;
  topic?: string;
  notification: FCMNotificationData;
  data?: { [key: string]: string };
  android?: {
    priority: 'normal' | 'high';
    notification?: {
      sound?: string;
      color?: string;
      icon?: string;
    };
  };
  apns?: {
    payload: {
      aps: {
        sound?: string;
        badge?: number;
      };
    };
  };
}

class FCMService {
  private messaging: admin.messaging.Messaging;

  constructor() {
    initializeFirebaseAdmin();
    this.messaging = admin.messaging();
  }

  /**
   * Tek bir cihaza push notification gönder
   */
  async sendToDevice(
    token: string,
    notification: FCMNotificationData,
    data?: { [key: string]: string }
  ): Promise<string> {
    try {
      const message: FCMMessage = {
        token,
        notification,
        data,
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            color: '#FF6B6B', // PetLovee brand color
            icon: 'ic_notification',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await this.messaging.send(message);
      console.log('Push notification başarıyla gönderildi:', response);
      return response;
    } catch (error) {
      console.error('Push notification gönderilemedi:', error);
      throw error;
    }
  }

  /**
   * Birden fazla cihaza push notification gönder
   */
  async sendToMultipleDevices(
    tokens: string[],
    notification: FCMNotificationData,
    data?: { [key: string]: string }
  ): Promise<admin.messaging.BatchResponse> {
    try {
      const message: FCMMessage = {
        notification,
        data,
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            color: '#FF6B6B',
            icon: 'ic_notification',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await this.messaging.sendEachForMulticast({
        tokens,
        ...message,
      });

      console.log(`Push notification gönderildi: ${response.successCount}/${tokens.length}`);
      return response;
    } catch (error) {
      console.error('Çoklu push notification gönderilemedi:', error);
      throw error;
    }
  }

  /**
   * Topic'e push notification gönder
   */
  async sendToTopic(
    topic: string,
    notification: FCMNotificationData,
    data?: { [key: string]: string }
  ): Promise<string> {
    try {
      const message: FCMMessage = {
        topic,
        notification,
        data,
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            color: '#FF6B6B',
            icon: 'ic_notification',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              badge: 1,
            },
          },
        },
      };

      const response = await this.messaging.send(message);
      console.log(`Topic "${topic}" için push notification gönderildi:`, response);
      return response;
    } catch (error) {
      console.error(`Topic "${topic}" için push notification gönderilemedi:`, error);
      throw error;
    }
  }

  /**
   * Kullanıcıya özel notification gönder
   */
  async sendToUser(
    userId: string,
    notification: FCMNotificationData,
    data?: { [key: string]: string }
  ): Promise<void> {
    try {
      // Firestore'dan kullanıcının FCM token'ını al
      const userDoc = await admin.firestore()
        .collection('users')
        .doc(userId)
        .get();

      if (!userDoc.exists) {
        throw new Error(`Kullanıcı bulunamadı: ${userId}`);
      }

      const userData = userDoc.data();
      const fcmToken = userData?.fcmToken;

      if (!fcmToken) {
        console.warn(`Kullanıcı ${userId} için FCM token bulunamadı`);
        return;
      }

      await this.sendToDevice(fcmToken, notification, data);
    } catch (error) {
      console.error(`Kullanıcı ${userId} için push notification gönderilemedi:`, error);
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
  ): Promise<void> {
    const notification: FCMNotificationData = {
      title: 'Yeni Beğeni! ❤️',
      body: `${likerName} gönderinizi beğendi`,
    };

    const data = {
      type: 'like',
      postId,
      action: 'open_post',
    };

    await this.sendToUser(recipientUserId, notification, data);
  }

  /**
   * Yorum notification'ı gönder
   */
  async sendCommentNotification(
    recipientUserId: string,
    commenterName: string,
    postId: string,
    commentText: string
  ): Promise<void> {
    const notification: FCMNotificationData = {
      title: 'Yeni Yorum! 💬',
      body: `${commenterName}: ${commentText.substring(0, 50)}${commentText.length > 50 ? '...' : ''}`,
    };

    const data = {
      type: 'comment',
      postId,
      action: 'open_post',
    };

    await this.sendToUser(recipientUserId, notification, data);
  }

  /**
   * Takip notification'ı gönder
   */
  async sendFollowNotification(
    recipientUserId: string,
    followerName: string
  ): Promise<void> {
    const notification: FCMNotificationData = {
      title: 'Yeni Takipçi! 👥',
      body: `${followerName} sizi takip etmeye başladı`,
    };

    const data = {
      type: 'follow',
      action: 'open_profile',
    };

    await this.sendToUser(recipientUserId, notification, data);
  }

  /**
   * Mesaj notification'ı gönder
   */
  async sendMessageNotification(
    recipientUserId: string,
    senderName: string,
    messageText: string,
    chatId: string
  ): Promise<void> {
    const notification: FCMNotificationData = {
      title: `${senderName} 💌`,
      body: messageText.substring(0, 100) + (messageText.length > 100 ? '...' : ''),
    };

    const data = {
      type: 'message',
      chatId,
      action: 'open_chat',
    };

    await this.sendToUser(recipientUserId, notification, data);
  }

  /**
   * Pet hatırlatma notification'ı gönder
   */
  async sendPetReminderNotification(
    userId: string,
    petName: string,
    reminderType: string,
    reminderTime: string
  ): Promise<void> {
    const notification: FCMNotificationData = {
      title: 'Pet Hatırlatması! 🐾',
      body: `${petName} için ${reminderType} zamanı (${reminderTime})`,
    };

    const data = {
      type: 'reminder',
      action: 'open_reminders',
    };

    await this.sendToUser(userId, notification, data);
  }

  /**
   * Genel duyuru notification'ı gönder
   */
  async sendAnnouncementNotification(
    title: string,
    body: string,
    data?: { [key: string]: string }
  ): Promise<void> {
    const notification: FCMNotificationData = {
      title,
      body,
    };

    await this.sendToTopic('announcements', notification, data);
  }

  /**
   * FCM token'ı doğrula
   */
  async validateToken(token: string): Promise<boolean> {
    try {
      await this.messaging.send({
        token,
        notification: {
          title: 'Test',
          body: 'Token doğrulama testi',
        },
      }, true); // Dry run
      return true;
    } catch (error) {
      console.error('FCM token doğrulanamadı:', error);
      return false;
    }
  }

  /**
   * Geçersiz token'ları temizle
   */
  async cleanupInvalidTokens(userId: string): Promise<void> {
    try {
      const userDoc = await admin.firestore()
        .collection('users')
        .doc(userId)
        .get();

      if (!userDoc.exists) return;

      const userData = userDoc.data();
      const fcmToken = userData?.fcmToken;

      if (!fcmToken) return;

      const isValid = await this.validateToken(fcmToken);
      if (!isValid) {
        await admin.firestore()
          .collection('users')
          .doc(userId)
          .update({
            fcmToken: admin.firestore.FieldValue.delete(),
            lastTokenUpdate: admin.firestore.FieldValue.delete(),
          });
        console.log(`Geçersiz FCM token temizlendi: ${userId}`);
      }
    } catch (error) {
      console.error('FCM token temizleme hatası:', error);
    }
  }
}

export default new FCMService();
