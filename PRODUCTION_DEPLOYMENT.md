# Production Deployment Rehberi - PetLovee

## 🚀 Firebase Console'da Production Ayarları

### 1. Firestore Güvenlik Kuralları
1. **Firebase Console'a gidin**: https://console.firebase.google.com/
2. **Projenizi seçin**: `petlove-app-2ef62`
3. **Firestore Database** → **Rules** sekmesine gidin
4. **Test modundan çıkın** - "Test modunda başlat" seçeneğini kapatın
5. **Production kurallarını yapıştırın**:

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
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.ownerId &&
        isValidPetData(request.resource.data);
      allow update: if request.auth != null && 
        request.auth.uid == resource.data.ownerId &&
        isValidPetUpdate(request.resource.data, resource.data);
      allow delete: if request.auth != null && request.auth.uid == resource.data.ownerId;
    }
    
    // Gönderiler - herkes okuyabilir, sadece sahibi yazabilir
    match /posts/{postId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.petId &&
        isValidPostData(request.resource.data);
      allow update: if request.auth != null && 
        request.auth.uid == resource.data.petId &&
        isValidPostUpdate(request.resource.data, resource.data);
      allow delete: if request.auth != null && request.auth.uid == resource.data.petId;
      
      // Yorumlar alt koleksiyonu
      match /comments/{commentId} {
        allow read: if request.auth != null;
        allow create: if request.auth != null && 
          request.auth.uid == request.resource.data.userId &&
          isValidCommentData(request.resource.data);
        allow update: if request.auth != null && 
          request.auth.uid == resource.data.userId &&
          isValidCommentUpdate(request.resource.data, resource.data);
        allow delete: if request.auth != null && request.auth.uid == resource.data.userId;
      }
    }
    
    // Takip ilişkileri - sadece kendi takip verilerini yönetebilir
    match /follows/{followId} {
      allow read: if request.auth != null && 
        (request.auth.uid == resource.data.followerId || request.auth.uid == resource.data.followedId);
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.followerId &&
        request.resource.data.followerId != request.resource.data.followedId;
      allow delete: if request.auth != null && request.auth.uid == resource.data.followerId;
    }
    
    // Beğeniler - sadece kendi beğenilerini yönetebilir
    match /likes/{likeId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && 
        request.auth.uid == request.resource.data.userId &&
        isValidLikeData(request.resource.data);
      allow delete: if request.auth != null && request.auth.uid == resource.data.userId;
    }
    
    // Genel güvenlik - diğer tüm belgeler için erişimi reddet
    match /{document=**} {
      allow read, write: if false;
    }
  }
  
  // Veri doğrulama fonksiyonları
  function isValidPetData(data) {
    return data.keys().hasAll(['name', 'species', 'breed', 'age', 'ownerId']) &&
           data.name is string && data.name.size() > 0 && data.name.size() <= 50 &&
           data.species is string && data.species in ['dog', 'cat', 'bird', 'fish', 'other'] &&
           data.breed is string && data.breed.size() > 0 && data.breed.size() <= 100 &&
           data.age is number && data.age >= 0 && data.age <= 30 &&
           data.ownerId is string && data.ownerId.size() > 0;
  }
  
  function isValidPetUpdate(newData, existingData) {
    return newData.ownerId == existingData.ownerId &&
           isValidPetData(newData);
  }
  
  function isValidPostData(data) {
    return data.keys().hasAll(['content', 'petId', 'mediaUrls']) &&
           data.content is string && data.content.size() > 0 && data.content.size() <= 2000 &&
           data.petId is string && data.petId.size() > 0 &&
           data.mediaUrls is list && data.mediaUrls.size() <= 10;
  }
  
  function isValidPostUpdate(newData, existingData) {
    return newData.petId == existingData.petId &&
           isValidPostData(newData);
  }
  
  function isValidCommentData(data) {
    return data.keys().hasAll(['content', 'userId']) &&
           data.content is string && data.content.size() > 0 && data.content.size() <= 500 &&
           data.userId is string && data.userId.size() > 0;
  }
  
  function isValidCommentUpdate(newData, existingData) {
    return newData.userId == existingData.userId &&
           isValidCommentData(newData);
  }
  
  function isValidLikeData(data) {
    return data.keys().hasAll(['postId', 'userId']) &&
           data.postId is string && data.postId.size() > 0 &&
           data.userId is string && data.userId.size() > 0;
  }
}
```

### 2. Storage Güvenlik Kuralları
1. **Storage** → **Rules** sekmesine gidin
2. **Production kurallarını yapıştırın**:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // Kullanıcı dosyaları - sadece kendi dosyalarına erişim
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && 
        request.auth.uid == userId &&
        isValidFileType(request.resource.contentType) &&
        isValidFileSize(request.resource.size);
    }
    
    // Pet profil fotoğrafları
    match /users/{userId}/pets/{petId}/profile/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        request.auth.uid == userId &&
        isValidImageFile(request.resource.contentType) &&
        isValidFileSize(request.resource.size) &&
        isValidFileName(fileName);
    }
    
    // Post medyaları
    match /users/{userId}/posts/{postId}/media/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        request.auth.uid == userId &&
        isValidMediaFile(request.resource.contentType) &&
        isValidFileSize(request.resource.size) &&
        isValidFileName(fileName);
    }
    
    // Genel güvenlik - diğer tüm dosyalar için erişimi reddet
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
  
  // Dosya türü doğrulama fonksiyonları
  function isValidFileType(contentType) {
    return contentType in [
      'image/jpeg',
      'image/png', 
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/quicktime',
      'video/x-msvideo'
    ];
  }
  
  function isValidImageFile(contentType) {
    return contentType in [
      'image/jpeg',
      'image/png',
      'image/gif', 
      'image/webp'
    ];
  }
  
  function isValidMediaFile(contentType) {
    return contentType in [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/quicktime',
      'video/x-msvideo'
    ];
  }
  
  function isValidFileSize(size) {
    // Maksimum 10MB
    return size <= 10 * 1024 * 1024;
  }
  
  function isValidFileName(fileName) {
    // Dosya adı güvenlik kontrolü
    return fileName.matches('^[a-zA-Z0-9._-]+$') && 
           fileName.size() > 0 && 
           fileName.size() <= 255;
  }
}
```

## 🔐 Environment Variables Ayarları

### Development
```bash
# .env dosyası oluşturun (git'e eklenmemeli)
APP_ENV=development
```

### Production
```bash
# Production environment variables
APP_ENV=production
FIREBASE_API_KEY=AIzaSyC2CA33lwjTcrffnJjOyJ3ULrMkaD90t6w
FIREBASE_AUTH_DOMAIN=petlove-app-2ef62.firebaseapp.com
FIREBASE_PROJECT_ID=petlove-app-2ef62
FIREBASE_STORAGE_BUCKET=petlove-app-2ef62.firebasestorage.app
FIREBASE_MESSAGING_SENDER_ID=458534082610
FIREBASE_APP_ID=1:458534082610:web:1e424a03eee47118b0c42b
FIREBASE_MEASUREMENT_ID=G-G4XCVG8C7T
GOOGLE_WEB_CLIENT_ID=458534082610-i6v4digkbnivrnlap4bcp510lvkvsrpj.apps.googleusercontent.com
```

## 🏗️ EAS Build ile Production Deployment

### 1. EAS Build Konfigürasyonu
```bash
# EAS CLI kurulumu
npm install -g @expo/eas-cli

# EAS'a giriş yapın
eas login

# Build konfigürasyonu
eas build:configure
```

### 2. Production Build
```bash
# Android Production Build
eas build --platform android --profile production

# iOS Production Build  
eas build --platform ios --profile production
```

### 3. Store'a Yükleme
```bash
# Google Play Store
eas submit --platform android

# Apple App Store
eas submit --platform ios
```

## 🧪 Production Test Senaryoları

### Güvenlik Testleri
1. **Authentication Test**:
   - Kayıt ol/giriş yap
   - Çıkış yap
   - Şifre sıfırlama

2. **Authorization Test**:
   - Başka kullanıcının verilerine erişim denemesi
   - Yetkisiz veri değiştirme denemesi
   - Dosya yükleme yetkisi testi

3. **Data Validation Test**:
   - Geçersiz veri gönderme
   - Büyük dosya yükleme
   - Uzun metin gönderme

### Performance Testleri
1. **Load Test**: Çok sayıda kullanıcı simülasyonu
2. **Storage Test**: Büyük dosya yükleme
3. **Network Test**: Yavaş bağlantı simülasyonu

## 📊 Monitoring ve Analytics

### Firebase Analytics
- Kullanıcı davranışları
- Crash raporları
- Performance metrikleri

### Firebase Performance
- Uygulama performansı
- Network istekleri
- Render süreleri

## 🚨 Güvenlik Uyarıları

### Kritik
- ✅ Test modundan çıkıldı
- ✅ Güvenlik kuralları uygulandı
- ✅ Environment variables kullanılıyor
- ✅ Dosya türü ve boyut kontrolü

### Önerilen
- 🔄 Düzenli güvenlik güncellemeleri
- 🔄 Backup stratejisi
- 🔄 Rate limiting
- 🔄 Audit logging

## 📞 Destek

Sorun yaşarsanız:
1. Firebase Console'da hata loglarını kontrol edin
2. EAS Build loglarını inceleyin
3. Firebase Emulator ile yerel test yapın
4. Production monitoring araçlarını kullanın
