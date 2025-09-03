# Firebase Kurulum Rehberi - PetLovee

## 1. Firebase Projesi Oluşturma

### Adım 1: Firebase Console'a Giriş
1. [Firebase Console](https://console.firebase.google.com/) adresine gidin
2. Google hesabınızla oturum açın
3. "Proje Ekle" butonuna tıklayın

### Adım 2: Proje Ayarları
- **Proje Adı**: `PetLovee` (veya istediğiniz isim)
- **Google Analytics**: İsteğe bağlı (şimdilik devre dışı bırakabilirsiniz)
- "Proje Oluştur" butonuna tıklayın

## 2. Android Uygulaması Ekleme

### Adım 1: Android Uygulaması Kaydetme
1. Firebase Console'da projenizi açın (`petlove-app-2ef62`)
2. Sol menüden "Proje Ayarları" (⚙️) → "Genel" sekmesi
3. "Uygulamalarınız" bölümünde "Android" simgesine tıklayın
4. **Android paket adı**: `com.petlove.app` (app.json'daki package değeri)
5. **Uygulama takma adı**: `PetLovee Android`
6. **SHA-1 sertifika parmak izi**: (şimdilik boş bırakabilirsiniz)
7. "Uygulamayı Kaydet" butonuna tıklayın

### Adım 2: google-services.json İndirme
1. İndirilen `google-services.json` dosyasını projenizin `android/app/` klasörüne kopyalayın
2. Dosya yapısı şöyle olmalı:
   ```
   android/
   └── app/
       └── google-services.json
   ```

### Adım 3: Expo Development Build
Expo projelerinde Firebase entegrasyonu için Development Build kullanmanız gerekiyor:

1. **Development Build oluşturun:**
   ```bash
   npx eas build --platform android --profile development
   ```

2. **Build tamamlandıktan sonra APK'yı indirin ve yükleyin**

3. **Expo Go yerine Development Build kullanın**

## 3. iOS Uygulaması Ekleme

### Adım 1: iOS Uygulaması Kaydetme
1. Firebase Console'da "iOS" simgesine tıklayın
2. **iOS paket kimliği**: `com.petlovee.app`
3. **Uygulama takma adı**: `PetLovee iOS`
4. **App Store ID**: (şimdilik boş bırakabilirsiniz)
5. "Uygulamayı Kaydet" butonuna tıklayın

### Adım 2: GoogleService-Info.plist İndirme
1. İndirilen `GoogleService-Info.plist` dosyasını projenizin `ios/` klasörüne kopyalayın
2. Xcode'da projenizi açın
3. `GoogleService-Info.plist` dosyasını Xcode projesine sürükleyip bırakın
4. "Copy items if needed" seçeneğini işaretleyin

## 4. Firebase Servislerini Etkinleştirme

### Authentication
1. Firebase Console'da sol menüden "Authentication" → "Başlat"
2. "Oturum Açma Yöntemleri" sekmesinde:
   - **E-posta/Şifre**: Etkinleştirin
   - **Google**: Etkinleştirin (isteğe bağlı)
   - **Facebook**: Etkinleştirin (isteğe bağlı)

### Firestore Database
1. Sol menüden "Firestore Database" → "Veritabanı Oluştur"
2. **Güvenlik kuralları**: "Test modunda başlat" seçin (geliştirme için)
3. **Konum**: `eur3 (europe-west)` seçin (Türkiye'ye en yakın)

### Storage
1. Sol menüden "Storage" → "Başlat"
2. **Güvenlik kuralları**: "Test modunda başlat" seçin
3. **Konum**: Firestore ile aynı konumu seçin

## 5. Firebase Konfigürasyon Dosyasını Güncelleme

`firebase.config.ts` dosyasındaki değerleri Firebase Console'dan alın:

1. Firebase Console'da "Proje Ayarları" → "Genel" sekmesi
2. "Uygulamalarınız" bölümünde uygulamanızı seçin
3. "SDK kurulumu ve yapılandırması" bölümünden değerleri kopyalayın

```typescript
const firebaseConfig = {
  apiKey: "AIzaSyC2CA33lwjTcrffnJjOyJ3ULrMkaD90t6w",
  authDomain: "petlove-app-2ef62.firebaseapp.com",
  projectId: "petlove-app-2ef62",
  storageBucket: "petlove-app-2ef62.firebasestorage.app",
  messagingSenderId: "458534082610",
  appId: "1:458534082610:web:1e424a03eee47118b0c42b",
  measurementId: "G-G4XCVG8C7T"
};
```

## 6. Ek Paketler (İsteğe Bağlı)

### Google Sign-In için:
```bash
npm install @react-native-google-signin/google-signin
```

### Facebook Login için:
```bash
npm install react-native-fbsdk-next
```

## 7. Güvenlik Kuralları (Production için)

### Firestore Rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Kullanıcılar sadece kendi verilerini okuyabilir/yazabilir
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Pet profilleri herkes okuyabilir, sadece sahibi yazabilir
    match /pets/{petId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == resource.data.ownerId;
    }
    
    // Postlar herkes okuyabilir, sadece sahibi yazabilir
    match /posts/{postId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == resource.data.petId;
    }
  }
}
```

### Storage Rules:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 8. Test Etme

1. Uygulamayı çalıştırın: `npm run android` veya `npm run ios`
2. Kayıt ol/Giriş yap fonksiyonlarını test edin
3. Firebase Console'da "Authentication" → "Kullanıcılar" sekmesinde kullanıcıları görebilirsiniz

## 9. Production Deployment

### EAS Build ile:
```bash
# Development build
eas build --platform android --profile development

# Production build
eas build --platform android --profile production
```

### App Store/Play Store'a yükleme:
```bash
# iOS App Store
eas submit --platform ios

# Google Play Store
eas submit --platform android
```

## Sorun Giderme

### Yaygın Hatalar:
1. **"Firebase not initialized"**: Konfigürasyon dosyasını kontrol edin
2. **"Permission denied"**: Firestore güvenlik kurallarını kontrol edin
3. **"Network error"**: İnternet bağlantısını kontrol edin

### Log Kontrolü:
```bash
# Android
npx react-native log-android

# iOS
npx react-native log-ios
```

Bu rehberi takip ederek Firebase entegrasyonunuzu tamamlayabilirsiniz!
