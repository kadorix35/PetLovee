# Workload Identity Federation Kurulum Rehberi

Bu dokümantasyon PetLovee projesi için Workload Identity Federation kurulumunu açıklar.

## ✅ Tamamlanan Adımlar

### 1. Google Cloud Console Ayarları
- [x] Workload Identity Pool oluşturuldu: `petlove-pool`
- [x] GitHub Provider eklendi: `github-provider`
- [x] Attribute mapping yapılandırıldı
- [x] Attribute condition ayarlandı: `assertion.repository == "kadorix35/PetLovee"`

### 2. Service Account Ayarları
- [x] Mevcut service account kullanıldı: `firebase-adminsdk-fbsvc@petlove-app-2ef62.iam.gserviceaccount.com`
- [x] Workload Identity User rolü eklendi
- [x] Gerekli Firebase rolleri mevcut

### 3. GitHub Ayarları
- [x] Repository secrets eklendi:
  - `WORKLOAD_IDENTITY_PROVIDER`
  - `SERVICE_ACCOUNT`
  - `GOOGLE_CLOUD_PROJECT`

### 4. Kod Değişiklikleri
- [x] GitHub Actions workflow oluşturuldu: `.github/workflows/deploy.yml`
- [x] Service account key dosyası kaldırıldı (güvenlik riski ortadan kaldırıldı)
- [x] `.gitignore` güncellendi (service account key'leri engellendi)

## 🔧 Konfigürasyon Detayları

### Workload Identity Provider
```
projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/petlove-pool/providers/github-provider
```

### Service Account
```
firebase-adminsdk-fbsvc@petlove-app-2ef62.iam.gserviceaccount.com
```

### GitHub Repository
```
kadorix35/PetLovee
```

## 🚀 Kullanım

### CI/CD Pipeline
GitHub Actions workflow'u şu durumlarda çalışır:
- `main` branch'e push yapıldığında
- Pull request oluşturulduğunda

### Güvenlik Avantajları
- ✅ Service account key'leri artık repository'de yok
- ✅ Kimlik doğrulama GitHub Actions üzerinden yapılıyor
- ✅ Sadece belirtilen repository'den erişim mümkün
- ✅ Geçici token'lar kullanılıyor

## 🔍 Test Etme

### 1. GitHub Actions Test
```bash
# Repository'ye push yapın
git add .
git commit -m "Test workload identity"
git push origin main
```

### 2. GitHub Actions Sayfasında Kontrol
1. GitHub repository'sinde **"Actions"** sekmesine gidin
2. Workflow'un başarıyla çalıştığını kontrol edin
3. Hata varsa log'ları inceleyin

## 🛠️ Sorun Giderme

### Yaygın Hatalar

#### 1. "Permission denied" Hatası
- Service account'a Workload Identity User rolü verildiğinden emin olun
- Principal formatını kontrol edin

#### 2. "Invalid provider" Hatası
- Workload Identity Provider URL'sini kontrol edin
- PROJECT_NUMBER'ın doğru olduğundan emin olun

#### 3. "Repository not found" Hatası
- GitHub repository adını kontrol edin
- Attribute condition'da doğru repository adı kullanıldığından emin olun

## 📚 Kaynaklar

- [Google Cloud Workload Identity Federation](https://cloud.google.com/iam/docs/workload-identity-federation)
- [GitHub Actions Google Cloud Auth](https://github.com/google-github-actions/auth)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)

## 🔒 Güvenlik Notları

- Service account key dosyaları artık repository'de bulunmuyor
- Tüm kimlik doğrulama GitHub Actions üzerinden yapılıyor
- Sadece belirtilen repository'den erişim mümkün
- Geçici token'lar kullanılıyor, kalıcı key'ler yok

## 📞 Destek

Herhangi bir sorun yaşarsanız:
1. GitHub Actions log'larını kontrol edin
2. Google Cloud Console'da IAM ayarlarını kontrol edin
3. Bu dokümantasyonu tekrar gözden geçirin
