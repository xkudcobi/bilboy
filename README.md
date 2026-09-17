# Bilboy

Günlük görsel boyut tahmin oyunu. Kırmızı hedef nesneyi, boyutu bilinen mavi referansın yanında gerçek ölçeğine getir ve tahminini kilitle. Her gün 5 tur, tur başına 100 puan.

**Oyna:** https://xkudcobi.github.io/bilboy/

## Özellikler

- **5 günlük mod:** Günlük (karışık), Hayvanlar, Yapılar, Araçlar, Eşyalar — hepsi her gün yenilenir
- **67 el çizimi silüet** — ev faresinden Everest'e
- Sürükle / köşeden boyutlandır / kaydırıcı / fare tekerleği / iki parmakla pinch / klavye kısayolları
- Tur sonunda gerçek ölçeğe **animasyonlu** geçiş, sapma çubuğu ve ilginç bilgi
- **İstatistikler:** oyun sayısı, ortalama, seri, puan dağılımı
- **12 rozet** (Keskin Göz, Dev Avcısı, Mikro Göz, Gece Kuşu…)
- **Arşiv:** geçmiş günlerin bulmacalarını oyna
- **Meydan okuma:** aynı 5 turu skorunla birlikte arkadaşına link olarak gönder
- **Pratik modu:** sınırsız rastgele set
- **PWA:** telefona kurulabilir, çevrimdışı çalışır
- Açık / koyu tema, mobil uyumlu

## Nasıl oynanır?

1. **Karşılaştır** — Mavi nesne sabit referanstır, boyutu değişmez.
2. **Taşı ve boyutlandır** — Kırmızı silüeti sürükle; köşe tutamaklarından, kaydırıcıdan, fare tekerleğiyle ya da iki parmakla büyüt/küçült. Büyük tahminler için tahtayı uzaklaştır.
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

Aradaki değerler doğrusal hesaplanır.

**Klavye:** `↑`/`↓` boyut (%2, Shift ile %10) · `←`/`→` taşı · `+`/`-` tahta zoom · `F` sığdır · `Enter` kilitle

## URL parametreleri

| Parametre | Anlam |
|---|---|
| `?m=hayvanlar` | Mod (`gunluk`, `hayvanlar`, `yapilar`, `araclar`, `esyalar`) |
| `?d=2026-09-20` | Arşivden belirli bir gün |
| `?c=abc123` | Rastgele tohumlu meydan okuma seti |
| `&s=412` | Meydan okuyanın puanı (karşılaştırma gösterilir) |

## Geliştirme

Build gerektirmez; `index.html` dosyasını tarayıcıda aç.

- `data.js` — silüet kataloğu (SVG path + kategori + gerçek ölçü + bilgi notu)
- `game.js` — oyun mantığı, canvas çizimi, etkileşim, istatistik, rozetler
- `style.css` — tema (açık/koyu)
- `shapes.html` — tüm silüetleri ve ölçülen sınırlarını gösteren galeri
- `tools/test.html` — headless Chrome ile uçtan uca test (`?stop=result|final`)
- `tools/merge.js` — `tools/add.js` içindeki yeni silüetleri kataloğa ekler ve doğrular

Yeni nesne eklemek için `data.js` içindeki `SHAPES` dizisine bir kayıt ekle. `nW`/`nH` yaklaşık olabilir; gerçek sınırlar açılışta otomatik ölçülür. Kategoriler: `hayvan`, `yapi`, `arac`, `esya`, `doga`, `insan`.

## Kaynak

Magnitudle'ın [Size It Up](https://magnitudle.com/size-it-up) oyunundan esinlenmiştir. Tüm silüetler bu proje için sıfırdan çizilmiştir.

## Lisans

MIT
