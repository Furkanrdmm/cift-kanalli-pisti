# Çift Kanallı Pişti — Geliştirme Notları

> Oyuncular için tanıtım sayfası: [README.md](README.md). Sürüm geçmişi: [DEGISIKLIKLER.md](DEGISIKLIKLER.md). Bu dosya kurallar, kararlar ve kod yapısı için.


Normal piştiden türetilmiş, kendi kurallarımızla oynanan kart oyunu. Telefondan arkadaşlarla ve bilgisayara karşı oynanabilen bir mobil web oyunu (PWA) olarak geliştiriliyor.

## Nasıl çalıştırılır

```bash
npm install     # ilk seferde bir kez
npm run dev     # geliştirme sunucusu → tarayıcıda http://localhost:5173
npm run build   # yayına hazır sürüm → dist/ klasörü
```

Telefondan denemek için: `npm run dev -- --host` çalıştır, çıkan `Network:` adresini aynı Wi-Fi'deki telefonun tarayıcısında aç.

## Android (Google Play)

- Uygulama web oyununu [Capacitor](https://capacitorjs.com) ile Android'e sarar (`android/` klasörü, `capacitor.config.ts`). Kimlik `com.nekank.ciftkanallipisti`.
- **Play paketi (AAB):** `derle.ps1` çalıştırılır (web derlemesi, `cap sync`, `gradlew bundleRelease -Pandroid.overridePathCheck=true`; bu ek klasör adındaki Türkçe harfler yüzünden gerekli). Çıktı: `android/app/build/outputs/bundle/release/cift_kanalli_pistiV<sürüm>.aab`.
- **İmza:** Nekank yükleme anahtarı. `android/key.properties` (git dışında) `C:UserserdemDocumentsNekankimza` klasörünü gösterir. Play App Signing açık.
- **Sürüm:** Her Play yüklemesinde `android/app/build.gradle` içindeki `versionCode` bir artırılır, `versionName` de güncellenir.
- Mağaza yazıları, görseller ve form cevapları: `magaza/`.
- Eski APK dağıtımı (GitHub Releases, `com.furkanrdmm` kimliği ve `../imza-anahtari/pisti.p12`) kapatıldı. Eski APK'yı kuranlar silip Play'den kurar.
- **Uygulama simgesi ve açılış ekranı:** kaynağı `assets/build-icons.mjs`. Değiştirdikten sonra: `node assets/build-icons.mjs && npx capacitor-assets generate --android --iconBackgroundColor "#1f6b3a" --splashBackgroundColor "#3e2210"`

---

## Oyun kuralları

Kurallar normal pişti ile aynıdır; aşağıdakiler farklıdır.

### Açılış
1. Yere **2 açık kart** yan yana konur → bunlara **pişti kanalları** denir.
2. Yanına **1 kapalı**, üstüne **1 açık** kart konur → burası **normal alan** (normal piştideki orta).
3. Yere açılan 4 karttan (kapalı dahil) **3'ü aynı olamaz.** Olursa kartlar yeniden karılır.
4. 2 oyuncuya **4'er kart** dağıtılır. Eller bitince deste bitene kadar yeniden 4'er dağıtılır.
5. Oyuna **ilk kart dağıtılan oyuncu** başlar.

### Pişti kanalları
- Kanala **sadece pişti yapılabilir**: kanaldaki kartla aynı kart atılır (3'e 3, valeye vale). Kanala başka kart atılamaz; vale de kanaldaki kartı **almaz**, sadece valeyle pişti olur.
- İki kanaldan birine pişti yapılınca o kanal **boş kalır**. Diğerine de pişti yapılana kadar oraya kart atılmaz.
- Oyuncular her turda kanala (pişti yapabiliyorsa) veya normal alana, istediği yere oynar.
- **Kanaldaki kartın eşi sadece kanala oynanabilir:** elde kanaldaki kartla aynı kart varsa (ör. kanalda 2♣, elde 2♦) o kart normal yere atılamaz, yerin üstünde de 2 olsa yeri alamaz, sadece kanala pişti yapar. O kartı oynamak zorunlu değil. Tek kanal kaldığında da geçerli. Vale için de aynı.
- İstisna: yer boşsa (`mustFill`) boş yere atma zorunluluğu öne geçer, o kart da yere atılır.

### Kanallar bitince: iki normal yer
- İki kanal da pişti olunca kanalların yeri **ikinci bir normal yer** olur (kodda `piles[1]`, ekranda "2. Yer"). Asıl yer "1. Yer".
- **Sıradaki oyuncu bu yeni yere kart atmak zorundadır** (başka yere oynayamaz, herhangi bir kart olabilir).
- Bundan sonra iki yerden istediğine oynanır; ikisinde de normal pişti kuralları geçerli (aynı kart / vale ile alma, tek kartta pişti).
- Bu aşamada **hangi yer boşalırsa boşalsın** sıradaki oyuncu oraya kart atmak zorundadır. Yer boş kalamaz.
- *Düzeltme (2026-09-23):* İlk sürümde kanalların bitince "tek pişti kanalına" düştüğü yazılmıştı. Bu yanlıştı, kural yukarıdaki gibi düzeltildi.

### Normal alan
- Normal pişti gibi: aynı kartla veya **vale** ile yerdeki tüm kartlar alınır.
- Yerde tek kart varken aynı kartla alınırsa **pişti**.
- Yer alınıp **boş kalırsa** sıradaki oyuncu **mecburen yere kart atar**, kanala pişti yapamaz. Bu kural oyunun başından sonuna geçerli (kodda `mustFill`).
- *Düzeltme (2026-09-23):* Önceden bu zorunluluk sadece kanallar bittikten sonra uygulanıyordu. Abim fark etti, düzeltildi.

### Puanlama (normal pişti ile aynı)
| | Puan |
|---|---|
| Pişti (kanalda veya normal alanda) | 10 |
| Vale ile vale piştisi | 20 |
| En çok kart toplayan (eşitlikte kimse) | 3 |
| Sinek 2 (♣2) | 2 |
| Karo 10 (♦10) | 3 |
| Her as | 1 |
| Her vale | 1 |

- Oyun sonunda yerlerde kalan bütün kartlar (iki yer ve kanallar dahil) **en son kart alan** oyuncuya gider.
- 52 kart bitince puanlar sayılır, en çok puanı alan **o oyunu kazanır**.
- Maç: başta seçilir. **1, 3 veya 5 oyun** alan kazanır. Her oyunda başlayan oyuncu değişir.

### 3 ve 4 kişilik oyun
- Kurallar aynı; her elde herkese 4 kart. 52 − 4 = 48 kart: 2 kişide 6 el, 3 kişide 4 el, 4 kişide 3 el.
- **4 kişi eşli** (`teams: [[0,2],[1,3]]`): karşılıklı oturanlar takım. Kartlar, piştiler ve "en çok kart" takım olarak sayılır (`score()` taraf başına hesaplar).
- **Tekli:** herkes kendine.
- Sıra saat yönünün tersine: senden sonra sağdaki oynar. Ekranda rakipler üstte, sıradaki en sağda.
- Diğer oyuncular bilgisayar.



---

## Verilen kararlar

- **Platform:** Android'de Google Play (Nekank stüdyosu); iPhone ve bilgisayarda tarayıcıdan açılan web sürümü (PWA).
- **Teknoloji:** React + TypeScript + Vite.
- **Online yok (13 Kasım 2026):** Firebase ile yapılmış online bölümü Play öncesi kaldırıldı; oyun tek kişilik (bilgisayara karşı), internet izni yok, veri toplamaz. Eski kod git geçmişinde.
- **Reklam yok** (stüdyo kararı).
- **Görünüm:** Kahvehane masası: çuha, ahşap çerçeve. Yumuşak ve tatlı: yuvarlak yazı tipleri (başlık/sayı: Fredoka, metin: Nunito; `@fontsource-variable` ile uygulamaya gömülü, internetsiz çalışır), hap düğmeler, yuvarlak kartlar.
- **Oyuncu sayısı:** 2, 3 veya 4 kişi. 4 kişide eşli ya da tekli seçilir.
- **Bilgisayara karşı oynama:** Var.

## Kod yapısı

Her dosyada tek parça vardır; klasörler işe göre ayrılır.

| Klasör / dosya | Ne yapar |
|---|---|
| `src/App.tsx` | Ana menü, ekranlar arası geçiş, telefonun geri tuşu |
| `src/game/` | Kurallar: `engine.ts` (dağıtım, hamleler, pişti, kanallar, puan), `bot.ts` (bilgisayar rakibi), `players.ts` (oyuncu ve takım adları) |
| `src/storage/` | Telefona kaydedilenler: `save.ts` (yarım maç), `settings.ts` (ayarlar), `stats.ts` (istatistik) |
| `src/effects/` | `sound.ts` (Web Audio ile üretilen sesler), `haptics.ts` (titreşim), `flyers.ts` (uçan kart süre ve konum hesapları) |
| `src/screens/` | Ekranlar: `Game.tsx` (oyun masası), `HowToPlay.tsx` (kurallar), `SettingsPanel.tsx` (ayarlar; oyun içinde pencere), `StatsScreen.tsx` (istatistik) |
| `src/components/` | Parçalar: `PlayingCard` (kart), `FlyLayer` (uçan kart katmanı), `PlayerInfo` (oyuncu kutusu), `ResultModal` (puan tablosu), `ConfirmDialog` (emin misin penceresi), `Icon` (çizilmiş simgeler), `Toggle` (aç/kapa), `StatTile` (istatistik kutusu), `InstallHint` (iPhone ana ekran ipucu) |
| `src/index.css` | Bütün görünüm (masa, kartlar, animasyonlar) |
| `android/`, `capacitor.config.ts` | Android uygulaması |
| `public/` | Web sürümünün simgeleri ve ana ekrana ekleme ayarı |
| `.github/workflows/pages.yml` | Web sürümünü her push'ta GitHub Pages'e koyar (iPhone ve tarayıcı) |
| `assets/` | Uygulama simgesi ve açılış ekranı kaynakları |
| `magaza/` | Play mağaza yazıları, ekran görüntüleri, kapak görseli (`kapak-gorseli.html` ile üretilir) |

## Yapılacaklar

- [x] Oyun motoru ve kurallar
- [x] Bilgisayara karşı oynama
- [x] Kahvehane masası görünümü
- [x] "Nasıl Oynanır?" ekranı (ana menüden)
- [x] Yarım kalan maçı kaydetme, menüde "Oyuna Devam Et"
- [x] ~~Arkadaşla online oynama~~ (Play öncesi kaldırıldı)
- [x] Web sürümü (GitHub Pages) ve ana ekrana eklenebilir uygulama (PWA): iPhone için
- [ ] Çevrimdışı çalışma (service worker)
- [x] Animasyonlar: kart dağıtma, kart atma, yeri alma, son atılan kartın parlaması
- [x] Kartı sürükleyip bırakarak oynama (dokunarak oynama da duruyor)
- [x] Ses efektleri (telefonda üretilir), titreşim, ayarlar (ses, seviye, titreşim, oyun hızı)
- [ ] Abimin ses kaydı ("Piştiii!", "Vale piştisi!")
- [x] İstatistikler (maç, oyun, pişti, vale piştisi, en yüksek puan, galibiyet serisi) ve oyuncu adı
- [x] Görünüm: masa rengi (yeşil/bordo/lacivert), kart arkası (bordo/lacivert/yeşil/siyah)
- [ ] Müzik
- [x] 3–4 kişilik oyun (4 kişide eşli/tekli)
- [x] Android: Play paketi (AAB), Nekank imzası
- [ ] Google Play kapalı test ve yayın
- [x] Uygulama simgesi ve açılış ekranı
- [x] İnternette yayınlama: https://furkanrdmm.github.io/cift-kanalli-pisti/

## Açık sorular

- *(Cevaplandı)* 3–4 kişide kurallar aynı, 4 kişide eşli ve tekli ikisi de var.
