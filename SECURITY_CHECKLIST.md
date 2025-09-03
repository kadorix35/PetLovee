# Firebase Güvenlik Kontrol Listesi - PetLovee

## ✅ Tamamlanan Kontroller

### Konfigürasyon
- [x] Firebase konfigürasyon dosyası kontrol edildi
- [x] google-services.json dosyası doğrulandı
- [x] Proje ID'leri eşleşiyor
- [x] Google Sign-In web client ID güncellendi

### Servis Dosyaları
- [x] AuthService güvenlik kontrolleri
- [x] DatabaseService Firestore kullanımı
- [x] StorageService dosya yükleme güvenliği

## 🔒 Uygulanması Gereken Güvenlik Kuralları

### Firestore Rules
1. **Firebase Console'a gidin**: https://console.firebase.google.com/
2. **Projenizi seçin**: `petlove-app-2ef62`
3. **Firestore Database** → **Rules** sekmesine gidin
4. **Aşağıdaki kuralları yapıştırın**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Kullanıcılar koleksiyonu - sadece kendi verilerini okuyabilir/yazabilir
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Pet profilleri - herkes okuyabilir, sadece sahibi yazabilir
    match /pets/{petId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == resource.data.ownerId;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.ownerId;
    }
    
    // Gönderiler - herkes okuyabilir, sadece sahibi yazabilir
    match /posts/{postId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.petId;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.petId;
      
      // Yorumlar alt koleksiyonu
      match /comments/{commentId} {
        allow read: if request.auth != null;
        allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
        allow update, delete: if request.auth != null && request.auth.uid == resource.data.userId;
      }
    }
    
    // Takip ilişkileri - sadece kendi takip verilerini yönetebilir
    match /follows/{followId} {
      allow read: if request.auth != null && 
        (request.auth.uid == resource.data.followerId || request.auth.uid == resource.data.followedId);
      allow create: if request.auth != null && request.auth.uid == request.resource.data.followerId;
      allow delete: if request.auth != null && request.auth.uid == resource.data.followerId;
    }
    
    // Beğeniler - sadece kendi beğenilerini yönetebilir
    match /likes/{likeId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
      allow delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // Genel güvenlik - diğer tüm belgeler için erişimi reddet
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### Storage Rules
1. **Storage** → **Rules** sekmesine gidin
2. **Aşağıdaki kuralları yapıştırın**:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // Kullanıcı dosyaları - sadece kendi dosyalarına erişim
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Pet profil fotoğrafları
    match /users/{userId}/pets/{petId}/profile/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Post medyaları
    match /users/{userId}/posts/{postId}/media/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Genel güvenlik - diğer tüm dosyalar için erişimi reddet
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

## ⚠️ Güvenlik Uyarıları

### Kritik
- [ ] **Test modundan çıkın**: Production'da test modunu kapatın
- [ ] **API anahtarlarını güvenli tutun**: Environment variables kullanın
- [ ] **Güvenlik kurallarını test edin**: Firebase Emulator ile test edin

### Önerilen
- [ ] **Rate limiting**: Çok fazla istek için sınırlama ekleyin
- [ ] **Data validation**: Sunucu tarafında veri doğrulama
- [ ] **Audit logging**: Güvenlik olaylarını loglayın

## 🧪 Test Senaryoları

### Firestore Rules Test
```bash
# Firebase CLI ile test
firebase emulators:start --only firestore
firebase emulators:exec --only firestore "npm test"
```

### Manuel Test
1. **Authentication**: Kayıt ol/giriş yap
2. **Pet CRUD**: Pet oluştur/güncelle/sil
3. **Post CRUD**: Post oluştur/güncelle/sil
4. **Follow/Unfollow**: Takip etme/bırakma
5. **Like/Unlike**: Beğeni işlemleri
6. **Comment**: Yorum ekleme/silme

## 📞 Destek

Sorun yaşarsanız:
1. Firebase Console'da hata loglarını kontrol edin
2. `npx react-native log-android` ile uygulama loglarını inceleyin
3. Firebase Emulator ile yerel test yapın
