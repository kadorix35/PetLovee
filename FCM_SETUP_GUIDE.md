# FCM (Firebase Cloud Messaging) Kurulum Rehberi

## 📋 Genel Bakış

Bu rehber, PetLovee uygulamasında FCM push notification sisteminin nasıl kurulacağını ve kullanılacağını açıklar.

## 🔧 Kurulum Adımları

### 1. Environment Variables Ayarlama

1. `env.example` dosyasını `.env` olarak kopyalayın:
   ```bash
   cp env.example .env
   ```

2. `.env` dosyasında `FCM_SERVER_KEY` alanını doldurun:
   ```env
   FCM_SERVER_KEY=eyJ0eXBlIjoic2VydmljZV9hY2NvdW50IiwicHJvamVjdF9pZCI6InBldGxvdmUtYXBwLTJlZjYyIiwicHJpdmF0ZV9rZXlfaWQiOiJiNmE3YWEwY2Y0MGU0ZmUyYmFlYWMyNTEzOGJhNmI5YWY3YzViNTA0IiwicHJpdmF0ZV9rZXkiOiItLS0tLUJFR0lOIFBSSVZBVEUgS0VZLS0tLS1cbk1JSUV2UUlCQURBTkJna3Foa2lHOXcwQkFRRUZBQVNDQktjd2dnU2pBZ0VBQW9JQkFRRERBQU80OVRhNno1Q3doXG5hczE1aGVJcHlEOGdmVlhKc2lva3g2Z2ZuR0NiYW48ejlyR3B2NUFWYTFkdzkzMHJKakNNRkI2WmFGdThLTFxuVmIvM0UveXh6VzdoVWFWamZOSGNjaFNFZ1dOQmh0aUVSellcL1lBdzBnZ3ZqOGhITG1nWmdRWTJiNHo2RDVkMDhcbW96aStVblwvSDdHczdrdCsraXlBY0ZkRVlkUXV6UDMrWnJBWndTalVPSUE3bTNDVUE5R2F4bEVtNElaTVFpcmh5XG45KzY2VU9ka0F0Rm92anM3MVZPK0VIZkQ1dkhBT0lWZHV4NlVKMElBcGgzY2JWaEV2VDV6RUxqR1NaYTJwdGNoXG5zdFMzTzN0TURCM1ZaWkNIU2ZvWXFmZjNVSHhRU3lXTGFKaXhESnFEdldBOFIrempwK2kzb3FDM3VXaFFZMzRWFm5icE1IOFpBZ01CQUFFQ2dnRUFCRUY1QlwvQlE4YlZTblJUOGhpbnhCaWxrZ1VlbzBpaEpJTnhtcGFiTEJOT1Ncbk42eHhDaHMwVTBxYk9XWDcralVkXC9tcEQ3anZicnBiZndKdlZ5Qm1BVHZCWDByZXR5ZWlzT1FCSUJqTUNYYUtcbjRTRDNpNU9IZ2ZHSTZrNjk1a3ZKTXRpdWp2bHlpaUYwaUJxaG1DVWhoTUVRZVRSMVlxRDZSZG9LMlUxckZYVVxuY2pKSG9iMjlYSUZUNXFxa2tBQlFIUzRyRlRmQTdEY2hNUW5EcXVSVDR2eVBMYmhxdHg4VXBEWUdiSWVvQjg3VFx5MWNGUHVxYWl1ZzR2NWQ4V1wvMGEzdzNhRjRUbEpXamh6NlwvQW1LdzdacU9lWVIrR0NxRVVJMllZcCtGMFMwRlpBXG5YSHM1aFVDQURGXC9obVg1QjFKWWRPaXZ4dG5nZzI0a0NpdnhpMURLNVVRK0JnUURnZU80WTFoU0x0QmJhS1RCMlxuWU1JdkVOK3BXOG13YWlURDZ0ZHUxc0pHY0Y5b0Mxa1JrSjlFSzdoNFRYcmRsWjViN2M0dVdkdDhIZnZvYWJyVFx5YWZMb3NpcjMxdk1Fd0N0VGtvNGFDWDlhckxhZExzXC9rV213RU9EZ3I3WDVXVEFhQjhmd0V1THVMcDRaQWM1UFx1RFFpOGJFd0k1dExtZFUyRHppQnVnb1BWaVFLQmdRRGErSkFUN2FcL2hiWGtXN1ZweFRYNDA0bU5PMHRlc3NwdkJCb0RjUmQ0SDlUeEZMUlhJNzh2YnhOTU9HbDUyUTFmWHdZVzVMY1pKalM5OER6TnZVdmI5aXFDUlIxODBUZHhVb2UzT1FmMVRLSjlFS3RsQWsxZGdpZVRXV2JENlBXVXN2blwvTnFyRStcL1Z2TlMrbkRzSGI4Vkg4UThOK0o4ZFxuK0hZSHRxR0pFUUtnQkNvWVEzNUEwMEdEbGkxXC9QK2xUSjljdnNPSFBwcmtBanJoMjE4T2ZYbnRiSTJrZGg2eDFcbGxJaHlNbnZNKzllRjhWYUg5XC94Vk9ZWERFYlI1NzJFOGZjMW9UMzE3dTNqZnEyYlVvYktHUldtS2t0UElYRHlEXG5obFpRT1wvdXV0ODkwM0VKbFp5Y3NRNFlyRTliWXNkbTk5Z2R2djZxRHJ0VXM5a1piMVdTQUNzUkFvR0JBQmpXXG5iS0ZkdFM5cmN1TnBRMGtUWWFIYVpTU0JTTzBGNms3SkpvdllacUZZQkI3QjdXeXRjakNoa2tCeUI2NW81ejVRUG5laWRTc2VuT3VPd1RxSkhDSytRQmo1UWpcL3lBUGxud3lRNWM2ZStQQjh0eEpTXC9pZ3hxcjRza3M1NDZDdGxEbGJUTFp5SEhhdWFEVGtxOFJWNkkrNTNjTXQrZm5jejR3d2JjR3JsMHFhUkFvR0FONjQ5empWR2lwbHFzaXN3ZFB2aldceGhxTU1CaDcwYkEzNVBCSDU3emRIU05OaUdzWFljQXlhWlFUUjdEWnNDVVwvQ3Z2Z1V3c2FUZGJrY1wvWWZNNGkwXG52bFpCQVdZQnlGYVwvVVJURTBUbFwvVEZ4elNlRFwvMmdFM2gxWnhpTm1oRlJuWFpNQ2YyTHpKNlJ6WGk3RHRaYWFKXG45R0lvZWlRaTZJSjE2N3VUZ0Z6dGo2MD1cbi0tLS0tLUVORCBQUklWQVRFIEtFWS0tLS0tXG4iLCJjbGllbnRfZW1haWwiOiJmaXJlYmFzZS1hZG1pbnNkay1mYnN2Y0BwZXRsb3ZlLWFwcC0yZWY2Mi5pYW0uZ3NlcnZpY2VhY2NvdW50LmNvbSIsImNsaWVudF9pZCI6IjExNjE5NTU0ODM5MzAxNjQ2MDExOSIsImF1dGhfdXJpIjoiaHR0cHM6XC9cL2FjY291bnRzLmdvb2dsZS5jb21cL29cL29hdXRoMlwvYXV0aCIsInRva2VuX3VyaSI6Imh0dHBzOlwvXC9vYXV0aDIuZ29vZ2xlYXBpcy5jb21cL3Rva2VuIiwiYXV0aF9wcm92aWRlcl94NTA5X2NlcnRfdXJsIjoiaHR0cHM6XC9cL3d3dy5nb29nbGVhcGlzLmNvbVwvb2F1dGgyXC92MVwvY2VydHMiLCJjbGllbnRfeDUwOV9jZXJ0X3VybCI6Imh0dHBzOlwvXC93d3cuZ29vZ2xlYXBpcy5jb21cL3JvYm90XC92MVwvbWV0YWRhdGFcL3g1MDlcL2ZpcmViYXNlLWFkbWluc2RrLWZic3ZjJTQwcGV0bG92ZS1hcHAtMmVmNjIuaWFtLmdzZXJ2aWNlYWNjb3VudC5jb20iLCJ1bml2ZXJzZV9kb21haW4iOiJnb29nbGVhcGlzLmNvbSJ9
   ```

### 2. Dependencies Yükleme

```bash
npm install firebase-admin
```

### 3. Firebase Console Ayarları

1. [Firebase Console](https://console.firebase.google.com/) → Projenizi seçin
2. **Cloud Messaging** → **API'leri etkinleştirin**
3. **Service Account** oluşturun (JSON key indirin)
4. JSON key'i base64 encode edin ve environment variable'a ekleyin

## 🚀 Kullanım

### Frontend'de FCM Token Alma

```typescript
import NotificationService from '@/services/notificationService';

// FCM token'ı al
const token = await NotificationService.getFCMToken();

// Token'ı Firestore'a kaydet
await NotificationService.saveFCMTokenToFirestore(userId);
```

### Backend'de Push Notification Gönderme

```typescript
import FCMService from '@/services/fcmService';

// Tek kullanıcıya notification gönder
await FCMService.sendToUser(userId, {
  title: 'Yeni Beğeni! ❤️',
  body: 'Gönderinizi beğendi',
}, {
  type: 'like',
  postId: 'post-123'
});

// Beğeni notification'ı gönder
await FCMService.sendLikeNotification(
  recipientUserId,
  'Ahmet Yılmaz',
  'post-123'
);

// Yorum notification'ı gönder
await FCMService.sendCommentNotification(
  recipientUserId,
  'Ayşe Demir',
  'post-123',
  'Harika bir fotoğraf!'
);
```

### Test Notification Gönderme

```typescript
import TestNotificationService from '@/services/testNotificationService';

// Test notification gönder
await TestNotificationService.sendTestNotification(userId);

// Beğeni test notification'ı gönder
await TestNotificationService.sendTestLikeNotification(userId);
```

## 📱 Test Sayfası

Uygulamada `/test-notifications` sayfasına giderek:
- FCM token durumunu kontrol edebilirsiniz
- Farklı türde test notification'ları gönderebilirsiniz
- İstatistikleri görüntüleyebilirsiniz

## 🔧 Notification Türleri

### 1. Beğeni Notification'ı
```typescript
await FCMService.sendLikeNotification(userId, likerName, postId);
```

### 2. Yorum Notification'ı
```typescript
await FCMService.sendCommentNotification(userId, commenterName, postId, commentText);
```

### 3. Takip Notification'ı
```typescript
await FCMService.sendFollowNotification(userId, followerName);
```

### 4. Mesaj Notification'ı
```typescript
await FCMService.sendMessageNotification(userId, senderName, messageText, chatId);
```

### 5. Pet Hatırlatma Notification'ı
```typescript
await FCMService.sendPetReminderNotification(userId, petName, reminderType, reminderTime);
```

### 6. Genel Duyuru
```typescript
await FCMService.sendAnnouncementNotification(title, body, data);
```

## 🛡️ Güvenlik

1. **FCM Server Key'i asla public repository'ye commit etmeyin**
2. **Environment variables kullanın**
3. **Production'da farklı service account'lar oluşturun**
4. **Key'leri düzenli olarak rotate edin**

## 🐛 Sorun Giderme

### FCM Token Alınamıyor
- Firebase projesinin doğru yapılandırıldığından emin olun
- `google-services.json` dosyasının doğru konumda olduğunu kontrol edin
- Uygulama izinlerini kontrol edin

### Notification Gönderilmiyor
- FCM token'ının geçerli olduğunu kontrol edin
- Firebase Console'da Cloud Messaging API'sinin etkin olduğunu kontrol edin
- Service account key'inin doğru olduğunu kontrol edin

### Test Notification'ları Çalışmıyor
- Kullanıcının giriş yapmış olduğundan emin olun
- FCM token'ının Firestore'da kayıtlı olduğunu kontrol edin
- Test sayfasındaki istatistikleri kontrol edin

## 📊 Monitoring

Firebase Console'da:
- **Cloud Messaging** → **Reports** bölümünden notification istatistiklerini görüntüleyebilirsiniz
- **Authentication** → **Users** bölümünden kullanıcı FCM token'larını kontrol edebilirsiniz

## 🔄 Güncelleme

FCM token'ları otomatik olarak güncellenir:
- Kullanıcı giriş yaptığında
- Uygulama başlatıldığında
- Token yenilendiğinde

## 📝 Notlar

- FCM token'ları cihaza özeldir ve uygulama yeniden yüklendiğinde değişebilir
- Background'da notification almak için uygulama izinlerini kontrol edin
- iOS'ta notification'lar için ek izinler gerekebilir
