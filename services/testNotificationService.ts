import FCMService from './fcmService';
import { firestore } from '@/firebase.config';

/**
 * Push notification test servisi
 * Bu servis sadece development/test amaçlı kullanılmalıdır
 */
class TestNotificationService {
  
  /**
   * Test notification gönder
   */
  async sendTestNotification(userId: string): Promise<void> {
    try {
      const notification = {
        title: 'Test Bildirimi 🧪',
        body: 'Bu bir test bildirimidir. FCM entegrasyonu çalışıyor!',
      };

      const data = {
        type: 'test',
        timestamp: new Date().toISOString(),
        action: 'open_home',
      };

      await FCMService.sendToUser(userId, notification, data);
      console.log('Test notification gönderildi:', userId);
    } catch (error) {
      console.error('Test notification gönderilemedi:', error);
      throw error;
    }
  }

  /**
   * Tüm kullanıcılara test notification gönder
   */
  async sendTestNotificationToAllUsers(): Promise<void> {
    try {
      const usersSnapshot = await firestore()
        .collection('users')
        .where('fcmToken', '!=', null)
        .limit(10) // Test için sadece 10 kullanıcı
        .get();

      const notifications = usersSnapshot.docs.map(doc => {
        const userData = doc.data();
        return FCMService.sendToUser(doc.id, {
          title: 'Genel Test Bildirimi 📢',
          body: 'PetLovee uygulamasından test bildirimi!',
        }, {
          type: 'announcement',
          timestamp: new Date().toISOString(),
        });
      });

      await Promise.all(notifications);
      console.log(`${usersSnapshot.docs.length} kullanıcıya test notification gönderildi`);
    } catch (error) {
      console.error('Toplu test notification gönderilemedi:', error);
      throw error;
    }
  }

  /**
   * Beğeni test notification'ı gönder
   */
  async sendTestLikeNotification(recipientUserId: string): Promise<void> {
    try {
      await FCMService.sendLikeNotification(
        recipientUserId,
        'Test Kullanıcısı',
        'test-post-id'
      );
      console.log('Test beğeni notification gönderildi:', recipientUserId);
    } catch (error) {
      console.error('Test beğeni notification gönderilemedi:', error);
      throw error;
    }
  }

  /**
   * Yorum test notification'ı gönder
   */
  async sendTestCommentNotification(recipientUserId: string): Promise<void> {
    try {
      await FCMService.sendCommentNotification(
        recipientUserId,
        'Test Kullanıcısı',
        'test-post-id',
        'Bu harika bir gönderi! 🐾'
      );
      console.log('Test yorum notification gönderildi:', recipientUserId);
    } catch (error) {
      console.error('Test yorum notification gönderilemedi:', error);
      throw error;
    }
  }

  /**
   * Takip test notification'ı gönder
   */
  async sendTestFollowNotification(recipientUserId: string): Promise<void> {
    try {
      await FCMService.sendFollowNotification(
        recipientUserId,
        'Test Kullanıcısı'
      );
      console.log('Test takip notification gönderildi:', recipientUserId);
    } catch (error) {
      console.error('Test takip notification gönderilemedi:', error);
      throw error;
    }
  }

  /**
   * Mesaj test notification'ı gönder
   */
  async sendTestMessageNotification(recipientUserId: string): Promise<void> {
    try {
      await FCMService.sendMessageNotification(
        recipientUserId,
        'Test Kullanıcısı',
        'Merhaba! Bu bir test mesajıdır. 🐕',
        'test-chat-id'
      );
      console.log('Test mesaj notification gönderildi:', recipientUserId);
    } catch (error) {
      console.error('Test mesaj notification gönderilemedi:', error);
      throw error;
    }
  }

  /**
   * Pet hatırlatma test notification'ı gönder
   */
  async sendTestPetReminderNotification(userId: string): Promise<void> {
    try {
      await FCMService.sendPetReminderNotification(
        userId,
        'Buddy',
        'Yemek Zamanı',
        '14:00'
      );
      console.log('Test pet hatırlatma notification gönderildi:', userId);
    } catch (error) {
      console.error('Test pet hatırlatma notification gönderilemedi:', error);
      throw error;
    }
  }

  /**
   * FCM token'ı test et
   */
  async testFCMToken(token: string): Promise<boolean> {
    try {
      const isValid = await FCMService.validateToken(token);
      console.log('FCM Token test sonucu:', isValid ? 'Geçerli' : 'Geçersiz');
      return isValid;
    } catch (error) {
      console.error('FCM Token test edilemedi:', error);
      return false;
    }
  }

  /**
   * Kullanıcının FCM token'ını al ve test et
   */
  async testUserFCMToken(userId: string): Promise<boolean> {
    try {
      const userDoc = await firestore()
        .collection('users')
        .doc(userId)
        .get();

      if (!userDoc.exists) {
        console.error('Kullanıcı bulunamadı:', userId);
        return false;
      }

      const userData = userDoc.data();
      const fcmToken = userData?.fcmToken;

      if (!fcmToken) {
        console.error('Kullanıcı için FCM token bulunamadı:', userId);
        return false;
      }

      return await this.testFCMToken(fcmToken);
    } catch (error) {
      console.error('Kullanıcı FCM token test edilemedi:', error);
      return false;
    }
  }

  /**
   * Notification istatistiklerini al
   */
  async getNotificationStats(): Promise<{
    totalUsers: number;
    usersWithFCMToken: number;
    recentNotifications: number;
  }> {
    try {
      // Toplam kullanıcı sayısı
      const totalUsersSnapshot = await firestore()
        .collection('users')
        .get();

      // FCM token'ı olan kullanıcı sayısı
      const usersWithTokenSnapshot = await firestore()
        .collection('users')
        .where('fcmToken', '!=', null)
        .get();

      // Son 24 saatteki notification sayısı
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const recentNotificationsSnapshot = await firestore()
        .collection('notifications')
        .where('createdAt', '>=', yesterday.toISOString())
        .get();

      return {
        totalUsers: totalUsersSnapshot.size,
        usersWithFCMToken: usersWithTokenSnapshot.size,
        recentNotifications: recentNotificationsSnapshot.size,
      };
    } catch (error) {
      console.error('Notification istatistikleri alınamadı:', error);
      return {
        totalUsers: 0,
        usersWithFCMToken: 0,
        recentNotifications: 0,
      };
    }
  }
}

export default new TestNotificationService();
