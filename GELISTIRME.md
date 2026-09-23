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

## Android APK

- **İndirme linki (hep son sürüm):** https://github.com/Furkanrdmm/cift-kanalli-pisti/releases/latest/download/cift-kanalli-pisti.apk
- `main` dalına her push'ta (sadece `.md` dosyaları değiştiyse hariç) GitHub Actions APK'yı otomatik derler ve **Son Sürüm** olarak yayınlar (`.github/workflows/android.yml`). Derleme ~5 dakika sürer.
- Uygulama web oyununu [Capacitor](https://capacitorjs.com) ile Android'e sarar (`android/` klasörü, `capacitor.config.ts`).
- **İmza anahtarı** depoda değil: `../imza-anahtari/` klasöründe ve GitHub secrets'ta (`ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`). Kaybolursa telefonlardaki uygulama güncellenemez, silip yeniden kurmak gerekir.
- Telefona kurarken "bilinmeyen kaynaklara izin ver" ve Play Protect uyarısı çıkabilir: "Yine de yükle".
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
- Diğer oyuncular şimdilik bilgisayar (online gelince arkadaşlar).



---

## Verilen kararlar

- **Platform:** Telefonda tarayıcıdan açılan web oyunu (PWA). Mağaza gerekmez, link ile paylaşılır, ana ekrana eklenebilir. Sonradan gerçek uygulamaya çevrilebilir.
- **Teknoloji:** React + TypeScript + Vite.
- **Online:** Firebase (ücretsiz, sunucu yok). Oda kodu ile arkadaş davet edilecek. *(henüz yapılmadı)*
- **Görünüm:** Kahvehane masası: çuha, ahşap çerçeve. Yumuşak ve tatlı: yuvarlak yazı tipleri (başlık/sayı: Fredoka, metin: Nunito; `@fontsource-variable` ile uygulamaya gömülü, internetsiz çalışır), hap düğmeler, yuvarlak kartlar.
- **Oyuncu sayısı:** 2, 3 veya 4 kişi. 4 kişide eşli ya da tekli seçilir.
- **Bilgisayara karşı oynama:** Var.

## Kod yapısı

| Dosya | Ne yapar |
|---|---|
| `src/game/engine.ts` | Oyun kuralları: dağıtım, geçerli hamleler, pişti, kanallar, puanlama |
| `src/game/players.ts` | Oyuncu/takım isimleri (Sen, Ortağın, Rakip…) |
| `src/game/save.ts` | Yarım kalan maçı telefona kaydetme (Oyuna Devam Et) |
| `src/game/bot.ts` | Bilgisayar rakibi (çıkan kartları sayar, rakibe pişti fırsatı vermemeye çalışır) |
| `src/components/Game.tsx` | Oyun ekranı: masa, eller, sıra, sonuç penceresi |
| `src/components/PlayingCard.tsx` | İskambil kartı görünümü |
| `src/components/flyers.tsx` | Uçan kart animasyonları (dağıtma, atma, toplama); süreler oyun hızına göre (`timings()`) |
| `src/game/sound.ts` | Sesler: kart atma, oturma, toplama, dağıtma, pişti / kanal piştisi / vale piştisi, kazanma. Dosya yok, Web Audio ile üretilir |
| `src/game/haptics.ts` | Titreşim (Capacitor Haptics) |
| `src/game/settings.ts` | Ayarlar: ad, masa rengi, kart arkası, ses, ses seviyesi, titreşim, oyun hızı (telefona kaydedilir) |
| `src/components/SettingsPanel.tsx` | Ayarlar ekranı (menüden) ve oyun içi ayarlar penceresi (⚙): ad, masa rengi, kart arkası, ses, titreşim, hız |
| `src/game/stats.ts`, `src/components/StatsScreen.tsx` | İstatistikler (telefona kaydedilir) ve istatistik ekranı |
| `src/App.tsx` | Ana menü |
| `src/components/HowToPlay.tsx` | "Nasıl Oynanır?" ekranı (kurallar ve puanlar) |
| `src/index.css` | Tüm görünüm (masa, kartlar, animasyonlar) |
| `android/`, `capacitor.config.ts` | Android uygulaması |
| `.github/workflows/android.yml` | APK otomatik derleme |
| `.github/workflows/pages.yml` | Web sürümünü her push'ta GitHub Pages'e koyar (iPhone ve tarayıcı) |
| `public/manifest.webmanifest`, `public/icons/` | Ana ekrana ekleme (PWA) ayarları ve simgeleri |
| `src/components/InstallHint.tsx` | iPhone Safari'de "Ana Ekrana Ekle" ipucu |
| `assets/` | Uygulama simgesi ve açılış ekranı kaynakları |

## Yapılacaklar

- [x] Oyun motoru ve kurallar
- [x] Bilgisayara karşı oynama
- [x] Kahvehane masası görünümü
- [x] "Nasıl Oynanır?" ekranı (ana menüden)
- [x] Yarım kalan maçı kaydetme, menüde "Oyuna Devam Et"
- [ ] Arkadaşla online oynama (Firebase, oda kodu)
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
- [x] Android APK (GitHub Actions ile otomatik)
- [x] Uygulama simgesi ve açılış ekranı
- [x] İnternette yayınlama: https://furkanrdmm.github.io/cift-kanalli-pisti/

## Açık sorular

- *(Cevaplandı)* 3–4 kişide kurallar aynı, 4 kişide eşli ve tekli ikisi de var.
