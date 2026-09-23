import type { Card } from '../game/engine'
import { PlayingCard } from './PlayingCard'

const c = (rank: Card['rank'], suit: Card['suit']): Card => ({ id: rank + suit, rank, suit })

export function HowToPlay({ onBack }: { onBack: () => void }) {
  return (
    <div className="table">
      <div className="howto">
        <header className="topbar">
          <button className="icon-btn" onClick={onBack} aria-label="Menüye dön">
            ←
          </button>
          <h2 className="howto-title">Nasıl Oynanır?</h2>
          <span style={{ width: 38 }} />
        </header>

        <div className="howto-body">
          <p className="howto-intro">
            Kurallar normal pişti gibidir. Farkı: masada iki tane <b>pişti kanalı</b> vardır.
          </p>

          <section>
            <h3>1. Masa</h3>
            <div className="howto-demo">
              <div className="zone">
                <div className="zone-label">Pişti Kanalları</div>
                <div className="zone-cards">
                  <PlayingCard card={c('7', 'H')} small />
                  <PlayingCard card={c('Q', 'S')} small />
                </div>
              </div>
              <div className="zone">
                <div className="zone-label">Yer</div>
                <div className="howto-pile">
                  <PlayingCard faceDown small />
                  <PlayingCard card={c('4', 'C')} small style={{ position: 'absolute', left: 6, top: 4, transform: 'rotate(6deg)' }} />
                </div>
              </div>
            </div>
            <ul>
              <li>
                Solda <b>2 açık kart</b>: pişti kanalları.
              </li>
              <li>
                Sağda <b>1 kapalı + 1 açık</b> kart: normal pişti oynanan yer.
              </li>
              <li>Açılan 4 kartın 3'ü aynı olamaz.</li>
              <li>
                Her oyuncuya <b>4 kart</b> dağıtılır. Eller bitince deste bitene kadar yeniden dağıtılır.
              </li>
            </ul>
          </section>

          <section>
            <h3>2. Pişti Kanalları</h3>
            <ul>
              <li>
                Kanala <b>sadece pişti yapılır</b>: kanaldaki kartın aynısını atarsın. <i>7'ye 7, kıza kız.</i>
              </li>
              <li>Kanala başka kart atılamaz. Vale de kanaldaki kartı almaz, sadece valeyle pişti olur.</li>
              <li>
                Elindeki kart kanaldaki kartla aynıysa, o kartı <b>sadece kanala pişti için</b> oynayabilirsin, yere atamazsın.{' '}
                <i>Kanalda 2 varsa elindeki 2 yere gitmez.</i> O kartı oynamak zorunda değilsin, başka kartını oynayabilirsin.
              </li>
              <li>Bir kanala pişti yapılınca o kanal boş kalır. Diğerine de pişti yapılana kadar oraya kart atılmaz.</li>
            </ul>
          </section>

          <section>
            <h3>3. Kanallar Bitince: İki Yer</h3>
            <ul>
              <li>
                İki kanala da pişti yapılınca kanalların yeri <b>ikinci bir normal yer</b> olur. Artık masada iki yer vardır.
              </li>
              <li>
                <b>Sıradaki oyuncu bu yeni yere kart atmak zorundadır.</b> Başka yere oynayamaz.
              </li>
              <li>Bundan sonra iki yerden istediğine oynarsın. İkisinde de normal pişti kuralları geçerlidir.</li>
              <li>
                Yerlerden biri alınıp <b>boş kalırsa</b>, sıradaki oyuncu oraya kart atmak zorundadır. Yer boş kalamaz.
              </li>
            </ul>
          </section>

          <section>
            <h3>4. Yer (Normal Pişti)</h3>
            <ul>
              <li>Yerdeki en üst kartın aynısını atarsan yerdeki bütün kartları alırsın.</li>
              <li>
                <b>Vale</b> her zaman yerdeki bütün kartları alır.
              </li>
              <li>
                Yerde <b>tek kart</b> varken aynısını atarsan: <b>PİŞTİ!</b>
              </li>
              <li>Alamıyorsan kartın yerde kalır.</li>
              <li>
                Yer alınıp <b>boş kalırsa</b>, sıradaki oyuncu <b>mecburen yere kart atar</b>. O el kanala pişti yapamaz.
              </li>
            </ul>
          </section>

          <section>
            <h3>5. Puanlar</h3>
            <table className="score-table howto-points">
              <tbody>
                <tr>
                  <td>Pişti (kanalda veya yerde)</td>
                  <td>10</td>
                </tr>
                <tr>
                  <td>Vale ile vale piştisi</td>
                  <td>20</td>
                </tr>
                <tr>
                  <td>En çok kart toplayan</td>
                  <td>3</td>
                </tr>
                <tr>
                  <td>Karo 10 (♦10)</td>
                  <td>3</td>
                </tr>
                <tr>
                  <td>Sinek 2 (♣2)</td>
                  <td>2</td>
                </tr>
                <tr>
                  <td>Her as ve her vale</td>
                  <td>1</td>
                </tr>
              </tbody>
            </table>
            <ul>
              <li>Oyun sonunda yerlerde kalan bütün kartlar en son kart alan oyuncuya gider.</li>
              <li>Deste bitince en çok puanı olan oyunu kazanır. Menüde seçtiğin sayıda (1, 3 veya 5) oyun alan maçı kazanır.</li>
            </ul>
          </section>

          <section>
            <h3>6. 3 ve 4 Kişilik Oyun</h3>
            <ul>
              <li>Kurallar aynı. Her elde herkese 4'er kart dağıtılır.</li>
              <li>2 kişide 6 el, 3 kişide 4 el, 4 kişide 3 el oynanır.</li>
              <li>
                <b>4 kişi eşli:</b> karşılıklı oturanlar takımdır. Takım arkadaşının kartları ve piştileri ortak sayılır. En çok kart
                3 puanı takıma gider.
              </li>
              <li>
                <b>Tekli:</b> herkes kendi puanını toplar, en çok puanı olan oyunu kazanır.
              </li>
              <li>Sıra saat yönünün tersine döner: senden sonra sağındaki oyuncu oynar.</li>
            </ul>
          </section>

          <section>
            <h3>7. Arkadaşla Online</h3>
            <ul>
              <li>
                Menüden <b>👥 Arkadaşla Online</b>'a gir ve adını yaz.
              </li>
              <li>
                <b>Oda Kur:</b> kaç kişi, eşli mi ve kaç oyun alan kazanır seç. Ekranda <b>4 haneli oda kodu</b> çıkar.
              </li>
              <li>
                <b>Arkadaşlarına gönder</b> ile kodu WhatsApp'tan paylaş. Arkadaşların <b>Odaya Katıl</b>'a kodu yazar ya da gönderdiğin linke
                dokunur.
              </li>
              <li>
                Bekleme odasında koltuklar masa gibi dizilir: 1. altta, 2. sağda, 3. karşıda, 4. solda. Boş koltuktaki <b>Otur</b> ile oraya
                geçersin. Eşli oyunda karşılıklı oturanlar eştir, kiminle takım olacağınızı böyle seçersiniz.
              </li>
              <li>
                4 kişi eşlide kurucu boş koltuğa <b>+ Bilgisayar</b> ekleyebilir. Arkadaşınla takım olup bilgisayarlara karşı oynayabilirsin.
              </li>
              <li>
                Odada en az 2 kişi olunca kurucu <b>Oyunu Başlat</b> der. Boş kalan koltuklara bilgisayar oturur.
              </li>
              <li>Herkes kendini altta görür. Yeni oyunu kurucu başlatır.</li>
              <li>
                Birinin interneti koparsa kutusunda <b>"bağlantı yok"</b> yazar. Sırası gelince 15 saniye sonra onun yerine bilgisayar oynar.
              </li>
              <li>Android, iPhone ve bilgisayar aynı odada oynayabilir.</li>
            </ul>
          </section>

          <section>
            <h3>8. Ekranda Nasıl Oynanır?</h3>
            <ul>
              <li>Elindeki bir karta dokun, kart yukarı kalkar.</li>
              <li>
                Oynayabileceğin yerler <b className="gold">altın renginde parlar</b>. Oraya dokun.
              </li>
              <li>Tek seçenek varsa karta ikinci kez dokunman yeterli.</li>
              <li>
                İstersen karta <b>basılı tutup sürükle</b>, parlayan yerin üstüne bırak. Kartın tek gidebileceği yer varsa yukarı doğru
                fırlatman yeterli.
              </li>
              <li>Bir yerin çerçevesi turuncuysa oraya kart atmak zorundasın.</li>
            </ul>
          </section>

          <button className="btn btn--primary howto-done" onClick={onBack}>
            Anladım
          </button>
        </div>
      </div>
    </div>
  )
}
