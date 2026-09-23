# Çift Kanallı Pişti

Normal piştiden türetilmiş, kendi kurallarımızla oynanan kart oyunu. Telefondan arkadaşlarla ve bilgisayara karşı oynanabilen bir mobil web oyunu (PWA) olarak geliştiriliyor.

## Nasıl çalıştırılır

```bash
npm install     # ilk seferde bir kez
npm run dev     # geliştirme sunucusu → tarayıcıda http://localhost:5173
npm run build   # yayına hazır sürüm → dist/ klasörü
```

Telefondan denemek için: `npm run dev -- --host` çalıştır, çıkan `Network:` adresini aynı Wi-Fi'deki telefonun tarayıcısında aç.

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
- İki kanal da boşalınca kanal sayısı **kalıcı olarak 1'e düşer** ve **sıradaki oyuncu kanala bir kart atmak zorundadır** (başka yere oynayamaz, herhangi bir kart olabilir).
- Tek kanala pişti yapılıp boşaldığında da sıradaki oyuncu yine doldurmak zorundadır. Kanal boş kalamaz.
- Oyuncular her turda kanala (pişti yapabiliyorsa) veya normal alana, istediği yere oynar.

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

- Oyun sonunda yerde kalan kartlar (kanaldakiler dahil) **en son kart alan** oyuncuya gider.
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

## Yapılacaklar

- [x] Oyun motoru ve kurallar
- [x] Bilgisayara karşı oynama
- [x] Kahvehane masası görünümü
- [x] "Nasıl Oynanır?" ekranı (ana menüden)
- [ ] Arkadaşla online oynama (Firebase, oda kodu)
- [ ] Ana ekrana eklenebilir uygulama (PWA simgesi, çevrimdışı çalışma)
- [ ] Kart animasyonları ve ses efektleri
- [ ] 3–4 kişilik oyun
- [ ] İnternette yayınlama (arkadaşlara link)

## Açık sorular

- 3–4 kişide kurallar nasıl olacak? (kaçar kart dağıtılacak, eşli mi oynanacak?)
