# 🐾 PetLovee

Evcil hayvan sahipleri için modern sosyal medya uygulaması. Sevimli dostlarınızın fotoğraflarını paylaşın, diğer pet sahipleriyle bağlantı kurun ve yakındaki veteriner kliniklerini keşfedin.

## ✨ Özellikler

- 📱 **Modern UI/UX**: Gradient tasarım ve kullanıcı dostu arayüz
- 🐕 **Pet Profilleri**: Evcil hayvanlarınız için detaylı profil oluşturun
- 📸 **Sosyal Feed**: Fotoğraf ve video paylaşımı
- ❤️ **Etkileşim**: Beğeni, yorum ve takip sistemi
- 🗺️ **Harita Entegrasyonu**: Yakındaki veteriner kliniklerini bulun
- 📍 **Konum Servisleri**: GPS tabanlı özellikler
- 🔔 **Bildirimler**: Anlık güncellemeler
- 📱 **Cross-Platform**: iOS, Android ve Web desteği

## 🛠️ Teknolojiler

- **Framework**: React Native + Expo SDK 53
- **Navigation**: Expo Router (File-based routing)
- **Styling**: NativeWind (Tailwind CSS)
- **State Management**: Zustand
- **Data Fetching**: React Query
- **Maps**: React Native Maps
- **Icons**: Lucide React Native
- **Language**: TypeScript
- **Testing**: Jest + React Native Testing Library

## 📋 Gereksinimler

- Node.js >= 18.0.0
- npm >= 8.0.0
- Expo CLI
- iOS Simulator (macOS için) veya Android Emulator
- Fiziksel cihaz için Expo Go uygulaması

## 🚀 Kurulum

### 1. Projeyi Klonlayın
```bash
git clone <repository-url>
cd PetLovee
```

### 2. Bağımlılıkları Yükleyin
```bash
npm install
```

### 3. Geliştirme Sunucusunu Başlatın
```bash
npm run dev
```

### 4. Uygulamayı Çalıştırın

**Web için:**
```bash
npm run web
```

**iOS için:**
```bash
npm run ios
```

**Android için:**
```bash
npm run android
```

**Fiziksel cihaz için:**
- Expo Go uygulamasını indirin
- QR kodu tarayın

## 📱 Platform Desteği

| Platform | Destekleniyor | Notlar |
|----------|---------------|---------|
| iOS | ✅ | iOS 13+ |
| Android | ✅ | Android 6+ |
| Web | ✅ | Modern tarayıcılar |

## 🏗️ Proje Yapısı

```
PetLovee/
├── app/                    # Expo Router sayfaları
│   ├── (tabs)/            # Tab navigasyon
│   │   ├── index.tsx      # Ana sayfa (Feed)
│   │   ├── map.tsx        # Harita sayfası
│   │   └── profile/       # Profil sayfaları
│   ├── post/              # Post detay sayfaları
│   └── _layout.tsx        # Ana layout
├── components/            # Yeniden kullanılabilir bileşenler
│   ├── PetCard.tsx
│   └── VetCard.tsx
├── data/                  # Mock veriler
│   └── mockData.ts
├── hooks/                 # Custom hooks
│   └── useFrameworkReady.ts
├── types/                 # TypeScript tip tanımları
│   └── index.ts
├── assets/               # Statik dosyalar
│   └── images/
└── config/               # Konfigürasyon dosyaları
```

## 🎨 Tasarım Sistemi

### Renkler
- **Primary**: #667eea (Mavi-Mor gradient)
- **Secondary**: #764ba2 (Mor)
- **Accent**: #22c55e (Yeşil)
- **Background**: #F8FAFC (Açık gri)

### Tipografi
- **Font Family**: Inter
- **Weights**: Regular (400), SemiBold (600), Bold (700)

### Bileşenler
- Modern kartlar ve gölgeler
- Gradient header
- Rounded corners (20px)
- Soft shadows

## 🔧 Geliştirme Komutları

```bash
# Geliştirme sunucusu
npm run dev

# Platform spesifik başlatma
npm run ios
npm run android
npm run web

# Build komutları
npm run build:web
npm run build:android
npm run build:ios

# Linting ve format
npm run lint
npm run lint:fix

# Type checking
npm run type-check

# Test
npm run test
npm run test:watch

# Cache temizleme
npm run clean
```

## 📦 Ana Bağımlılıklar

### Core
- `expo`: ^53.0.0
- `react`: 19.0.0
- `react-native`: 0.79.1
- `expo-router`: ~5.0.2

### UI & Styling
- `nativewind`: ^2.0.11
- `lucide-react-native`: ^0.475.0
- `expo-linear-gradient`: ^14.1.5

### Navigation
- `@react-navigation/native`: ^7.1.17
- `@react-navigation/bottom-tabs`: ^7.2.0

### State & Data
- `zustand`: ^4.5.5
- `react-query`: ^3.39.3
- `@react-native-async-storage/async-storage`: 1.25.0

### Media & Camera
- `expo-camera`: ~16.1.5
- `expo-image-picker`: ~16.1.2
- `expo-av`: ^15.1.7

### Location & Maps
- `expo-location`: ~18.1.2
- `react-native-maps`: 1.18.0

## 🔐 İzinler

### iOS
- `NSCameraUsageDescription`: Kamera erişimi
- `NSPhotoLibraryUsageDescription`: Fotoğraf galerisi erişimi
- `NSLocationWhenInUseUsageDescription`: Konum erişimi

### Android
- `android.permission.CAMERA`
- `android.permission.READ_EXTERNAL_STORAGE`
- `android.permission.WRITE_EXTERNAL_STORAGE`
- `android.permission.ACCESS_FINE_LOCATION`
- `android.permission.ACCESS_COARSE_LOCATION`

## 🧪 Test

```bash
# Tüm testleri çalıştır
npm test

# Watch mode
npm run test:watch

# Coverage raporu
npm run test -- --coverage
```

## 📱 Build & Deploy

### EAS Build
```bash
# Development build
eas build --profile development

# Production build
eas build --profile production
```

### Web Deploy
```bash
npm run build:web
```

## 🤝 Katkıda Bulunma

1. Fork yapın
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit yapın (`git commit -m 'Add amazing feature'`)
4. Push yapın (`git push origin feature/amazing-feature`)
5. Pull Request oluşturun

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 📞 İletişim

- **Proje**: [PetLovee](https://github.com/your-username/petlovee)
- **E-posta**: contact@petlovee.com
- **Twitter**: [@PetLoveeApp](https://twitter.com/petloveeapp)

## 🙏 Teşekkürler

- [Expo](https://expo.dev/) - Harika geliştirme deneyimi
- [React Native](https://reactnative.dev/) - Cross-platform framework
- [Lucide](https://lucide.dev/) - Güzel ikonlar
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS

---

Made with ❤️ for pet lovers 🐾
