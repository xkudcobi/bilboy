# Boyutla

Günlük görsel boyut tahmin oyunu. Kırmızı hedef nesneyi, boyutu bilinen mavi referansın yanında gerçek ölçeğine getir ve tahminini kilitle. Her gün 5 tur, tur başına 100 puan.

**Oyna:** https://xkudcobi.github.io/boyutla/

## Nasıl oynanır?

1. **Karşılaştır** — Mavi nesne sabit referanstır, boyutu değişmez.
2. **Taşı ve boyutlandır** — Kırmızı silüeti sürükle; köşe tutamaklarından, fare tekerleğiyle ya da iki parmakla büyüt/küçült. Büyük tahminler için tahtayı uzaklaştır.
3. **Kilitle** — Gerçek ölçek açığa çıkar, sapmana göre puan alırsın.

| Sapma | Puan |
|---|---|
| ≤ %6 | 100 |
| %12 | 90 |
| %20 | 78 |
| %32 | 62 |
| %50 | 45 |
| %75 | 30 |
| %110 | 18 |
| ≥ %160 | 0 |

Aradaki değerler doğrusal olarak hesaplanır.

## Geliştirme

Build gerektirmez; `index.html` dosyasını tarayıcıda aç. `shapes.html` tüm silüetleri ve ölçülen sınırlarını gösteren bir galeridir.

- `data.js` — silüet kataloğu (SVG path + gerçek ölçü + bilgi notu)
- `game.js` — oyun mantığı, canvas çizimi, etkileşim
- `style.css` — tema (açık/koyu)

Yeni nesne eklemek için `data.js` içindeki `SHAPES` dizisine bir kayıt ekle. `nW`/`nH` yaklaşık olabilir; gerçek sınırlar açılışta otomatik ölçülür.

## Kaynak

Magnitudle'ın [Size It Up](https://magnitudle.com/size-it-up) oyunundan esinlenmiştir. Tüm silüetler bu proje için sıfırdan çizilmiştir.

## Lisans

MIT
