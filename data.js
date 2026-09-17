// Silüet kataloğu. Her nesne:
//  name, sub   : ad ve alt bilgi
//  realM       : gerçek boyut (metre). horiz=true ise uzunluk/genişlik, değilse yükseklik
//  nW, nH      : path'in kendi koordinat kutusu (piksel)
//  path        : SVG path verisi (nW x nH kutusu içinde)
//  fillRule    : "evenodd" ise delikli çizim (halka, çerçeve vb.)
//  fact        : tur sonunda gösterilen bilgi
// Tüm çizimler bu proje için elle yapılmış basit silüetlerdir.

const SHAPES = [
  {
    id: "human", name: "İnsan", sub: "(Ortalama yetişkin erkek)", realM: 1.75, horiz: false,
    nW: 54, nH: 132,
    path: "M27 1 A16 16 0 1 1 27 33 A16 16 0 1 1 27 1 Z " +
          "M13 36 Q5 58 12 82 L20 82 L15 131 L26 131 L27 92 L28 131 L39 131 L34 82 L42 82 Q49 58 41 36 Z " +
          "M11 40 Q0 60 6 86 L14 84 Q10 62 17 43 Z M43 40 Q54 60 48 86 L40 84 Q44 62 37 43 Z",
    fact: "Dünya genelinde yetişkin erkeklerin ortalama boyu yaklaşık <b>1,71–1,75 m</b>'dir; en uzun ülkeler Hollanda ve Karadağ'dır."
  },
  {
    id: "door", name: "İç Kapı", sub: "(Standart)", realM: 2.03, horiz: false,
    nW: 90, nH: 203, fillRule: "evenodd",
    path: "M0 0 H90 V203 H0 Z M14 14 H76 V90 H14 Z M14 106 H76 V190 H14 Z M66 96 A4 4 0 1 1 66 104 A4 4 0 1 1 66 96 Z",
    fact: "Türkiye'de standart iç kapı yüksekliği <b>203 cm</b>, genişliği ise 80–90 cm'dir."
  },
  {
    id: "banana", name: "Muz", sub: "(Orta boy)", realM: 0.18, horiz: true,
    nW: 180, nH: 80,
    path: "M4 14 Q10 4 16 10 Q40 60 100 68 Q150 72 172 52 Q180 54 176 62 Q140 84 90 78 Q30 70 4 22 Z",
    fact: "Muz botanik olarak bir <b>meyve değil bir 'berry'dir</b> ve dünyada en çok tüketilen meyvelerden biridir."
  },
  {
    id: "cat", name: "Kedi", sub: "(Evcil, oturur hâlde)", realM: 0.30, horiz: false,
    nW: 100, nH: 140,
    path: "M18 4 L30 28 L58 28 L70 4 L64 34 Q84 42 74 62 Q94 90 84 140 L12 140 Q2 90 22 62 Q12 42 32 34 Z " +
          "M84 138 Q104 118 96 88 Q108 124 90 142 Z",
    fact: "Evcil bir kedi omuzdan yaklaşık <b>23–25 cm</b>, oturduğunda başın tepesine kadar 30 cm civarındadır."
  },
  {
    id: "can", name: "Kutu Kola", sub: "(330 ml)", realM: 0.115, horiz: false,
    nW: 66, nH: 115,
    path: "M8 6 Q8 0 14 0 H52 Q58 0 58 6 L66 12 V104 L58 110 Q58 115 52 115 H14 Q8 115 8 110 L0 104 V12 Z",
    fact: "Standart 330 ml içecek kutusu yaklaşık <b>11,5 cm</b> boyunda ve 6,6 cm çapındadır."
  },
  {
    id: "basketball", name: "Basketbol Topu", sub: "(Boyut 7)", realM: 0.24, horiz: false,
    nW: 100, nH: 100,
    path: "M50 0 A50 50 0 1 1 50 100 A50 50 0 1 1 50 0 Z",
    fact: "Resmi bir basketbol topunun çapı yaklaşık <b>24 cm</b>, çevresi 75 cm'dir."
  },
  {
    id: "tennisball", name: "Tenis Topu", sub: "", realM: 0.067, horiz: false,
    nW: 100, nH: 100,
    path: "M50 0 A50 50 0 1 1 50 100 A50 50 0 1 1 50 0 Z",
    fact: "Tenis topu çapı <b>6,5–6,9 cm</b> arasındadır ve profesyonel maçlarda 7–9 oyunda bir yenilenir."
  },
  {
    id: "phone", name: "Akıllı Telefon", sub: "(6,1 inç)", realM: 0.147, horiz: false,
    nW: 70, nH: 147, fillRule: "evenodd",
    path: "M10 0 H60 Q70 0 70 10 V137 Q70 147 60 147 H10 Q0 147 0 137 V10 Q0 0 10 0 Z M5 12 H65 V135 H5 Z",
    fact: "6,1 inçlik bir telefon yaklaşık <b>14,7 cm</b> boyundadır; ilk iPhone ise 11,5 cm idi."
  },
  {
    id: "pencil", name: "Kurşun Kalem", sub: "(Yeni, açılmamış)", realM: 0.19, horiz: true,
    nW: 190, nH: 14,
    path: "M0 7 L20 1 H172 V0 H190 V14 H172 V13 H20 Z",
    fact: "Yeni bir kurşun kalem <b>19 cm</b>'dir ve yaklaşık 56 km çizgi çizebilir."
  },
  {
    id: "car", name: "Otomobil", sub: "(Hatchback)", realM: 4.2, horiz: true,
    nW: 420, nH: 150,
    path: "M8 118 L28 74 Q60 42 110 36 L190 30 Q262 30 302 62 L344 76 Q412 82 416 118 L410 128 H372 A26 26 0 0 0 320 128 H122 A26 26 0 0 0 70 128 H12 Z " +
          "M346 124 A26 26 0 1 1 346 150 A26 26 0 1 1 346 124 Z M96 124 A26 26 0 1 1 96 150 A26 26 0 1 1 96 124 Z",
    fact: "Tipik bir hatchback otomobil <b>4,0–4,3 m</b> uzunluğundadır; Fiat Egea Sedan 4,53 m'dir."
  },
  {
    id: "bus", name: "Şehir Otobüsü", sub: "(Tek katlı)", realM: 12, horiz: true,
    nW: 480, nH: 140, fillRule: "evenodd",
    path: "M6 20 Q6 4 22 4 H464 Q476 4 476 20 V116 H452 A22 22 0 0 0 408 116 H98 A22 22 0 0 0 54 116 H6 Z " +
          "M20 18 H68 V60 H20 Z M84 18 H144 V60 H84 Z M160 18 H220 V60 H160 Z M236 18 H296 V60 H236 Z M312 18 H372 V60 H312 Z M388 18 H462 V60 H388 Z " +
          "M430 96 A20 20 0 1 1 430 136 A20 20 0 1 1 430 96 Z M76 96 A20 20 0 1 1 76 136 A20 20 0 1 1 76 96 Z",
    fact: "Standart bir şehir otobüsü <b>12 m</b>, körüklü otobüsler ise 18 m uzunluğundadır."
  },
  {
    id: "bicycle", name: "Bisiklet", sub: "(Yetişkin)", realM: 1.8, horiz: true,
    nW: 180, nH: 100, fillRule: "evenodd",
    path: "M32 42 A30 30 0 1 1 32 102 A30 30 0 1 1 32 42 Z M32 52 A20 20 0 1 0 32 92 A20 20 0 1 0 32 52 Z " +
          "M148 42 A30 30 0 1 1 148 102 A30 30 0 1 1 148 42 Z M148 52 A20 20 0 1 0 148 92 A20 20 0 1 0 148 52 Z " +
          "M32 70 L64 24 L120 24 L148 70 L92 70 Z M36 72 L66 30 L86 66 Z M116 30 L146 72 L96 72 Z " +
          "M60 22 L48 22 L46 18 L70 18 L68 22 Z M114 26 L128 8 L136 8 L134 12 L128 12 L118 26 Z",
    fact: "Bir yetişkin bisikleti tekerlekten tekerleğe yaklaşık <b>1,7–1,8 m</b> uzunluğundadır."
  },
  {
    id: "giraffe", name: "Zürafa", sub: "(Yetişkin erkek)", realM: 5.5, horiz: false,
    nW: 150, nH: 275,
    path: "M112 0 L124 4 L130 22 L146 30 L140 40 L128 44 L124 60 L118 110 L112 150 L106 172 Q110 180 100 186 L102 268 L92 270 L88 200 L70 200 L66 270 L56 270 L54 200 L36 200 L30 270 L20 270 L20 196 L12 190 Q2 178 10 164 Q20 146 60 144 L96 150 L100 110 L104 60 L100 44 L92 30 L106 14 Z",
    fact: "Zürafa, <b>5,5 m</b>'ye ulaşabilen boyuyla dünyanın en uzun kara hayvanıdır; boynu tek başına 1,8 m'dir."
  },
  {
    id: "elephant", name: "Afrika Fili", sub: "(Yetişkin erkek, omuz)", realM: 3.2, horiz: false,
    nW: 260, nH: 200,
    path: "M60 20 Q110 0 170 10 Q230 20 250 60 Q262 90 250 110 L256 120 Q250 150 240 170 L246 198 L226 198 L218 160 L200 156 L196 198 L176 198 L172 150 L120 150 L116 198 L96 198 L92 150 L70 150 L66 198 L46 198 L40 150 Q20 130 24 96 Q6 80 8 60 Q12 34 60 20 Z " +
          "M232 96 Q244 120 232 150 Q226 170 236 190 L226 194 Q216 170 222 148 Q230 120 226 100 Z " +
          "M20 60 Q0 70 8 100 Q14 110 24 96 Q12 80 20 60 Z",
    fact: "Afrika fili omuz yüksekliği <b>3,2 m</b>'ye, ağırlığı 6 tona ulaşan en büyük kara hayvanıdır."
  },
  {
    id: "bed", name: "Çift Kişilik Yatak", sub: "(Uzunluk)", realM: 2.0, horiz: true,
    nW: 200, nH: 70,
    path: "M0 0 H14 V34 H180 V26 H196 V60 H200 V70 H190 V64 H10 V70 H0 Z M14 38 H196 V60 H14 Z",
    fact: "Standart bir çift kişilik yatak <b>200 cm</b> uzunluğunda, 160 cm genişliğindedir."
  },
  {
    id: "fridge", name: "Buzdolabı", sub: "(Alttan donduruculu)", realM: 1.85, horiz: false,
    nW: 70, nH: 185, fillRule: "evenodd",
    path: "M0 0 H70 V185 H0 Z M4 110 H66 V114 H4 Z M8 30 H12 V90 H8 Z M8 124 H12 V160 H8 Z",
    fact: "Ortalama bir buzdolabı <b>1,75–1,90 m</b> boyunda ve 60–70 cm genişliğindedir."
  },
  {
    id: "eiffel", name: "Eyfel Kulesi", sub: "(Anten dahil)", realM: 330, horiz: false,
    nW: 130, nH: 330,
    path: "M63 0 H67 V30 L72 34 V80 L78 100 V150 L90 200 H100 V210 H92 L108 270 L130 320 V330 H100 L96 300 Q65 280 34 300 L30 330 H0 V320 L22 270 L38 210 H30 V200 H40 L52 150 V100 L58 80 V34 Z " +
          "M55 200 H75 L86 260 Q65 250 44 260 Z",
    fact: "Eyfel Kulesi anteniyle <b>330 m</b> yüksekliğindedir ve 1889'da 41 yıl boyunca dünyanın en yüksek yapısıydı."
  },
  {
    id: "house", name: "Müstakil Ev", sub: "(İki katlı, çatı dahil)", realM: 8, horiz: false,
    nW: 160, nH: 160, fillRule: "evenodd",
    path: "M80 0 L160 70 H144 V160 H16 V70 H0 Z M110 12 H124 V40 L110 28 Z " +
          "M30 84 H60 V112 H30 Z M100 84 H130 V112 H100 Z M100 124 H130 V152 H100 Z M36 124 H60 V160 H36 Z",
    fact: "İki katlı tipik bir ev çatıya kadar <b>8 m</b> civarındadır; her kat yaklaşık 3 m'dir."
  },
  {
    id: "b737", name: "Boeing 737", sub: "(737-800)", realM: 39.5, horiz: true,
    nW: 400, nH: 120,
    path: "M0 70 Q6 52 36 50 L330 46 Q380 46 400 70 Q380 90 330 90 L60 92 Q10 90 0 70 Z " +
          "M310 48 L340 4 L368 4 L344 50 Z M300 88 L322 116 L340 116 L330 88 Z " +
          "M120 70 L110 108 L150 108 L200 76 Z M180 74 L226 70 L196 78 Z",
    fact: "Boeing 737-800 <b>39,5 m</b> uzunluğunda ve 35,8 m kanat açıklığındadır; dünyanın en çok üretilen yolcu uçağıdır."
  },
  {
    id: "whale", name: "Mavi Balina", sub: "(Yetişkin)", realM: 25, horiz: true,
    nW: 480, nH: 110,
    path: "M0 60 Q40 20 130 26 Q260 22 380 50 L420 40 Q440 34 470 10 L480 14 Q466 40 456 56 Q466 74 480 98 L470 102 Q446 84 420 72 L380 68 Q260 100 130 94 Q40 100 0 60 Z " +
          "M170 90 L200 110 L230 92 Z",
    fact: "Mavi balina <b>25–30 m</b> uzunluğuyla yaşamış en büyük hayvandır; kalbi bir küçük araba büyüklüğündedir."
  },
  {
    id: "penguin", name: "İmparator Pengueni", sub: "(Yetişkin)", realM: 1.2, horiz: false,
    nW: 64, nH: 120,
    path: "M32 0 Q48 0 50 18 L58 24 L50 26 Q64 60 58 100 L52 108 L60 118 L46 118 L42 110 H22 L18 118 L4 118 L12 108 L6 100 Q0 60 14 26 L6 24 L14 18 Q16 0 32 0 Z " +
          "M4 40 Q-4 70 6 96 L10 92 Q4 70 10 44 Z",
    fact: "İmparator pengueni <b>1,1–1,3 m</b> boyuyla en büyük penguen türüdür ve 500 m derine dalabilir."
  },
  {
    id: "coin", name: "1 TL Madeni Para", sub: "", realM: 0.0265, horiz: false,
    nW: 100, nH: 100,
    path: "M50 0 A50 50 0 1 1 50 100 A50 50 0 1 1 50 0 Z",
    fact: "1 TL madeni paranın çapı <b>26,15 mm</b>, ağırlığı 8,2 gramdır."
  },
  {
    id: "chair", name: "Sandalye", sub: "(Yemek sandalyesi, yan görünüm)", realM: 0.9, horiz: false,
    nW: 50, nH: 90,
    path: "M2 0 H10 V44 H44 V52 H10 V90 H2 V52 H0 V44 H2 Z M40 52 H48 V90 H40 Z M10 46 H48 V50 H10 Z",
    fact: "Tipik bir yemek sandalyesinin sırt yüksekliği <b>85–95 cm</b>, oturma yüksekliği 45 cm'dir."
  },
  {
    id: "oak", name: "Meşe Ağacı", sub: "(Olgun)", realM: 25, horiz: false,
    nW: 200, nH: 250,
    path: "M100 0 Q140 0 150 30 Q190 30 190 70 Q210 100 180 130 Q190 170 140 170 L120 172 L118 250 H82 L80 172 L60 170 Q10 170 20 130 Q-10 100 10 70 Q10 30 50 30 Q60 0 100 0 Z",
    fact: "Olgun bir meşe ağacı <b>20–30 m</b>'ye ulaşır ve 500 yıldan uzun yaşayabilir."
  },
  {
    id: "goal", name: "Futbol Kalesi", sub: "(Genişlik)", realM: 7.32, horiz: true,
    nW: 366, nH: 122, fillRule: "evenodd",
    path: "M0 0 H366 V122 H358 V8 H8 V122 H0 Z",
    fact: "Bir futbol kalesi <b>7,32 m</b> genişliğinde ve 2,44 m yüksekliğindedir."
  },
  {
    id: "guitar", name: "Akustik Gitar", sub: "", realM: 1.02, horiz: false,
    nW: 40, nH: 102, fillRule: "evenodd",
    path: "M16 0 H24 V44 Q40 42 38 60 Q36 68 34 72 Q42 84 34 98 Q20 106 6 98 Q-2 84 6 72 Q4 68 2 60 Q0 42 16 44 Z M20 68 A6 6 0 1 1 20 80 A6 6 0 1 1 20 68 Z",
    fact: "Standart bir akustik gitar yaklaşık <b>1 m</b> uzunluğundadır."
  },
  {
    id: "bottle", name: "Su Şişesi", sub: "(0,5 L)", realM: 0.22, horiz: false,
    nW: 64, nH: 220,
    path: "M22 0 H42 V16 Q48 20 48 30 Q64 60 62 90 V210 Q62 220 52 220 H12 Q2 220 2 210 V90 Q0 60 16 30 Q16 20 22 16 Z",
    fact: "0,5 litrelik standart pet şişe yaklaşık <b>21–22 cm</b> boyundadır."
  },
  {
    id: "laptop", name: "Dizüstü Bilgisayar", sub: "(14 inç, açık, yan görünüm)", realM: 0.32, horiz: true,
    nW: 320, nH: 210, fillRule: "evenodd",
    path: "M10 0 H310 V184 H10 Z M22 12 H298 V172 H22 Z M0 188 H320 V210 H0 Z",
    fact: "14 inçlik bir dizüstü bilgisayar yaklaşık <b>32 cm</b> genişliğindedir."
  },
  {
    id: "brick", name: "Tuğla", sub: "(Standart)", realM: 0.19, horiz: true,
    nW: 190, nH: 85, fillRule: "evenodd",
    path: "M0 0 H190 V85 H0 Z M14 14 H60 V36 H14 Z M72 14 H118 V36 H72 Z M130 14 H176 V36 H130 Z M14 48 H60 V70 H14 Z M72 48 H118 V70 H72 Z M130 48 H176 V70 H130 Z",
    fact: "Standart bir delikli tuğla <b>19 × 8,5 × 19 cm</b> ölçülerindedir."
  },
  {
    id: "shark", name: "Büyük Beyaz Köpekbalığı", sub: "(Yetişkin dişi)", realM: 4.9, horiz: true,
    nW: 490, nH: 170,
    path: "M0 90 Q60 60 140 56 L200 60 L230 10 L250 8 L260 60 Q330 62 400 80 L430 66 L470 20 L490 26 Q476 60 470 90 Q476 120 490 150 L470 158 L430 116 L400 106 Q330 120 260 122 L240 150 L222 150 L226 122 L140 122 Q60 118 0 90 Z",
    fact: "Büyük beyaz köpekbalığı dişileri <b>4,5–5 m</b>, erkekleri 3,5–4 m uzunluğa ulaşır."
  },
  {
    id: "dog", name: "Golden Retriever", sub: "(Yetişkin, omuz)", realM: 0.6, horiz: false,
    nW: 150, nH: 110,
    path: "M18 44 Q18 34 30 34 L112 34 Q124 34 124 46 L124 68 Q124 78 112 78 L30 78 Q18 78 18 66 Z " +
          "M104 20 Q108 6 124 6 L146 24 L150 34 L134 36 L132 54 Q120 58 108 50 Z " +
          "M26 76 L24 110 H38 L40 76 Z M48 76 L48 110 H62 L62 76 Z M84 76 L82 110 H96 L98 76 Z M106 76 L108 110 H122 L120 76 Z " +
          "M20 46 L2 22 L10 16 L30 42 Z",
    fact: "Golden Retriever omuz yüksekliği <b>56–61 cm</b>, ağırlığı 25–34 kg arasındadır."
  },
  {
    id: "wind", name: "Rüzgar Türbini", sub: "(Kara tipi, kanat ucu)", realM: 150, horiz: false,
    nW: 130, nH: 150,
    path: "M62 48 H68 V150 H60 Z M65 40 L70 44 L72 0 L58 0 L60 44 Z M65 40 L58 48 L14 66 L8 78 L44 62 L70 48 Z M65 40 L72 48 L116 66 L122 78 L86 62 L60 48 Z " +
          "M65 36 A9 9 0 1 1 65 54 A9 9 0 1 1 65 36 Z",
    fact: "Modern bir kara rüzgar türbini kanat ucuna kadar <b>150 m</b>'ye ulaşır; deniz türbinleri 260 m'yi geçer."
  },
];
