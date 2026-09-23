# Çift Kanallı Pişti — Geliştirme Notları

> Oyuncular için tanıtım sayfası: [README.md](README.md). Bu dosya kurallar, kararlar ve kod yapısı için.


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
- `main` dalına her push'ta GitHub Actions APK'yı otomatik derler ve **Son Sürüm** olarak yayınlar (`.github/workflows/android.yml`). Derleme ~5 dakika sürer.
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

### Kanallar bitince: iki normal yer
- İki kanal da pişti olunca kanalların yeri **ikinci bir normal yer** olur (kodda `piles[1]`, ekranda "2. Yer"). Asıl yer "1. Yer".
- **Sıradaki oyuncu bu yeni yere kart atmak zorundadır** (başka yere oynayamaz, herhangi bir kart olabilir).
- Bundan sonra iki yerden istediğine oynanır; ikisinde de normal pişti kuralları geçerli (aynı kart / vale ile alma, tek kartta pişti).
- Bu aşamada **hangi yer boşalırsa boşalsın** sıradaki oyuncu oraya kart atmak zorundadır. Yer boş kalamaz.
- *Düzeltme (2026-09-23):* İlk sürümde kanalların bitince "tek pişti kanalına" düştüğü yazılmıştı. Bu yanlıştı, kural yukarıdaki gibi düzeltildi.

### Normal alan
- Normal pişti gibi: aynı kartla veya **vale** ile yerdeki tüm kartlar alınır.
- Yerde tek kart varken aynı kartla alınırsa **pişti**.

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

---

## Verilen kararlar

- **Platform:** Telefonda tarayıcıdan açılan web oyunu (PWA). Mağaza gerekmez, link ile paylaşılır, ana ekrana eklenebilir. Sonradan gerçek uygulamaya çevrilebilir.
- **Teknoloji:** React + TypeScript + Vite.
- **Online:** Firebase (ücretsiz, sunucu yok). Oda kodu ile arkadaş davet edilecek. *(henüz yapılmadı)*
- **Görünüm:** Kahvehane masası: yeşil çuha, ahşap çerçeve.
- **Oyuncu sayısı:** Şimdilik 2 kişi. İleride 3–4 kişi eklenebilir (motor buna göre yazıldı).
- **Bilgisayara karşı oynama:** Var.

## Kod yapısı

| Dosya | Ne yapar |
|---|---|
| `src/game/engine.ts` | Oyun kuralları: dağıtım, geçerli hamleler, pişti, kanallar, puanlama |
| `src/game/bot.ts` | Bilgisayar rakibi (çıkan kartları sayar, rakibe pişti fırsatı vermemeye çalışır) |
| `src/components/Game.tsx` | Oyun ekranı: masa, eller, sıra, sonuç penceresi |
| `src/components/PlayingCard.tsx` | İskambil kartı görünümü |
| `src/App.tsx` | Ana menü |
| `src/components/HowToPlay.tsx` | "Nasıl Oynanır?" ekranı (kurallar ve puanlar) |
| `src/index.css` | Tüm görünüm (masa, kartlar, animasyonlar) |
| `android/`, `capacitor.config.ts` | Android uygulaması |
| `.github/workflows/android.yml` | APK otomatik derleme |
| `assets/` | Uygulama simgesi ve açılış ekranı kaynakları |

## Yapılacaklar

- [x] Oyun motoru ve kurallar
- [x] Bilgisayara karşı oynama
- [x] Kahvehane masası görünümü
- [x] "Nasıl Oynanır?" ekranı (ana menüden)
- [ ] Arkadaşla online oynama (Firebase, oda kodu)
- [ ] Ana ekrana eklenebilir uygulama (PWA simgesi, çevrimdışı çalışma)
- [ ] Kart animasyonları ve ses efektleri
- [ ] 3–4 kişilik oyun
- [x] Android APK (GitHub Actions ile otomatik)
- [x] Uygulama simgesi ve açılış ekranı
- [ ] İnternette yayınlama (arkadaşlara web linki)

## Açık sorular

- 3–4 kişide kurallar nasıl olacak? (kaçar kart dağıtılacak, eşli mi oynanacak?)
