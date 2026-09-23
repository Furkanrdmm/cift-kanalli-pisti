# Değişiklik Günlüğü

Her sürüm GitHub'da otomatik APK olarak yayınlanır ("Son Sürüm #numara").
Önemli noktalarda git etiketi konur, gerekirse o sürüme dönülebilir.

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
