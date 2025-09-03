import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import TestNotificationService from '@/services/testNotificationService';
import { firestore } from '@/firebase.config';

interface NotificationStats {
  totalUsers: number;
  usersWithFCMToken: number;
  recentNotifications: number;
}

export default function TestNotificationsScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [fcmTokenStatus, setFcmTokenStatus] = useState<boolean | null>(null);

  useEffect(() => {
    loadStats();
    if (user) {
      testUserFCMToken();
    }
  }, [user]);

  const loadStats = async () => {
    try {
      const notificationStats = await TestNotificationService.getNotificationStats();
      setStats(notificationStats);
    } catch (error) {
      console.error('İstatistikler yüklenemedi:', error);
    }
  };

  const testUserFCMToken = async () => {
    if (!user) return;
    
    try {
      const isValid = await TestNotificationService.testUserFCMToken(user.uid);
      setFcmTokenStatus(isValid);
    } catch (error) {
      console.error('FCM token test edilemedi:', error);
      setFcmTokenStatus(false);
    }
  };

  const handleTestNotification = async (type: string) => {
    if (!user) {
      Alert.alert('Hata', 'Kullanıcı giriş yapmamış');
      return;
    }

    setLoading(true);
    try {
      switch (type) {
        case 'basic':
          await TestNotificationService.sendTestNotification(user.uid);
          break;
        case 'like':
          await TestNotificationService.sendTestLikeNotification(user.uid);
          break;
        case 'comment':
          await TestNotificationService.sendTestCommentNotification(user.uid);
          break;
        case 'follow':
          await TestNotificationService.sendTestFollowNotification(user.uid);
          break;
        case 'message':
          await TestNotificationService.sendTestMessageNotification(user.uid);
          break;
        case 'reminder':
          await TestNotificationService.sendTestPetReminderNotification(user.uid);
          break;
        case 'all':
          await TestNotificationService.sendTestNotificationToAllUsers();
          break;
      }
      
      Alert.alert('Başarılı', `${type} test notification gönderildi!`);
      await loadStats(); // İstatistikleri yenile
    } catch (error) {
      Alert.alert('Hata', `Test notification gönderilemedi: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const getFCMTokenStatusText = () => {
    if (fcmTokenStatus === null) return 'Test ediliyor...';
    return fcmTokenStatus ? '✅ Geçerli' : '❌ Geçersiz';
  };

  const getFCMTokenStatusColor = () => {
    if (fcmTokenStatus === null) return '#666';
    return fcmTokenStatus ? '#4CAF50' : '#F44336';
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Push Notification Test</Text>
        <Text style={styles.subtitle}>FCM entegrasyonunu test edin</Text>
      </View>

      {/* FCM Token Durumu */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>FCM Token Durumu</Text>
        <View style={styles.statusContainer}>
          <Text style={[styles.statusText, { color: getFCMTokenStatusColor() }]}>
            {getFCMTokenStatusText()}
          </Text>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={testUserFCMToken}
            disabled={loading}
          >
            <Text style={styles.refreshButtonText}>Yenile</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* İstatistikler */}
      {stats && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>İstatistikler</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.totalUsers}</Text>
              <Text style={styles.statLabel}>Toplam Kullanıcı</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.usersWithFCMToken}</Text>
              <Text style={styles.statLabel}>FCM Token'ı Olan</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.recentNotifications}</Text>
              <Text style={styles.statLabel}>Son 24 Saat</Text>
            </View>
          </View>
        </View>
      )}

      {/* Test Butonları */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Test Notification'ları</Text>
        
        <TouchableOpacity
          style={[styles.testButton, styles.primaryButton]}
          onPress={() => handleTestNotification('basic')}
          disabled={loading}
        >
          <Text style={styles.buttonText}>🧪 Temel Test</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.testButton, styles.likeButton]}
          onPress={() => handleTestNotification('like')}
          disabled={loading}
        >
          <Text style={styles.buttonText}>❤️ Beğeni Testi</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.testButton, styles.commentButton]}
          onPress={() => handleTestNotification('comment')}
          disabled={loading}
        >
          <Text style={styles.buttonText}>💬 Yorum Testi</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.testButton, styles.followButton]}
          onPress={() => handleTestNotification('follow')}
          disabled={loading}
        >
          <Text style={styles.buttonText}>👥 Takip Testi</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.testButton, styles.messageButton]}
          onPress={() => handleTestNotification('message')}
          disabled={loading}
        >
          <Text style={styles.buttonText}>💌 Mesaj Testi</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.testButton, styles.reminderButton]}
          onPress={() => handleTestNotification('reminder')}
          disabled={loading}
        >
          <Text style={styles.buttonText}>🐾 Hatırlatma Testi</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.testButton, styles.announcementButton]}
          onPress={() => handleTestNotification('all')}
          disabled={loading}
        >
          <Text style={styles.buttonText}>📢 Genel Duyuru Testi</Text>
        </TouchableOpacity>
      </View>

      {/* Loading Indicator */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B6B" />
          <Text style={styles.loadingText}>Test notification gönderiliyor...</Text>
        </View>
      )}

      {/* Bilgi */}
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>ℹ️ Bilgi</Text>
        <Text style={styles.infoText}>
          • Test notification'ları sadece giriş yapmış kullanıcılara gönderilir
        </Text>
        <Text style={styles.infoText}>
          • FCM token'ı olmayan kullanıcılara notification gönderilmez
        </Text>
        <Text style={styles.infoText}>
          • Bu sayfa sadece development/test amaçlıdır
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#FF6B6B',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    textAlign: 'center',
    marginTop: 5,
    opacity: 0.9,
  },
  section: {
    backgroundColor: 'white',
    margin: 15,
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  refreshButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  refreshButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B6B',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  testButton: {
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#FF6B6B',
  },
  likeButton: {
    backgroundColor: '#E91E63',
  },
  commentButton: {
    backgroundColor: '#2196F3',
  },
  followButton: {
    backgroundColor: '#4CAF50',
  },
  messageButton: {
    backgroundColor: '#9C27B0',
  },
  reminderButton: {
    backgroundColor: '#FF9800',
  },
  announcementButton: {
    backgroundColor: '#607D8B',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
  },
  infoSection: {
    backgroundColor: 'white',
    margin: 15,
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    lineHeight: 20,
  },
});
