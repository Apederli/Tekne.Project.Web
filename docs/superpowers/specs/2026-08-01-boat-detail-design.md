# Tekne detay sayfası — tasarım

Tarih: 2026-08-01
Durum: onaylandı, uygulanmadı

## Amaç

Market ziyaretçisinin bir ilanı incelediği herkese açık detay sayfası.
Referans: başka bir sitenin foto mozaikli detay bölümü — solda büyük kapak,
sağda 2×2 küçük kare, "+N fotoğraf" rozeti.

## Kapsam

Dahil: foto mozaik (masaüstü) / kaydırmalı galeri (mobil), künye (ad, konum,
tip, kapasite, uzunluk, yıl, açıklama), kartlardan detaya link, slug kuralı,
SEO sayfa başlığı, testler.

Hariç (bilinçli):

- **Tam ekran fotoğraf görüntüleyici (lightbox)** — sonraki tur; "+N fotoğraf"
  bu turda tıklanmayan bilgi çipidir.
- **Video** — backend `BoatPhoto` yalnızca görsel tutuyor.
- **Rezervasyon kutusu, fiyat, müsaitlik, olanaklar** — backend'de alanları yok.

## Slug kuralı

URL: `/tekne/{ad-slug}-{id}` (örn. `/tekne/mavi-ruzgar-5`). Gerçek kaynak
**id**'dir; ad kısmı yalnızca SEO içindir ve doğrulanmaz.

`src/app/core/util/boat-slug.ts` — saf fonksiyonlar:

```ts
makeBoatSlug(name: string, id: number): string
// "Mavi Rüzgar", 5 → "mavi-ruzgar-5"
// Türkçe sadeleştirme: ç→c, ğ→g, ı→i, ö→o, ş→s, ü→u (büyükleriyle);
// harf/rakam dışı her şey tire, ardışık tireler teklenir, uçlar kırpılır.

parseBoatIdFromSlug(slug: string): number | null
// Sondaki "-{sayı}" ayrıştırılır; yoksa/bozuksa null.
```

## Sayfa yapısı

### Galeri

- **Masaüstü (`lg:` ve üzeri):** mozaik — 4 sütunlu grid, kapak `col-span-2
  row-span-2`, yanında 4 küçük kare; tek `rounded-xl overflow-hidden` blok.
  Sıra `sortBoatPhotos` (kapak başta) — diğer ekranlarla aynı.
  - 5'ten çok fotoğrafta son karenin üzerinde "+N fotoğraf" çipi
    (N = toplam − 5).
  - 5'ten az fotoğrafta mozaik küçülür: tek fotoğraf → yalnız kapak;
    2–4 → kapak + olan kadar kare. Boş hücre gösterilmez.
  - Fotoğrafsız ilanda "Fotoğraf yok" çerçevesi (galeriyle aynı görsel dil).
- **Mobil:** mozaik yok; mevcut `PhotoGallery` (kaydırma + dinamik nokta)
  tam genişlik, `aspect-[4/3]`.
- Geçiş saf CSS'tir (`lg:hidden` / `hidden lg:grid`); iki blok da DOM'da durur.
  `isPlatformBrowser` dallanması yok — hydration uyuşmazlığı riski yok. İlk
  görseller iki blokta ortak olduğundan tarayıcı önbelleği tekrarı emer;
  mozaik görselleri `loading="lazy"` (kapak `eager`).

### Künye

Galeri altında:

- **Ad** (`h1`) + konum satırı ("Bodrum Limanı, Muğla" — ana liman + şehir,
  `HarborService.getAll` ile çözülür; `MyBoats.location` kuralının aynısı).
- Tip etiketi (Yelkenli/Motor yat/Katamaran/Gulet), kapasite ("12 kişi"),
  uzunluk ("14 m"), üretim yılı (varsa).
- Açıklama paragrafı (varsa).

### SEO

Sayfa başlığı `Title` servisiyle tekne adına çekilir ("Mavi Rüzgar — Tekne").
Route zaten `RenderMode.Server`.

## Veri akışı

- `BoatDetail` sayfası `slug` input'unu alır (`withComponentInputBinding`),
  `parseBoatIdFromSlug` ile id çıkarır, `BoatService.getById(id)` çağırır
  (`rxResource`, id `params` olarak).
- Konum için `HarborService.getAll` ikinci `rxResource`.
- **Hata durumları:** slug'dan id çıkmazsa istek hiç açılmaz; 404/hatalı
  yanıtta "Tekne bulunamadı" bloğu + listeye dönüş linki. Mesajı
  `errorInterceptor` gösterir, sayfada `try/catch` yok.

## Kart bağlantısı

`boat-card`'da galeri + künye `<a [routerLink]>` ile detaya gider
(`['/', ROUTE_MARKET.boatDetail, makeBoatSlug(...)]`). Rozet/kalp overlay'i
linkin **kardeşidir** (kart kökü `relative`, overlay `absolute` üstte) —
link içinde buton geçersiz HTML'dir ve ekran okuyucuda linkin adını kirletir;
referans site de aynı yapıyı kullanıyor. Overlay kapsayıcısı
`pointer-events-none`, düğme `pointer-events-auto`: rozet ile kalp arasındaki
boş şerit tıklamayı linke geçirir. Kalp tıklaması navigasyona hiç değmez.

*(Revizyon 2026-08-01: kalp önceden link içinde `preventDefault` +
`stopPropagation` ile tasarlanmıştı; inceleme bulgusu üzerine kullanıcı
kararıyla kardeş overlay'e çevrildi.)*

## Dosyalar

| Dosya | Sorumluluk |
|---|---|
| `core/util/boat-slug.ts` (+ spec) | slug üret/ayrıştır — saf fonksiyonlar |
| `features/market/boat-detail/boat-detail.ts/.html` (+ spec) | sayfa: mozaik + mobil galeri + künye + bulunamadı durumu |
| `features/market/boat-search/boat-card.ts/.html` | karta detay linki |

## Test

- **boat-slug:** Türkçe karakter sadeleştirme, özel karakter/tire teklenmesi,
  `parse` gidiş-dönüşü, bozuk slug → `null`.
- **boat-detail:** geçerli slug → doğru uca istek + ad/künye render; 5+
  fotoğrafta "+N fotoğraf" çipi ve mozaikte 5 görsel; tek fotoğrafta yalnız
  kapak; bozuk slug → istek yok + bulunamadı bloğu; sayfa başlığı tekne adı.
- **boat-card:** kart linkinin `href`'i doğru slug'ı taşır; kalp tıklaması
  navigasyon tetiklemez.
