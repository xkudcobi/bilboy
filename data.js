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
    id: "human", cat: "insan", name: "İnsan", sub: "(Ortalama yetişkin erkek)", realM: 1.75, horiz: false,
    nW: 54, nH: 132,
    path: "M27 1 A16 16 0 1 1 27 33 A16 16 0 1 1 27 1 Z " +
          "M13 36 Q5 58 12 82 L20 82 L15 131 L26 131 L27 92 L28 131 L39 131 L34 82 L42 82 Q49 58 41 36 Z " +
          "M11 40 Q0 60 6 86 L14 84 Q10 62 17 43 Z M43 40 Q54 60 48 86 L40 84 Q44 62 37 43 Z",
    fact: "Dünya genelinde yetişkin erkeklerin ortalama boyu yaklaşık <b>1,71–1,75 m</b>'dir; en uzun ülkeler Hollanda ve Karadağ'dır."
  },
  {
    id: "door", cat: "yapi", name: "İç Kapı", sub: "(Standart)", realM: 2.03, horiz: false,
    nW: 90, nH: 203, fillRule: "evenodd",
    path: "M0 0 H90 V203 H0 Z M14 14 H76 V90 H14 Z M14 106 H76 V190 H14 Z M66 96 A4 4 0 1 1 66 104 A4 4 0 1 1 66 96 Z",
    fact: "Türkiye'de standart iç kapı yüksekliği <b>203 cm</b>, genişliği ise 80–90 cm'dir."
  },
  {
    id: "banana", cat: "esya", name: "Muz", sub: "(Orta boy)", realM: 0.18, horiz: true,
    nW: 180, nH: 80,
    path: "M4 14 Q10 4 16 10 Q40 60 100 68 Q150 72 172 52 Q180 54 176 62 Q140 84 90 78 Q30 70 4 22 Z",
    fact: "Muz botanik olarak bir <b>meyve değil bir 'berry'dir</b> ve dünyada en çok tüketilen meyvelerden biridir."
  },
  {
    id: "cat", cat: "hayvan", name: "Kedi", sub: "(Evcil, oturur hâlde)", realM: 0.30, horiz: false,
    nW: 100, nH: 140,
    path: "M18 4 L30 28 L58 28 L70 4 L64 34 Q84 42 74 62 Q94 90 84 140 L12 140 Q2 90 22 62 Q12 42 32 34 Z " +
          "M84 138 Q104 118 96 88 Q108 124 90 142 Z",
    fact: "Evcil bir kedi omuzdan yaklaşık <b>23–25 cm</b>, oturduğunda başın tepesine kadar 30 cm civarındadır."
  },
  {
    id: "can", cat: "esya", name: "Kutu Kola", sub: "(330 ml)", realM: 0.115, horiz: false,
    nW: 66, nH: 115,
    path: "M8 6 Q8 0 14 0 H52 Q58 0 58 6 L66 12 V104 L58 110 Q58 115 52 115 H14 Q8 115 8 110 L0 104 V12 Z",
    fact: "Standart 330 ml içecek kutusu yaklaşık <b>11,5 cm</b> boyunda ve 6,6 cm çapındadır."
  },
  {
    id: "basketball", cat: "esya", name: "Basketbol Topu", sub: "(Boyut 7)", realM: 0.24, horiz: false,
    nW: 100, nH: 100,
    path: "M50 0 A50 50 0 1 1 50 100 A50 50 0 1 1 50 0 Z",
    fact: "Resmi bir basketbol topunun çapı yaklaşık <b>24 cm</b>, çevresi 75 cm'dir."
  },
  {
    id: "tennisball", cat: "esya", name: "Tenis Topu", sub: "", realM: 0.067, horiz: false,
    nW: 100, nH: 100,
    path: "M50 0 A50 50 0 1 1 50 100 A50 50 0 1 1 50 0 Z",
    fact: "Tenis topu çapı <b>6,5–6,9 cm</b> arasındadır ve profesyonel maçlarda 7–9 oyunda bir yenilenir."
  },
  {
    id: "phone", cat: "esya", name: "Akıllı Telefon", sub: "(6,1 inç)", realM: 0.147, horiz: false,
    nW: 70, nH: 147, fillRule: "evenodd",
    path: "M10 0 H60 Q70 0 70 10 V137 Q70 147 60 147 H10 Q0 147 0 137 V10 Q0 0 10 0 Z M5 12 H65 V135 H5 Z",
    fact: "6,1 inçlik bir telefon yaklaşık <b>14,7 cm</b> boyundadır; ilk iPhone ise 11,5 cm idi."
  },
  {
    id: "pencil", cat: "esya", name: "Kurşun Kalem", sub: "(Yeni, açılmamış)", realM: 0.19, horiz: true,
    nW: 190, nH: 14,
    path: "M0 7 L20 1 H172 V0 H190 V14 H172 V13 H20 Z",
    fact: "Yeni bir kurşun kalem <b>19 cm</b>'dir ve yaklaşık 56 km çizgi çizebilir."
  },
  {
    id: "car", cat: "arac", name: "Otomobil", sub: "(Hatchback)", realM: 4.2, horiz: true,
    nW: 420, nH: 150,
    path: "M8 118 L28 74 Q60 42 110 36 L190 30 Q262 30 302 62 L344 76 Q412 82 416 118 L410 128 H372 A26 26 0 0 0 320 128 H122 A26 26 0 0 0 70 128 H12 Z " +
          "M346 124 A26 26 0 1 1 346 150 A26 26 0 1 1 346 124 Z M96 124 A26 26 0 1 1 96 150 A26 26 0 1 1 96 124 Z",
    fact: "Tipik bir hatchback otomobil <b>4,0–4,3 m</b> uzunluğundadır; Fiat Egea Sedan 4,53 m'dir."
  },
  {
    id: "bus", cat: "arac", name: "Şehir Otobüsü", sub: "(Tek katlı)", realM: 12, horiz: true,
    nW: 480, nH: 140, fillRule: "evenodd",
    path: "M6 20 Q6 4 22 4 H464 Q476 4 476 20 V116 H452 A22 22 0 0 0 408 116 H98 A22 22 0 0 0 54 116 H6 Z " +
          "M20 18 H68 V60 H20 Z M84 18 H144 V60 H84 Z M160 18 H220 V60 H160 Z M236 18 H296 V60 H236 Z M312 18 H372 V60 H312 Z M388 18 H462 V60 H388 Z " +
          "M430 96 A20 20 0 1 1 430 136 A20 20 0 1 1 430 96 Z M76 96 A20 20 0 1 1 76 136 A20 20 0 1 1 76 96 Z",
    fact: "Standart bir şehir otobüsü <b>12 m</b>, körüklü otobüsler ise 18 m uzunluğundadır."
  },
  {
    id: "bicycle", cat: "arac", name: "Bisiklet", sub: "(Yetişkin)", realM: 1.8, horiz: true,
    nW: 180, nH: 100, fillRule: "evenodd",
    path: "M32 42 A30 30 0 1 1 32 102 A30 30 0 1 1 32 42 Z M32 52 A20 20 0 1 0 32 92 A20 20 0 1 0 32 52 Z " +
          "M148 42 A30 30 0 1 1 148 102 A30 30 0 1 1 148 42 Z M148 52 A20 20 0 1 0 148 92 A20 20 0 1 0 148 52 Z " +
          "M32 70 L64 24 L120 24 L148 70 L92 70 Z M36 72 L66 30 L86 66 Z M116 30 L146 72 L96 72 Z " +
          "M60 22 L48 22 L46 18 L70 18 L68 22 Z M114 26 L128 8 L136 8 L134 12 L128 12 L118 26 Z",
    fact: "Bir yetişkin bisikleti tekerlekten tekerleğe yaklaşık <b>1,7–1,8 m</b> uzunluğundadır."
  },
  {
    id: "giraffe", cat: "hayvan", name: "Zürafa", sub: "(Yetişkin erkek)", realM: 5.5, horiz: false,
    nW: 150, nH: 275,
    path: "M112 0 L124 4 L130 22 L146 30 L140 40 L128 44 L124 60 L118 110 L112 150 L106 172 Q110 180 100 186 L102 268 L92 270 L88 200 L70 200 L66 270 L56 270 L54 200 L36 200 L30 270 L20 270 L20 196 L12 190 Q2 178 10 164 Q20 146 60 144 L96 150 L100 110 L104 60 L100 44 L92 30 L106 14 Z",
    fact: "Zürafa, <b>5,5 m</b>'ye ulaşabilen boyuyla dünyanın en uzun kara hayvanıdır; boynu tek başına 1,8 m'dir."
  },
  {
    id: "elephant", cat: "hayvan", name: "Afrika Fili", sub: "(Yetişkin erkek, omuz)", realM: 3.2, horiz: false,
    nW: 260, nH: 200,
    path: "M60 20 Q110 0 170 10 Q230 20 250 60 Q262 90 250 110 L256 120 Q250 150 240 170 L246 198 L226 198 L218 160 L200 156 L196 198 L176 198 L172 150 L120 150 L116 198 L96 198 L92 150 L70 150 L66 198 L46 198 L40 150 Q20 130 24 96 Q6 80 8 60 Q12 34 60 20 Z " +
          "M232 96 Q244 120 232 150 Q226 170 236 190 L226 194 Q216 170 222 148 Q230 120 226 100 Z " +
          "M20 60 Q0 70 8 100 Q14 110 24 96 Q12 80 20 60 Z",
    fact: "Afrika fili omuz yüksekliği <b>3,2 m</b>'ye, ağırlığı 6 tona ulaşan en büyük kara hayvanıdır."
  },
  {
    id: "bed", cat: "esya", name: "Çift Kişilik Yatak", sub: "(Uzunluk)", realM: 2.0, horiz: true,
    nW: 200, nH: 70,
    path: "M0 0 H14 V34 H180 V26 H196 V60 H200 V70 H190 V64 H10 V70 H0 Z M14 38 H196 V60 H14 Z",
    fact: "Standart bir çift kişilik yatak <b>200 cm</b> uzunluğunda, 160 cm genişliğindedir."
  },
  {
    id: "fridge", cat: "esya", name: "Buzdolabı", sub: "(Alttan donduruculu)", realM: 1.85, horiz: false,
    nW: 70, nH: 185, fillRule: "evenodd",
    path: "M0 0 H70 V185 H0 Z M4 110 H66 V114 H4 Z M8 30 H12 V90 H8 Z M8 124 H12 V160 H8 Z",
    fact: "Ortalama bir buzdolabı <b>1,75–1,90 m</b> boyunda ve 60–70 cm genişliğindedir."
  },
  {
    id: "eiffel", cat: "yapi", name: "Eyfel Kulesi", sub: "(Anten dahil)", realM: 330, horiz: false,
    nW: 130, nH: 330,
    path: "M63 0 H67 V30 L72 34 V80 L78 100 V150 L90 200 H100 V210 H92 L108 270 L130 320 V330 H100 L96 300 Q65 280 34 300 L30 330 H0 V320 L22 270 L38 210 H30 V200 H40 L52 150 V100 L58 80 V34 Z " +
          "M55 200 H75 L86 260 Q65 250 44 260 Z",
    fact: "Eyfel Kulesi anteniyle <b>330 m</b> yüksekliğindedir ve 1889'da 41 yıl boyunca dünyanın en yüksek yapısıydı."
  },
  {
    id: "house", cat: "yapi", name: "Müstakil Ev", sub: "(İki katlı, çatı dahil)", realM: 8, horiz: false,
    nW: 160, nH: 160, fillRule: "evenodd",
    path: "M80 0 L160 70 H144 V160 H16 V70 H0 Z M110 12 H124 V40 L110 28 Z " +
          "M30 84 H60 V112 H30 Z M100 84 H130 V112 H100 Z M100 124 H130 V152 H100 Z M36 124 H60 V160 H36 Z",
    fact: "İki katlı tipik bir ev çatıya kadar <b>8 m</b> civarındadır; her kat yaklaşık 3 m'dir."
  },
  {
    id: "b737", cat: "arac", name: "Boeing 737", sub: "(737-800)", realM: 39.5, horiz: true,
    nW: 400, nH: 120,
    path: "M0 70 Q6 52 36 50 L330 46 Q380 46 400 70 Q380 90 330 90 L60 92 Q10 90 0 70 Z " +
          "M310 48 L340 4 L368 4 L344 50 Z M300 88 L322 116 L340 116 L330 88 Z " +
          "M120 70 L110 108 L150 108 L200 76 Z M180 74 L226 70 L196 78 Z",
    fact: "Boeing 737-800 <b>39,5 m</b> uzunluğunda ve 35,8 m kanat açıklığındadır; dünyanın en çok üretilen yolcu uçağıdır."
  },
  {
    id: "whale", cat: "hayvan", name: "Mavi Balina", sub: "(Yetişkin)", realM: 25, horiz: true,
    nW: 480, nH: 110,
    path: "M0 60 Q40 20 130 26 Q260 22 380 50 L420 40 Q440 34 470 10 L480 14 Q466 40 456 56 Q466 74 480 98 L470 102 Q446 84 420 72 L380 68 Q260 100 130 94 Q40 100 0 60 Z " +
          "M170 90 L200 110 L230 92 Z",
    fact: "Mavi balina <b>25–30 m</b> uzunluğuyla yaşamış en büyük hayvandır; kalbi bir küçük araba büyüklüğündedir."
  },
  {
    id: "penguin", cat: "hayvan", name: "İmparator Pengueni", sub: "(Yetişkin)", realM: 1.2, horiz: false,
    nW: 64, nH: 120,
    path: "M32 0 Q48 0 50 18 L58 24 L50 26 Q64 60 58 100 L52 108 L60 118 L46 118 L42 110 H22 L18 118 L4 118 L12 108 L6 100 Q0 60 14 26 L6 24 L14 18 Q16 0 32 0 Z " +
          "M4 40 Q-4 70 6 96 L10 92 Q4 70 10 44 Z",
    fact: "İmparator pengueni <b>1,1–1,3 m</b> boyuyla en büyük penguen türüdür ve 500 m derine dalabilir."
  },
  {
    id: "coin", cat: "esya", name: "1 TL Madeni Para", sub: "", realM: 0.0265, horiz: false,
    nW: 100, nH: 100,
    path: "M50 0 A50 50 0 1 1 50 100 A50 50 0 1 1 50 0 Z",
    fact: "1 TL madeni paranın çapı <b>26,15 mm</b>, ağırlığı 8,2 gramdır."
  },
  {
    id: "chair", cat: "esya", name: "Sandalye", sub: "(Yemek sandalyesi, yan görünüm)", realM: 0.9, horiz: false,
    nW: 50, nH: 90,
    path: "M2 0 H10 V44 H44 V52 H10 V90 H2 V52 H0 V44 H2 Z M40 52 H48 V90 H40 Z M10 46 H48 V50 H10 Z",
    fact: "Tipik bir yemek sandalyesinin sırt yüksekliği <b>85–95 cm</b>, oturma yüksekliği 45 cm'dir."
  },
  {
    id: "oak", cat: "doga", name: "Meşe Ağacı", sub: "(Olgun)", realM: 25, horiz: false,
    nW: 200, nH: 250,
    path: "M100 0 Q140 0 150 30 Q190 30 190 70 Q210 100 180 130 Q190 170 140 170 L120 172 L118 250 H82 L80 172 L60 170 Q10 170 20 130 Q-10 100 10 70 Q10 30 50 30 Q60 0 100 0 Z",
    fact: "Olgun bir meşe ağacı <b>20–30 m</b>'ye ulaşır ve 500 yıldan uzun yaşayabilir."
  },
  {
    id: "goal", cat: "yapi", name: "Futbol Kalesi", sub: "(Genişlik)", realM: 7.32, horiz: true,
    nW: 366, nH: 122, fillRule: "evenodd",
    path: "M0 0 H366 V122 H358 V8 H8 V122 H0 Z",
    fact: "Bir futbol kalesi <b>7,32 m</b> genişliğinde ve 2,44 m yüksekliğindedir."
  },
  {
    id: "guitar", cat: "esya", name: "Akustik Gitar", sub: "", realM: 1.02, horiz: false,
    nW: 40, nH: 102, fillRule: "evenodd",
    path: "M16 0 H24 V44 Q40 42 38 60 Q36 68 34 72 Q42 84 34 98 Q20 106 6 98 Q-2 84 6 72 Q4 68 2 60 Q0 42 16 44 Z M20 68 A6 6 0 1 1 20 80 A6 6 0 1 1 20 68 Z",
    fact: "Standart bir akustik gitar yaklaşık <b>1 m</b> uzunluğundadır."
  },
  {
    id: "bottle", cat: "esya", name: "Su Şişesi", sub: "(0,5 L)", realM: 0.22, horiz: false,
    nW: 64, nH: 220,
    path: "M22 0 H42 V16 Q48 20 48 30 Q64 60 62 90 V210 Q62 220 52 220 H12 Q2 220 2 210 V90 Q0 60 16 30 Q16 20 22 16 Z",
    fact: "0,5 litrelik standart pet şişe yaklaşık <b>21–22 cm</b> boyundadır."
  },
  {
    id: "laptop", cat: "esya", name: "Dizüstü Bilgisayar", sub: "(14 inç, açık, yan görünüm)", realM: 0.32, horiz: true,
    nW: 320, nH: 210, fillRule: "evenodd",
    path: "M10 0 H310 V184 H10 Z M22 12 H298 V172 H22 Z M0 188 H320 V210 H0 Z",
    fact: "14 inçlik bir dizüstü bilgisayar yaklaşık <b>32 cm</b> genişliğindedir."
  },
  {
    id: "brick", cat: "esya", name: "Tuğla", sub: "(Standart)", realM: 0.19, horiz: true,
    nW: 190, nH: 85, fillRule: "evenodd",
    path: "M0 0 H190 V85 H0 Z M14 14 H60 V36 H14 Z M72 14 H118 V36 H72 Z M130 14 H176 V36 H130 Z M14 48 H60 V70 H14 Z M72 48 H118 V70 H72 Z M130 48 H176 V70 H130 Z",
    fact: "Standart bir delikli tuğla <b>19 × 8,5 × 19 cm</b> ölçülerindedir."
  },
  {
    id: "shark", cat: "hayvan", name: "Büyük Beyaz Köpekbalığı", sub: "(Yetişkin dişi)", realM: 4.9, horiz: true,
    nW: 490, nH: 170,
    path: "M0 90 Q60 60 140 56 L200 60 L230 10 L250 8 L260 60 Q330 62 400 80 L430 66 L470 20 L490 26 Q476 60 470 90 Q476 120 490 150 L470 158 L430 116 L400 106 Q330 120 260 122 L240 150 L222 150 L226 122 L140 122 Q60 118 0 90 Z",
    fact: "Büyük beyaz köpekbalığı dişileri <b>4,5–5 m</b>, erkekleri 3,5–4 m uzunluğa ulaşır."
  },
  {
    id: "dog", cat: "hayvan", name: "Golden Retriever", sub: "(Yetişkin, omuz)", realM: 0.6, horiz: false,
    nW: 150, nH: 110,
    path: "M18 44 Q18 34 30 34 L112 34 Q124 34 124 46 L124 68 Q124 78 112 78 L30 78 Q18 78 18 66 Z " +
          "M104 20 Q108 6 124 6 L146 24 L150 34 L134 36 L132 54 Q120 58 108 50 Z " +
          "M26 76 L24 110 H38 L40 76 Z M48 76 L48 110 H62 L62 76 Z M84 76 L82 110 H96 L98 76 Z M106 76 L108 110 H122 L120 76 Z " +
          "M20 46 L2 22 L10 16 L30 42 Z",
    fact: "Golden Retriever omuz yüksekliği <b>56–61 cm</b>, ağırlığı 25–34 kg arasındadır."
  },
  {
    id: "wind", cat: "yapi", name: "Rüzgar Türbini", sub: "(Kara tipi, kanat ucu)", realM: 150, horiz: false,
    nW: 130, nH: 150,
    path: "M62 48 H68 V150 H60 Z M65 40 L70 44 L72 0 L58 0 L60 44 Z M65 40 L58 48 L14 66 L8 78 L44 62 L70 48 Z M65 40 L72 48 L116 66 L122 78 L86 62 L60 48 Z " +
          "M65 36 A9 9 0 1 1 65 54 A9 9 0 1 1 65 36 Z",
    fact: "Modern bir kara rüzgar türbini kanat ucuna kadar <b>150 m</b>'ye ulaşır; deniz türbinleri 260 m'yi geçer."
  },
  // ---- Hayvanlar ----
  {
    id: "horse", cat: "hayvan", name: "At", sub: "(Yetişkin, cidago)", realM: 1.6, horiz: false,
    nW: 200, nH: 180,
    path: "M40 60 Q60 40 120 44 L150 20 L170 0 L186 4 L200 30 L190 40 L172 44 L160 70 L150 100 Q140 110 120 108 L60 108 Q40 110 30 100 Z " +
          "M40 100 L36 180 H50 L56 104 Z M62 104 L60 180 H74 L78 104 Z M116 104 L114 180 H128 L132 104 Z M138 100 L140 180 H154 L154 100 Z " +
          "M32 64 Q8 90 14 130 L24 128 Q22 96 40 76 Z",
    fact: "Bir binek atı cidagodan <b>1,5–1,7 m</b>; en büyük yük atları 2 m'yi aşar."
  },
  {
    id: "cow", cat: "hayvan", name: "İnek", sub: "(Holstein, cidago)", realM: 1.45, horiz: false,
    nW: 200, nH: 150,
    path: "M30 40 Q30 20 60 20 L140 24 L170 0 L196 10 L200 36 L184 40 L176 60 L170 100 L40 100 Q26 90 30 70 Z " +
          "M44 98 L40 150 H56 L60 98 Z M66 98 L64 150 H80 L84 98 Z M124 98 L122 150 H138 L142 98 Z M150 98 L152 150 H168 L166 98 Z " +
          "M30 44 L14 100 L22 102 L36 60 Z",
    fact: "Holstein ineği cidagodan <b>1,45 m</b>, ağırlığı 600–700 kg'dır; günde 25–30 litre süt verir."
  },
  {
    id: "chicken", cat: "hayvan", name: "Tavuk", sub: "(Yetişkin)", realM: 0.45, horiz: false,
    nW: 90, nH: 100,
    path: "M50 10 Q60 0 72 8 L90 20 L74 26 L70 44 Q80 60 66 74 L40 80 Q10 76 6 56 Q2 40 16 34 Q30 30 44 40 L46 26 Z " +
          "M34 78 L30 96 H40 L42 80 Z M50 78 L54 96 H64 L60 78 Z M8 50 L0 32 L14 40 Z",
    fact: "Yetişkin bir tavuk yaklaşık <b>40–50 cm</b> boyundadır ve kısa mesafede saat 14 km hıza ulaşır."
  },
  {
    id: "mouse", cat: "hayvan", name: "Ev Faresi", sub: "(Gövde, kuyruk hariç)", realM: 0.09, horiz: true,
    nW: 90, nH: 50,
    path: "M4 34 Q0 20 16 14 Q30 4 50 10 L60 2 L66 12 L80 10 L76 22 L90 36 Q90 48 76 48 L20 48 Q4 48 4 34 Z",
    fact: "Ev faresinin gövdesi <b>7–10 cm</b>, kuyruğu da bir o kadar uzundur; 20 gram ağırlığındadır."
  },
  {
    id: "trex", cat: "hayvan", name: "T. rex", sub: "(Uzunluk)", realM: 12, horiz: true,
    nW: 480, nH: 220,
    path: "M0 130 Q80 100 150 80 Q200 40 280 36 L340 30 Q360 6 420 4 L480 24 L476 56 L440 66 L400 70 L392 96 Q370 150 320 156 L336 218 L306 218 L290 160 L250 150 L232 218 L202 218 L200 146 Q150 130 110 130 Q50 140 0 150 Z M340 90 L360 100 L352 110 L334 102 Z",
    fact: "Tyrannosaurus rex <b>12 m</b> uzunluğa ve 8 tona ulaşırdı; ısırığı 5 ton kuvvet üretiyordu."
  },
  {
    id: "croc", cat: "hayvan", name: "Nil Timsahı", sub: "(Büyük yetişkin erkek)", realM: 4.5, horiz: true,
    nW: 450, nH: 80,
    path: "M0 40 Q30 20 90 22 L180 26 L300 30 L360 20 L420 12 L450 20 L440 30 L360 36 L440 44 L450 52 L420 60 L300 56 L180 58 L90 60 Q30 62 0 40 Z " +
          "M100 56 L90 80 H110 L118 58 Z M160 58 L154 80 H174 L180 58 Z M260 58 L252 80 H272 L280 58 Z M320 56 L314 78 H334 L340 54 Z",
    fact: "Nil timsahı <b>4–5 m</b>'ye ulaşır; Afrika'daki en büyük sürüngendir ve 70 yıl yaşar."
  },
  {
    id: "rhino", cat: "hayvan", name: "Gergedan", sub: "(Beyaz gergedan, omuz)", realM: 1.8, horiz: false,
    nW: 240, nH: 170,
    path: "M20 70 Q30 30 90 30 L160 34 L190 14 L214 0 L222 12 L220 30 L240 46 L230 60 L200 70 L190 110 L40 110 Q14 100 20 70 Z " +
          "M44 108 L40 170 H58 L64 108 Z M70 108 L70 170 H88 L92 108 Z M150 108 L148 170 H166 L170 108 Z M176 108 L178 170 H196 L194 108 Z",
    fact: "Beyaz gergedan omuzdan <b>1,8 m</b>, 2,3 tona kadar ağırlığıyla filden sonraki en büyük kara hayvanıdır."
  },
  {
    id: "kangaroo", cat: "hayvan", name: "Kanguru", sub: "(Kızıl kanguru, erkek)", realM: 1.5, horiz: false,
    nW: 120, nH: 150,
    path: "M60 30 Q66 10 84 10 L90 0 L96 4 L94 14 L110 20 L108 32 L94 36 L86 50 Q100 70 92 100 L100 120 L128 124 L128 134 L86 134 L74 116 L66 118 L64 150 H50 L48 118 Q40 112 36 100 L10 140 L0 134 L30 84 Q34 60 46 44 Z",
    fact: "Kızıl kanguru erkeği dik durduğunda <b>1,5–1,8 m</b>; tek sıçrayışta 9 m ilerleyebilir."
  },
  // ---- Yapılar ----
  {
    id: "burj", cat: "yapi", name: "Burj Khalifa", sub: "(Dubai)", realM: 828, horiz: false,
    nW: 100, nH: 828,
    path: "M48 0 H52 V120 L56 130 V300 L62 320 V480 L72 500 V620 L84 640 V740 L100 780 V828 H0 V780 L16 740 V640 L28 620 V500 L38 480 V320 L44 300 V130 Z",
    fact: "Burj Khalifa <b>828 m</b> ile dünyanın en yüksek yapısıdır; 163 katı ve 57 asansörü vardır."
  },
  {
    id: "pyramid", cat: "yapi", name: "Keops Piramidi", sub: "(Bugünkü yüksekliği)", realM: 138, horiz: false,
    nW: 220, nH: 138,
    path: "M110 0 L220 138 H0 Z",
    fact: "Keops Piramidi <b>138 m</b> (aslen 146 m) ile 3.800 yıl boyunca dünyanın en yüksek yapısı kaldı."
  },
  {
    id: "liberty", cat: "yapi", name: "Özgürlük Heykeli", sub: "(Kaide dahil)", realM: 93, horiz: false,
    nW: 80, nH: 186,
    path: "M20 186 V120 H10 V100 H70 V120 H60 V186 Z M40 30 Q54 30 54 44 L52 60 Q64 66 62 86 L60 100 H20 L18 86 Q16 66 28 60 L26 44 Q26 30 40 30 Z " +
          "M56 40 L70 0 L76 4 L64 44 Z M34 20 L40 6 L46 20 L52 12 L48 30 H32 L28 12 Z",
    fact: "Özgürlük Heykeli kaideyle birlikte <b>93 m</b>, heykelin kendisi 46 m'dir; Fransa'nın 1886 hediyesidir."
  },
  {
    id: "bigben", cat: "yapi", name: "Big Ben", sub: "(Elizabeth Kulesi)", realM: 96, horiz: false,
    nW: 60, nH: 192, fillRule: "evenodd",
    path: "M30 0 L36 20 L34 30 H40 V60 H48 V192 H12 V60 H20 V30 H26 L24 20 Z M22 80 H38 V96 H22 Z",
    fact: "Elizabeth Kulesi <b>96 m</b>'dir; 13,7 tonluk Big Ben çanı 1859'dan beri çalıyor."
  },
  {
    id: "galata", cat: "yapi", name: "Galata Kulesi", sub: "(İstanbul)", realM: 67, horiz: false,
    nW: 70, nH: 134,
    path: "M35 0 L42 14 L40 24 L62 36 L60 40 L58 50 H62 V134 H8 V50 H12 L10 40 L8 36 L30 24 L28 14 Z",
    fact: "Galata Kulesi <b>67 m</b> yüksekliğindedir ve 1348'de Cenevizliler tarafından inşa edilmiştir."
  },
  {
    id: "hoop", cat: "yapi", name: "Basketbol Potası", sub: "(Pano üstü)", realM: 3.95, horiz: false,
    nW: 100, nH: 395,
    path: "M0 0 H100 V60 H52 V64 H88 V68 H52 V395 H48 V70 H10 V64 H48 V60 H0 Z",
    fact: "Basketbol çemberi yerden <b>3,05 m</b> yüksektedir; pano üstü yaklaşık 3,95 m'ye çıkar."
  },
  {
    id: "trafficlight", cat: "yapi", name: "Trafik Lambası", sub: "(Direkli)", realM: 4.5, horiz: false,
    nW: 60, nH: 450, fillRule: "evenodd",
    path: "M0 0 H60 V150 H36 V450 H24 V150 H0 Z M30 22 A14 14 0 1 1 30 50 A14 14 0 1 1 30 22 Z M30 60 A14 14 0 1 1 30 88 A14 14 0 1 1 30 60 Z M30 98 A14 14 0 1 1 30 126 A14 14 0 1 1 30 98 Z",
    fact: "Direkli bir trafik lambası yaklaşık <b>4–5 m</b>; ilk elektrikli trafik lambası 1914'te Cleveland'da kuruldu."
  },
  {
    id: "phonebooth", cat: "yapi", name: "Telefon Kulübesi", sub: "(Klasik)", realM: 2.5, horiz: false,
    nW: 100, nH: 250, fillRule: "evenodd",
    path: "M0 10 Q0 0 10 0 H90 Q100 0 100 10 V250 H0 Z M14 40 H86 V230 H14 Z M14 12 H86 V30 H14 Z",
    fact: "Klasik İngiliz K6 telefon kulübesi <b>2,5 m</b> boyunda ve 750 kg ağırlığındadır."
  },
  // ---- Araçlar ----
  {
    id: "titanic", cat: "arac", name: "Titanik", sub: "(Uzunluk)", realM: 269, horiz: true,
    nW: 540, nH: 200,
    path: "M0 130 L20 110 L520 110 L540 90 L530 200 L20 200 Z M80 110 V80 H460 V110 Z M120 80 V60 H420 V80 Z " +
          "M150 60 L154 10 L174 10 L178 60 Z M220 60 L224 10 L244 10 L248 60 Z M290 60 L294 10 L314 10 L318 60 Z M360 60 L364 10 L384 10 L388 60 Z " +
          "M100 80 H104 V0 H100 Z M440 80 H444 V0 H440 Z",
    fact: "Titanik <b>269 m</b> uzunluğundaydı; bugünkü en büyük yolcu gemisi Icon of the Seas 365 m'dir."
  },
  {
    id: "iss", cat: "arac", name: "Uluslararası Uzay İstasyonu", sub: "(Panel açıklığı)", realM: 109, horiz: true,
    nW: 545, nH: 240,
    path: "M0 20 H110 V220 H0 Z M435 20 H545 V220 H435 Z M110 112 H435 V128 H110 Z M180 90 H360 V150 H180 Z M250 40 H290 V200 H250 Z",
    fact: "UUİ güneş panelleriyle <b>109 m</b> genişliğindedir, saatte 28.000 km hızla 90 dakikada Dünya'yı turlar."
  },
  {
    id: "truck", cat: "arac", name: "Tır", sub: "(Çekici + dorse)", realM: 18.75, horiz: true,
    nW: 375, nH: 88,
    path: "M0 4 H290 V60 H300 L310 20 Q312 10 322 10 H350 L375 40 V70 H0 Z " +
          "M30 60 A14 14 0 1 1 30 88 A14 14 0 1 1 30 60 Z M62 60 A14 14 0 1 1 62 88 A14 14 0 1 1 62 60 Z M250 60 A14 14 0 1 1 250 88 A14 14 0 1 1 250 60 Z M282 60 A14 14 0 1 1 282 88 A14 14 0 1 1 282 60 Z M344 60 A14 14 0 1 1 344 88 A14 14 0 1 1 344 60 Z",
    fact: "Avrupa'da bir tırın toplam uzunluğu en fazla <b>18,75 m</b> olabilir; yükü 40 tona kadar çıkar."
  },
  {
    id: "motorbike", cat: "arac", name: "Motosiklet", sub: "(Orta sınıf)", realM: 2.1, horiz: true,
    nW: 210, nH: 110, fillRule: "evenodd",
    path: "M40 50 A30 30 0 1 1 40 110 A30 30 0 1 1 40 50 Z M40 60 A20 20 0 1 0 40 100 A20 20 0 1 0 40 60 Z " +
          "M170 50 A30 30 0 1 1 170 110 A30 30 0 1 1 170 50 Z M170 60 A20 20 0 1 0 170 100 A20 20 0 1 0 170 60 Z " +
          "M60 60 L80 30 L120 26 L150 44 L160 60 L140 70 L80 72 Z M110 26 L120 4 L128 4 L118 30 Z M150 44 L160 30 L166 34 L158 48 Z",
    fact: "Orta sınıf bir motosiklet <b>2,0–2,2 m</b> uzunluğundadır; en hızlı seri üretim motosiklet saatte 400 km'yi aşar."
  },
  {
    id: "helicopter", cat: "arac", name: "Helikopter", sub: "(Bell 206, pervane dahil)", realM: 12, horiz: true,
    nW: 480, nH: 128,
    path: "M0 8 H480 V16 H0 Z M236 16 H244 V40 H236 Z " +
          "M150 60 Q160 34 200 34 L280 40 Q320 48 330 76 Q320 100 280 104 L200 104 Q160 100 150 76 Z " +
          "M320 60 L440 46 L446 30 L470 30 L466 70 L440 76 L320 80 Z " +
          "M170 120 H320 V128 H170 Z M190 104 V120 H198 V104 Z M290 104 V120 H298 V104 Z",
    fact: "Bell 206 JetRanger pervaneleriyle <b>12 m</b> uzunluğundadır ve dünyanın en çok üretilen sivil helikopteridir."
  },
  {
    id: "canoe", cat: "arac", name: "Kano", sub: "(İki kişilik)", realM: 4.5, horiz: true,
    nW: 450, nH: 50, fillRule: "evenodd",
    path: "M0 26 Q60 0 225 0 Q390 0 450 26 Q390 50 225 50 Q60 50 0 26 Z M24 26 Q70 10 225 10 Q380 10 426 26 Q380 40 225 40 Q70 40 24 26 Z",
    fact: "İki kişilik bir kano <b>4,3–4,9 m</b> uzunluğundadır ve 30–35 kg ağırlığındadır."
  },
  {
    id: "tank", cat: "arac", name: "Tank", sub: "(Leopard 2, namlu dahil)", realM: 10, horiz: true,
    nW: 500, nH: 130,
    path: "M40 70 L60 40 L400 40 L440 70 L460 100 L40 100 Z M180 40 L200 10 H330 L350 40 Z M330 18 H500 V28 H330 Z " +
          "M20 100 Q20 130 50 130 H450 Q480 130 480 100 Z",
    fact: "Leopard 2 tankı namlusuyla <b>10 m</b>, gövdesi 7,7 m'dir; 62 ton ağırlığına rağmen saatte 70 km yapar."
  },
  // ---- Eşyalar ----
  {
    id: "creditcard", cat: "esya", name: "Kredi Kartı", sub: "(Genişlik)", realM: 0.0856, horiz: true,
    nW: 172, nH: 108, fillRule: "evenodd",
    path: "M12 0 H160 Q172 0 172 12 V96 Q172 108 160 108 H12 Q0 108 0 96 V12 Q0 0 12 0 Z M0 24 H172 V40 H0 Z",
    fact: "Bir kredi kartı <b>85,6 × 54 mm</b>'dir; bu oran neredeyse altın orana eşittir."
  },
  {
    id: "a4", cat: "esya", name: "A4 Kağıt", sub: "(Uzun kenar)", realM: 0.297, horiz: false,
    nW: 210, nH: 297, fillRule: "evenodd",
    path: "M0 0 H210 V297 H0 Z M30 40 H180 V46 H30 Z M30 60 H180 V66 H30 Z M30 80 H150 V86 H30 Z",
    fact: "A4 kağıt <b>210 × 297 mm</b>'dir; bir A0 kağıdı tam 1 m² alana sahiptir."
  },
  {
    id: "mug", cat: "esya", name: "Kupa Bardak", sub: "", realM: 0.095, horiz: false,
    nW: 110, nH: 95, fillRule: "evenodd",
    path: "M0 0 H80 V95 H0 Z M80 20 Q110 20 110 50 Q110 80 80 80 V68 Q98 68 98 50 Q98 32 80 32 Z",
    fact: "Standart bir kupa bardak <b>9–10 cm</b> boyunda ve 300–350 ml hacmindedir."
  },
  {
    id: "suitcase", cat: "esya", name: "Kabin Valizi", sub: "(Sapı kapalı)", realM: 0.55, horiz: false,
    nW: 80, nH: 110, fillRule: "evenodd",
    path: "M20 20 V6 Q20 0 26 0 H54 Q60 0 60 6 V20 H74 Q80 20 80 26 V104 Q80 110 74 110 H6 Q0 110 0 104 V26 Q0 20 6 20 Z M26 6 H54 V20 H26 Z",
    fact: "Kabin valizi çoğu havayolunda en fazla <b>55 × 40 × 20 cm</b> olabilir."
  },
  {
    id: "toothbrush", cat: "esya", name: "Diş Fırçası", sub: "", realM: 0.19, horiz: true,
    nW: 190, nH: 24,
    path: "M0 8 Q0 0 8 0 H40 V6 H180 Q190 6 190 14 Q190 22 180 22 H40 V18 H8 Q0 16 0 8 Z",
    fact: "Bir diş fırçası yaklaşık <b>19 cm</b>'dir ve her 3 ayda bir değiştirilmesi önerilir."
  },
  {
    id: "billiard", cat: "esya", name: "Bilardo Topu", sub: "", realM: 0.057, horiz: false,
    nW: 100, nH: 100,
    path: "M50 0 A50 50 0 1 1 50 100 A50 50 0 1 1 50 0 Z",
    fact: "Bilardo topu çapı <b>57,15 mm</b>'dir; eskiden fildişinden yapılırdı."
  },
  {
    id: "football", cat: "esya", name: "Futbol Topu", sub: "(5 numara)", realM: 0.22, horiz: false,
    nW: 100, nH: 100,
    path: "M50 0 A50 50 0 1 1 50 100 A50 50 0 1 1 50 0 Z",
    fact: "5 numara futbol topunun çapı yaklaşık <b>22 cm</b>, çevresi 68–70 cm'dir."
  },
  {
    id: "pingpong", cat: "esya", name: "Masa Tenisi Topu", sub: "", realM: 0.04, horiz: false,
    nW: 100, nH: 100,
    path: "M50 0 A50 50 0 1 1 50 100 A50 50 0 1 1 50 0 Z",
    fact: "Masa tenisi topu <b>40 mm</b> çapında ve sadece 2,7 gramdır."
  },
  {
    id: "umbrella", cat: "esya", name: "Şemsiye", sub: "(Açık, çap)", realM: 1.0, horiz: true,
    nW: 100, nH: 90,
    path: "M0 44 Q50 -10 100 44 Q88 40 76 46 Q64 40 50 46 Q36 40 24 46 Q12 40 0 44 Z M48 46 H52 V80 Q52 90 40 90 Q30 90 30 82 H36 Q36 84 40 84 Q46 84 46 80 V46 Z",
    fact: "Standart bir şemsiye açıldığında yaklaşık <b>1 m</b> çapındadır."
  },
  // ---- Doğa ----
  {
    id: "everest", cat: "doga", name: "Everest Dağı", sub: "(Deniz seviyesinden)", realM: 8849, horiz: false,
    nW: 400, nH: 200,
    path: "M0 200 L120 80 L160 110 L220 0 L280 90 L320 60 L400 200 Z",
    fact: "Everest <b>8.849 m</b> ile dünyanın en yüksek dağıdır ve her yıl 4 mm yükselir."
  },
  {
    id: "saguaro", cat: "doga", name: "Saguaro Kaktüsü", sub: "(Olgun)", realM: 12, horiz: false,
    nW: 88, nH: 200,
    path: "M28 40 Q28 20 44 20 Q60 20 60 40 V200 H28 Z M0 80 Q0 60 12 60 Q24 60 24 80 V120 H28 V140 H10 Q0 140 0 130 Z M64 100 Q64 80 76 80 Q88 80 88 100 V150 Q88 160 78 160 H60 V140 H64 Z",
    fact: "Saguaro kaktüsü <b>12 m</b>'ye kadar uzar; ilk kolunu çıkarması 50–70 yıl alır."
  },
  {
    id: "sunflower", cat: "doga", name: "Ayçiçeği", sub: "(Yetişkin)", realM: 2.0, horiz: false,
    nW: 90, nH: 200,
    path: "M45 4 A30 30 0 1 1 45 64 A30 30 0 1 1 45 4 Z M42 60 H48 V200 H42 Z M48 110 Q80 100 88 130 Q60 130 48 118 Z M42 140 Q10 130 2 160 Q30 160 42 148 Z",
    fact: "Ayçiçeği <b>2–3 m</b>'ye kadar uzar; rekor 9,17 m'dir. Genç bitkiler gün boyu güneşi takip eder."
  },
];
