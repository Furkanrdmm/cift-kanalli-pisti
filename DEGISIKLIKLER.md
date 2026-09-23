# Değişiklik Günlüğü

Her sürüm GitHub'da otomatik APK olarak yayınlanır ("Son Sürüm #numara").
Önemli noktalarda git etiketi konur, gerekirse o sürüme dönülebilir.

---

## v1.3 — Masa düzeni (2026-09-24)

APK: Son Sürüm #18

- 3 ve 4 kişilik oyunda oyuncular masanın etrafında: sen altta, 2. oyuncu sağda, 3. karşıda, 4. solda (sıra saat yönünün tersine)
- 3-4 kişide ortada kanallar üstte, yer altta; kartlar biraz küçük
- Online bekleme odası masa şeklinde, boş koltukta **Otur**; eşlide A takımı altın, B takımı mavi
- Bilgisayarların adı oturduğu koltuğun numarası (Bilgisayar 2, 3, 4)
- Bekleme odası ve oyun her telefon boyutunda tek ekrana sığar (kayma yok)

## v1.2 — Arkadaşla online (2026-09-24)

APK: Son Sürüm #17

- Menüde **👥 Arkadaşla Online**: adını yaz, **Oda Kur** (2/3/4 kişi, eşli/tekli, kaç oyun) ya da 4 haneli kodla **Odaya Katıl**
- Bekleme odası: büyük oda kodu, **Arkadaşlarına gönder** (davet linki `?oda=1234` ile doğrudan katılma), koltuklar, takımlar
- **Otur**: bekleme odası masa gibi (1 altta, 2 sağda, 3 karşıda, 4 solda); boş koltuğa oturarak takım seçme
- 4 kişi eşlide kurucu boş koltuğa **+ Bilgisayar** ekleyebilir (arkadaşınla takım olup bilgisayarlara karşı)
- Kurucu **Oyunu Başlat** der (en az 2 kişi); boş koltuklara bilgisayar oturur
- "Nasıl Oynanır?" ekranına online bölümü
- 1 günden uzun süredir kullanılmayan odalar yeni oda kurulurken silinir
- Herkes kendini altta görür; hamleler anında karşıya gider, aynı animasyonlarla oynanır
- Bilgisayarları kurucunun telefonu oynatır; bağlantısı kopan oyuncunun yerine 15 sn sonra bilgisayar oynar ("bağlantı yok" işareti)
- Yeni oyunu / yeni maçı kurucu başlatır, diğerleri bekler
- Firebase (ücretsiz): anonim giriş, Realtime Database, güvenlik kuralları

## iPhone / web sürümü (yayınlandı, APK #15)

- Web sürümü GitHub Pages'te: https://furkanrdmm.github.io/cift-kanalli-pisti/ (her push'ta kendiliğinden güncellenir)
- iPhone'da Safari → Paylaş → "Ana Ekrana Ekle" ile uygulama gibi tam ekran açılır (simge ve manifest eklendi)
- iPhone Safari'de menüde "Uygulama gibi oyna" ipucu (kapatılabilir)
- Repo sayfasına "iPhone'da Oyna" butonu ve kurulum adımları

---

## v1.1 — Sesler, ayarlar, istatistikler, görsel yenileme (2026-09-23)

APK: Son Sürüm #13

- **İstatistikler** ekranı: oynanan/kazanılan maç ve oyun (yüzdesiyle), galibiyet serisi (şimdiki ve en iyi), en yüksek puan, toplam pişti, yerde / kanal / vale piştisi, oyun başına pişti, sıfırlama
- **Oyuncu adı**: ayarlardan yazılır, oyunda "Sen" yerine görünür
- **Masa rengi**: yeşil, bordo, lacivert çuha
- **Kart arkası**: bordo, lacivert, yeşil, siyah
- Menü altında Kurallar · İstatistik · Ayarlar
- **Görsel yenileme**: yuvarlak ve yumuşak yazı tipleri (Fredoka + Nunito, uygulamaya gömülü), daha yumuşak altın/krem tonlar, hap şeklinde düğmeler, yuvarlak kartlar ve yumuşak gölgeler, resimli kartlarda (J/Q/K) altın kutu ve takım işareti, noktalı kart arkası, çuha dokusu, bulanık arka planlı pencereler, zıplayan PİŞTİ yazısı, menüde oyun simgesi

- Sesler (dosya yok, telefonda üretilir): kart atma, yere oturma, yeri alma, dağıtma, kart seçme
- Pişti sesleri: normal pişti, kanal piştisi (çan), **vale piştisi (özel fanfar)**; vale piştisinde "VALE PİŞTİ!" yazısı
- Oyunu kazanma / kaybetme sesi
- Titreşim: kart atınca hafif, piştide, vale piştisinde üç güçlü vuruş, maçı kazanınca
- Ayarlar ekranı (menüden) ve oyun içi ayarlar (⚙): ses aç/kapa, ses seviyesi, titreşim aç/kapa, oyun hızı (Yavaş/Normal/Hızlı), sesleri dene
- Ayarlar açıkken oyun durur

---

## v1.0 — Sesler öncesi kayıt noktası (2026-09-23)

Git etiketi: `v1.0` · APK: Son Sürüm #11

Bu noktada oyun **sessiz** ama oynanış tam. Sonraki büyük adım: sesler, müzik, ayarlar.

### Oyun
- Çift kanallı pişti kuralları: 2 pişti kanalı + 1 normal yer, açılışta 4 karttan 3'ü aynı olamaz
- Kanala sadece pişti yapılır; kanaldaki kartın eşi normal yere atılamaz
- Kanallar bitince kanalların yeri 2. normal yer olur, oraya kart atmak zorunlu
- Yer boş kalırsa sıradaki oyuncu mecburen yere atar (kanala pişti yapamaz)
- Puanlama normal pişti gibi; oyun sonunda kalanlar son alana
- 1, 3 veya 5 oyunluk maç
- **2, 3 veya 4 kişi**; 4 kişide **eşli** veya tekli
- Bilgisayar rakipleri (kart sayar, rakibe pişti fırsatı vermemeye çalışır)

### Ekran
- Kahvehane masası görünümü (yeşil çuha, ahşap)
- Animasyonlar: kart dağıtma, kart atma, yeri alma, son atılan kartın parlaması, PİŞTİ yazısı
- Dokunarak veya **sürükleyip bırakarak** oynama
- "Nasıl Oynanır?" ekranı
- Yarım kalan maç kaydedilir, menüde **Oyuna Devam Et**

### Android ve yayın
- Capacitor ile Android APK, GitHub Actions ile her push'ta otomatik derleme
- Sabit imza anahtarı (güncellemeler üstüne kurulur)
- Uygulama simgesi ve açılış ekranı
- Repo sayfası (README) oyun tanıtımı ve indirme butonu

---

## Sürüm geçmişi

| APK | Tarih | Ne değişti |
|---|---|---|
| #18 | 2026-09-24 | Masa düzeni: sağ/karşı/sol oturma, masa şeklinde bekleme odası, ekrana sığma |
| #17 | 2026-09-24 | Arkadaşla online: oda kodu, 2-4 kişi, eşli, koltuk seçme, bağlantı kopunca bilgisayar |
| #16 | 2026-09-23 | README: kurulum yönlendirmesi (oyunda değişiklik yok) |
| #15 | 2026-09-23 | iPhone / web sürümü (GitHub Pages), ana ekrana ekleme |
| #14 | 2026-09-23 | README boyut düzeltmesi (oyunda değişiklik yok) |
| #13 | 2026-09-23 | Sesler, titreşim, ayarlar, istatistikler, oyuncu adı, masa/kart rengi, görsel yenileme |
| #12 | 2026-09-23 | Değişiklik günlüğü (oyunda değişiklik yok) |
| #11 | 2026-09-23 | 3 ve 4 kişilik oyun, 4 kişide eşli/tekli |
| #10 | 2026-09-23 | Kartı sürükleyip bırakarak oynama |
| #9 | 2026-09-23 | Animasyonlar: dağıtma, atma, yeri alma |
| #8 | 2026-09-23 | Kural: kanaldaki kartın eşi sadece kanala oynanabilir |
| #7 | 2026-09-23 | Kural: boş yere zorunlu kart her zaman geçerli · Oyuna Devam Et |
| #6 | 2026-09-23 | Kural düzeltmesi: kanallar bitince 2. normal yer |
| #4–5 | 2026-09-23 | Uygulama simgesi ve açılış ekranı |
| #3 | 2026-09-23 | README oyun tanıtım sayfası |
| #2 | 2026-09-23 | Android güvenli alan düzeltmesi |
| #1 | 2026-09-23 | İlk sürüm: 2 kişi, bilgisayara karşı |

## Bir sürüme geri dönmek gerekirse

```bash
git tag                 # kayıt noktalarını listele
git checkout v1.0       # o sürüme bak (değişiklik yapmadan)
git checkout main       # geri dön
```
