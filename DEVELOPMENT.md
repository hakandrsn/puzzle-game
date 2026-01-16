# Puzzle Game - Geliştirme Dokümantasyonu

## 📋 Proje Özeti

React Native (Expo) ile geliştirilmiş, chapter-level bazlı bir **Sliding Tile Puzzle** oyunu. Virtual splitting tekniği kullanılarak görseller fiziksel olarak bölünmeden puzzle parçaları oluşturulur.

## 🎯 Temel Özellikler

### Oyun Mekaniği
- **Virtual Splitting**: Görseller fiziksel olarak bölünmez, tek görsel üzerinden maskeleme yapılır
- **Çözülebilir Shuffle**: Her zaman çözülebilir puzzle garantisi (geriye doğru hamle simülasyonu)
- **Progresif Zorluk**: 
  - Seviye 1-8: 3×3 grid (50 shuffle hamlesi)
  - Seviye 9-16: 4×4 grid (100 shuffle hamlesi)
  - Seviye 17-24: 5×5 grid (150 shuffle hamlesi)

### İçerik
- **20 Kategori** × **24 Seviye** = **480 Toplam Seviye**
- Her kategori farklı tema ve renk paleti
- Her seviye için unique görsel

### İlerleme Sistemi
- Yıldız sistemi (1-3 yıldız, performansa göre)
- Chapter unlock sistemi
- Level unlock sistemi (sıralı açılma)
- Son oynanan level kaydı

### Hamle Sistemi
- Varsayılan: **10 hamle hakkı**
- Her chapter bitiminde: **+5 bonus hamle**
- Rewarded reklam izleyerek: **+3 hamle hakkı**

### Reklam Sistemi (AdMob)
- **Interstitial**: Level geçişlerinde gösterilir
- **Rewarded**: Hamle almak için izlenir
- Test ID'leri ile geliştirme desteği
- Expo Go'da conditional loading (native modül yoksa no-op)

## 🏗️ Mimari Yapı

### Dizin Yapısı

```
puzzle-game/
├── app/                          # Expo Router ekranları
│   ├── _layout.tsx              # Root layout (splash, device ID, ads init)
│   ├── index.tsx                # Start ekranı (Devam Et + Bölümler)
│   ├── chapters.tsx             # Kategori listesi
│   ├── levels/[chapterId].tsx   # Seviye listesi
│   └── game/[chapterId]/[levelId].tsx  # Oyun ekranı
├── src/
│   ├── components/
│   │   ├── Tile.tsx             # Puzzle parçası (virtual splitting)
│   │   ├── PuzzleBoard.tsx      # Oyun tahtası
│   │   ├── WinModal.tsx         # Kazanma modalı
│   │   └── DevPanel.tsx         # Development paneli
│   ├── hooks/
│   │   └── usePuzzleGame.ts     # Oyun mantığı hook'u
│   ├── store/
│   │   ├── gameStore.ts         # Aktif oyun state'i (Zustand)
│   │   ├── progressStore.ts     # İlerleme state'i (Zustand + AsyncStorage)
│   │   └── hintStore.ts         # Hamle hakkı state'i (Zustand + AsyncStorage)
│   ├── services/
│   │   ├── deviceService.ts     # Device ID alma
│   │   └── adManager.ts         # AdMob yönetimi (conditional)
│   ├── utils/
│   │   └── puzzleLogic.ts       # Puzzle algoritmaları
│   ├── types/
│   │   └── index.ts             # TypeScript tipleri
│   └── constants/
│       └── gameConfig.ts         # Oyun konfigürasyonu
├── app.json                      # Expo config
├── package.json
└── tsconfig.json
```

## 🎨 UI/UX Tasarım

### Renk Paleti (Minimalist Dark Theme)

```typescript
background: '#0a0a0f'      // Ana arka plan
surface: '#12121a'         // Kart arka planı
surfaceLight: '#1e1e2d'    // Hover/active durumlar
primary: '#8b5cf6'         // Mor (ana renk)
accent: '#06b6d4'          // Cyan (vurgu)
```

### Responsive Tasarım

- **Phone** (<768px): 2 sütun grid, 360px max board
- **Tablet** (≥768px): 3 sütun grid, 480px max board
- **Desktop** (≥1024px): 4 sütun grid, 480px max board

### Animasyonlar

- Tile hareketleri: `withTiming` (120ms, bounce yok)
- Modal açılışları: `FadeIn` + `SlideInDown`
- Sayfa geçişleri: Expo Router slide animation

## 🔧 Teknik Detaylar

### State Management (Zustand)

#### gameStore
- Aktif oyun durumu
- Grid state, boş slot, hamle sayısı
- Çözüm kontrolü

#### progressStore
- Kullanıcı ilerlemesi (AsyncStorage ile persist)
- Unlocked chapters/levels
- Tamamlanan level'ler ve yıldızlar
- Son oynanan level

#### hintStore
- Hamle hakkı sayısı (AsyncStorage ile persist)
- Chapter bonus sistemi
- Reklam reward sistemi

### Virtual Splitting Tekniği

```typescript
// Her tile için görsel offset hesaplama
const imageOffset = {
  top: -(rowIndex * tileSize),
  left: -(colIndex * tileSize),
};

// Container overflow: hidden ile maskeleme
<View style={{ overflow: 'hidden' }}>
  <Image style={{ position: 'absolute', ...imageOffset }} />
</View>
```

### Shuffle Algoritması

1. Çözülmüş grid ile başla: `[0, 1, 2, ..., n-1]`
2. X adet geçerli rastgele hamle simüle et
3. Bu yöntem her zaman çözülebilir puzzle garantiler

### Device ID Sistemi

- `expo-application` ile unique device ID
- Android: `getAndroidId()`
- iOS: `getIosIdForVendorAsync()`
- Web: Fallback ID
- İlk açılışta loglanır

### AdMob Entegrasyonu

#### Conditional Loading
- Expo Go'da native modül yoksa no-op fonksiyonlar
- Try-catch ile güvenli yükleme
- Production build'de normal çalışır

#### Reklam Tipleri
- **Interstitial**: Level geçişlerinde
- **Rewarded**: Hamle almak için
- Test ID'leri: `TestIds.INTERSTITIAL`, `TestIds.REWARDED`

## 📱 Ekranlar

### 1. Start Screen (`app/index.tsx`)
- Logo ve başlık
- **Devam Et** butonu (son kaldığı level)
- **Bölümler** butonu
- Yıldız ve hamle hakkı göstergesi
- İlerleme barı

### 2. Chapters Screen (`app/chapters.tsx`)
- Grid layout (responsive)
- Her chapter için:
  - Thumbnail görsel
  - Chapter numarası badge
  - İlerleme barı
  - Yıldız sayısı
- Lock overlay (unlocked değilse)

### 3. Levels Screen (`app/levels/[chapterId].tsx`)
- Chapter header (thumbnail + istatistikler)
- Level grid (responsive)
- Her level için:
  - Level numarası
  - Grid boyutu
  - Yıldızlar (tamamlandıysa)
- Lock icon (unlocked değilse)

### 4. Game Screen (`app/game/[chapterId]/[levelId].tsx`)
- Header:
  - Hedef görsel (küçük preview)
  - Hamle sayısı
  - Level badge
- Puzzle board (responsive)
- Alt butonlar:
  - Yeniden Başlat
  - Hamle Al (reklam ile)
- Win Modal (çözüldüğünde)

## 🛠️ Development Tools

### Dev Panel
- Sağ altta kırmızı 🛠 butonu
- Level'e git (bölüm + level seçimi)
- Puzzle'ı çöz (instant win)
- +10 hamle hakkı ekle

**Aktif/Pasif**: `app/_layout.tsx` içinde `__DEV_MODE__` değişkeni

## 📦 Bağımlılıklar

### Core
- `expo`: ~54.0.31
- `expo-router`: ~6.0.21
- `react-native`: 0.81.5
- `react`: 19.1.0

### State & Storage
- `zustand`: ^5.0.10
- `@react-native-async-storage/async-storage`: 2.2.0

### Animasyon
- `react-native-reanimated`: ~4.1.1

### Görsel
- `expo-image`: ~3.0.11

### Reklam
- `react-native-google-mobile-ads`: (conditional)

### Utility
- `expo-application`: Device ID için
- `expo-splash-screen`: Splash screen kontrolü

## 🔐 Storage Keys

```typescript
USER_PROGRESS: '@puzzle_game_progress'
HINT_COUNT: '@puzzle_game_hints'
LAST_PLAYED: '@puzzle_game_last_played'
DEVICE_ID: '@puzzle_game_device_id'
```

## 🎮 Oyun Akışı

1. **Uygulama Açılışı**
   - Device ID al ve logla
   - Progress ve hints yükle
   - AdMob initialize (varsa)

2. **Start Screen**
   - Devam Et → Son oynanan level
   - Bölümler → Chapter listesi

3. **Chapter Selection**
   - Unlocked chapter'lar seçilebilir
   - Her chapter için progress gösterilir

4. **Level Selection**
   - Sıralı unlock (önceki level tamamlanmalı)
   - Tamamlanan level'ler yıldızlı gösterilir

5. **Oyun**
   - Tile'lara dokunarak hareket ettir
   - Hamle sayısı takip edilir
   - Çözüldüğünde:
     - Yıldız hesaplanır
     - Progress kaydedilir
     - Interstitial reklam gösterilir
     - Chapter bonus verilir (son level ise)

6. **Hamle Al**
   - Rewarded reklam izle
   - +3 hamle hakkı kazan

## 🚀 Çalıştırma

### Development
```bash
npm start
# veya
npx expo start
```

### Platform Specific
```bash
npm run android
npm run ios
npm run web
```

### Cache Temizleme
```bash
npm run reset
# veya
npx expo start --clear
```

## ⚠️ Önemli Notlar

### Expo Go Limitation
- AdMob native modülü Expo Go'da çalışmaz
- Conditional loading ile uygulama çalışır ama reklamlar gösterilmez
- Production build için `npx expo prebuild` gerekir (kullanıcı istemiyor)

### Production Build
- AdMob için native build gerekli
- `app.json` içinde AdMob App ID'leri yapılandırılmalı
- Test ID'leri production'da değiştirilmeli

### Performance
- Tile animasyonları optimize edildi (memo, withTiming)
- Board boyutu responsive (tablet/phone)
- Image lazy loading (expo-image)

## 📝 Gelecek Geliştirmeler

- [ ] Backend entegrasyonu (device ID ile kullanıcı takibi)
- [ ] Leaderboard sistemi
- [ ] Daily challenges
- [ ] Power-ups (shuffle, hint, etc.)
- [ ] Custom image upload
- [ ] Social sharing
- [ ] Achievement sistemi

## 🐛 Bilinen Sorunlar

- Expo Go'da AdMob çalışmaz (beklenen davranış)
- Web platform'da bazı native özellikler sınırlı

## 📄 Lisans

MIT

---

**Son Güncelleme**: 2024
**Versiyon**: 1.0.0
