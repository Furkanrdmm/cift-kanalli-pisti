# Çift Kanallı Pişti

Kural fikri kullanıcının abisinin; oyun Nekank adıyla Google Play'e çıkıyor. Kurallar, kod yapısı ve kararlar
`GELISTIRME.md` içinde, sürüm geçmişi `DEGISIKLIKLER.md`, mağaza bilgileri `magaza/magaza-yazilari.md`.

## Durum (13 Kasım 2026)
Google Play kapalı testte (12 kişi, 14 gün), son yüklenen sürüm 1.0.7. Mağaza simgesi, kapak ve 4 ekran görüntüsü
yenilendi. Sırada: 14 gün dolunca üretim başvurusu; istenirse Flutter'a taşıma (aynı paket adı ve imzayla güncelleme olur).

## Kararlar
- **Yazı tipi:** başlık Baloo 2, metin Nunito (Fredoka'da ş, İ, ğ yok). Menü ekrana sığmazsa kaydırılmaz, orantılı küçülür.
- **Yayın dosyası:** `derle.ps1` ile `cift_kanalli_pistiV<sürüm>.aab`; Play'e her yüklemede sürüm bir artar.
- **Oynanışa dokunulmaz** (13 Kasım 2026, kullanıcı): kurallar ve bilgisayar oyuncusu olduğu gibi kalır; düzeltmeler görünüm ve yayın içindir.
- **Tek kişilik:** online yok, Firebase kaldırıldı. Sunucu olmadan online istenirse yeniden konuşulur.
- **Dil şimdilik yalnızca Türkçe;** İngilizce sonraki güncellemede.
- **Teknoloji:** React + Vite + Capacitor (stüdyonun Flutter kuralının istisnası; çalışan oyun yeniden yazılmaz).
- Kimlik `com.nekank.ciftkanallipisti`, Nekank yükleme anahtarı, reklam yok, internet izni yok.
- GitHub'daki otomatik APK yayını kapalı; web sürümü (GitHub Pages) iPhone ve bilgisayar için sürüyor.
- Özgünlük (13 Kasım 2026, web): "Çift Kanallı Pişti" adında ya da kanal kuralıyla başka oyun yok. Play'de çok sayıda düz "Pişti" var; pişti halk oyunu.

## Geçmiş
- Online oda sistemi (Firebase, 4 haneli kod) v1.2'de eklendi, v1.4'te kaldırıldı.
