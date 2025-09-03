import messaging from '@react-native-firebase/messaging';
import { Platform, Alert, Linking } from 'react-native';
import { firestore } from '@/firebase.config';
import { auth } from '@/firebase.config';

export interface NotificationData {
  title: string;
  body: string;
  data?: { [key: string]: string };
  type?: 'like' | 'comment' | 'follow' | 'message' | 'reminder' | 'general';
}

class NotificationService {
  private fcmToken: string | null = null;

  // FCM token'ı al
  async getFCMToken(): Promise<string | null> {
    try {
      const token = await messaging().getToken();
      this.fcmToken = token;
      console.log('FCM Token:', token);
      return token;
    } catch (error) {
      console.error('FCM Token alınamadı:', error);
      return null;
    }
  }

  // Kullanıcının FCM token'ını Firestore'a kaydet
  async saveFCMTokenToFirestore(userId: string): Promise<void> {
    try {
      const token = await this.getFCMToken();
      if (token) {
        await firestore()
          .collection('users')
          .doc(userId)
          .update({
            fcmToken: token,
            lastTokenUpdate: new Date().toISOString(),
          });
        console.log('FCM Token Firestore\'a kaydedildi');
      }
    } catch (error) {
      console.error('FCM Token kaydedilemedi:', error);
    }
  }

  // Notification izinlerini iste
  async requestPermission(): Promise<boolean> {
    try {
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('Notification izni verildi:', authStatus);
        return true;
      } else {
        console.log('Notification izni reddedildi:', authStatus);
        return false;
      }
    } catch (error) {
      console.error('Notification izni alınamadı:', error);
      return false;
    }
  }

  // Notification handler'ları kur
  setupNotificationHandlers(): void {
    // Foreground mesajları
    messaging().onMessage(async (remoteMessage) => {
      console.log('Foreground mesaj alındı:', remoteMessage);
      
      // Foreground'da notification göster
      if (remoteMessage.notification) {
        Alert.alert(
          remoteMessage.notification.title || 'Bildirim',
          remoteMessage.notification.body || '',
          [
            { text: 'Tamam', style: 'default' },
            {
              text: 'Görüntüle',
              onPress: () => this.handleNotificationPress(remoteMessage),
            },
          ]
        );
      }
    });

    // Background/Quit state mesajları
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('Background mesaj alındı:', remoteMessage);
    });

    // Notification'a tıklama
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('Notification\'a tıklandı:', remoteMessage);
      this.handleNotificationPress(remoteMessage);
    });

    // Uygulama kapalıyken notification'a tıklama
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('Uygulama kapalıyken notification\'a tıklandı:', remoteMessage);
          this.handleNotificationPress(remoteMessage);
        }
      });
  }

  // Notification'a tıklama işlemi
  private handleNotificationPress(remoteMessage: any): void {
    const { data } = remoteMessage;
    
    if (data) {
      switch (data.type) {
        case 'like':
          // Beğeni sayfasına git
          this.navigateToScreen('post', { postId: data.postId });
          break;
        case 'comment':
          // Yorum sayfasına git
          this.navigateToScreen('post', { postId: data.postId });
          break;
        case 'follow':
          // Profil sayfasına git
          this.navigateToScreen('profile', { userId: data.userId });
          break;
        case 'message':
          // Mesaj sayfasına git
          this.navigateToScreen('messages', { chatId: data.chatId });
          break;
        case 'reminder':
          // Hatırlatma sayfasına git
          this.navigateToScreen('reminders');
          break;
        default:
          // Ana sayfaya git
          this.navigateToScreen('home');
      }
    }
  }

  // Ekran navigasyonu
  private navigateToScreen(screen: string, params?: any): void {
    // Bu fonksiyon navigation context'i ile entegre edilecek
    console.log(`Navigating to ${screen}:`, params);
  }

  // Topic'e subscribe ol
  async subscribeToTopic(topic: string): Promise<void> {
    try {
      await messaging().subscribeToTopic(topic);
      console.log(`Topic'e subscribe olundu: ${topic}`);
    } catch (error) {
      console.error(`Topic'e subscribe olunamadı: ${topic}`, error);
    }
  }

  // Topic'ten unsubscribe ol
  async unsubscribeFromTopic(topic: string): Promise<void> {
    try {
      await messaging().unsubscribeFromTopic(topic);
      console.log(`Topic'ten unsubscribe olundu: ${topic}`);
    } catch (error) {
      console.error(`Topic'ten unsubscribe olunamadı: ${topic}`, error);
    }
  }

  // Kullanıcıya notification gönder (admin için)
  async sendNotificationToUser(
    userId: string,
    notification: NotificationData
  ): Promise<void> {
    try {
      const userDoc = await firestore().collection('users').doc(userId).get();
      const userData = userDoc.data();
      
      if (userData?.fcmToken) {
        // Firestore'a notification kaydı ekle
        await firestore().collection('notifications').add({
          userId,
          title: notification.title,
          body: notification.body,
          data: notification.data,
          type: notification.type,
          read: false,
          createdAt: new Date().toISOString(),
        });
        
        console.log('Notification gönderildi:', userId);
      }
    } catch (error) {
      console.error('Notification gönderilemedi:', error);
    }
  }

  // FCM token'ı güncelle
  async updateFCMToken(userId: string): Promise<void> {
    try {
      const token = await this.getFCMToken();
      if (token) {
        await firestore()
          .collection('users')
          .doc(userId)
          .update({
            fcmToken: token,
            lastTokenUpdate: new Date().toISOString(),
          });
        console.log('FCM Token güncellendi:', userId);
      }
    } catch (error) {
      console.error('FCM Token güncellenemedi:', error);
    }
  }

  // FCM token'ı sil
  async removeFCMToken(userId: string): Promise<void> {
    try {
      await firestore()
        .collection('users')
        .doc(userId)
        .update({
          fcmToken: firestore.FieldValue.delete(),
          lastTokenUpdate: firestore.FieldValue.delete(),
        });
      console.log('FCM Token silindi:', userId);
    } catch (error) {
      console.error('FCM Token silinemedi:', error);
    }
  }

  // Notification'ları işaretle
  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      await firestore()
        .collection('notifications')
        .doc(notificationId)
        .update({ read: true, readAt: new Date().toISOString() });
    } catch (error) {
      console.error('Notification işaretlenemedi:', error);
    }
  }

  // Kullanıcının notification'larını getir
  async getUserNotifications(userId: string): Promise<any[]> {
    try {
      const snapshot = await firestore()
        .collection('notifications')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('Notification\'lar getirilemedi:', error);
      return [];
    }
  }

  // Notification servisini başlat
  async initialize(): Promise<void> {
    try {
      // İzin iste
      const hasPermission = await this.requestPermission();
      
      if (hasPermission) {
        // Token al ve kaydet
        const currentUser = auth().currentUser;
        if (currentUser) {
          await this.saveFCMTokenToFirestore(currentUser.uid);
        }
        
        // Handler'ları kur
        this.setupNotificationHandlers();
        
        console.log('Notification servisi başlatıldı');
      }
    } catch (error) {
      console.error('Notification servisi başlatılamadı:', error);
    }
  }
}

export default new NotificationService();
