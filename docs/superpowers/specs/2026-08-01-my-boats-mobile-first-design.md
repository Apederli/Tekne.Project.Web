# Teknelerim (partner) — mobile-first liste tasarımı

Tarih: 2026-08-01
Durum: onaylandı, uygulanmadı

## Amaç

Partnerin teknelerini **listeleyip yönettiği** sayfa. Bugün var olan yönetim
işleri fotoğraf yönetimi ve ilanı market gözüyle görme; tekne bilgisi
düzenleme yakında geliyor (aşağıda "Gelecek uyumu"). Sayfanın yapısı bu amaca
göre kuruluyor: market'teki tanıtım kartı değil, **yönetim kartı**.

Ölçek gerçeği: partnerlerin genelde 1–2, en fazla ~5 teknesi olur. Bu yüzden
tablo, sayfalama, arama/filtre bilinçli olarak yok — düz kart listesi yeter.

## Kapsam

Dahil: mobile-first kart listesi, durum rozeti, fotoğraf yönetimi linki,
"İlanı gör" linki, mevcut tablonun silinmesi.

Hariç (bilinçli):

- **Tekne düzenleme** — backend'de `PUT /api/Boats/{id}` yok (Swagger'dan
  doğrulandı, 2026-08-01); ucu kullanıcı yazacak. Bu tasarım yalnızca kartın
  yapısını düzenlemeye hazır bırakır, formu/aksiyonu içermez.
- **Yeni test yazımı** — proje kararı: testler proje bitiminde toplu yazılacak.
  Mevcut `my-boats.spec.ts` tabloya bağlı; silinmez, yalnızca kart yapısına
  göre **asgari uyarlamayla** suite yeşil tutulur. Yeni test senaryosu eklenmez.
- Sayfalama, arama, sıralama, filtre.

## Sayfa düzeni (mobile-first)

- Başlık satırı bugünkü hâliyle kalır: `h1` "Teknelerim" + "Yeni tekne ekle"
  (`hlmBtn`) yan yana.
- Tablo (`hlmTable` ve `HlmTableImports`) tamamen silinir.
- Liste: `grid gap-4 sm:grid-cols-2 lg:grid-cols-3`. Taban düzen tek sütun
  (telefonda tam genişlik kart); `sm:`/`lg:` yalnızca sütun sayısını artırır.

## Yönetim kartı

Market kartıyla ([boat-card.html](../../../src/app/features/market/boat-search/boat-card.html))
aynı görsel iskelet; içerik yönetime göre:

- **Fotoğraf:** üstte `app-photo-gallery`, `aspect-[5/4] w-full` — parmakla
  kaydırılır. Swiper tıklamaları market kartındaki `swallowSwiperClick`
  deseniyle yutulur.
- **Gövde:** tekne adı + yalnızca pasifken "Yayında değil" rozeti (soluk/amber
  ton; yayındaki tekne rozet taşımaz). Altında konum satırı
  (`formatBoatLocation`) ve meta satırı: tip · kiralama türü · kapasite
  (mevcut `BOAT_TYPE_LABELS` / `RENTAL_TYPE_LABELS`).
- **Kart dokunuşu:** fotoğraf + gövde tek `routerLink` içinde → fotoğraf
  yönetimi (`/partner/dashboard/teknelerim/{id}/fotograflar`). Bugünkü tek
  yönetim işi bu olduğu için birincil hedef bu.
- **Aksiyon şeridi:** kartın altında, linkin **kardeşi** olarak ayrı bir satır.
  Dokunma hedefleri parmak boyutunda. Bugünkü içerik:
  - "Fotoğraflar" — outline buton, fotoğraf yönetimine (kart dokunuşuyla aynı
    hedef; şeritteki kopyası düzenleme geldiğinde anlam kazanır).
  - "İlanı gör" — yalnızca `isActive` teknelerde; marketteki herkese açık
    detaya (`/tekne/{slug}`, `makeBoatSlug` ile). Pasif ilanın public
    sayfasına link verilmez.

## Gelecek uyumu (düzenleme)

`PUT /api/Boats/{id}` ve düzenleme formu geldiğinde:

- "Düzenle" aksiyon şeridine **birincil buton** olarak eklenir,
- kart dokunuşunun `routerLink` hedefi düzenlemeye çevrilir; "Fotoğraflar"
  şeritte kalır.

Yani gelecekteki değişiklik tek link hedefi + tek buton eklemek; kartın DOM'u
ve düzeni değişmez. Bu tasarımın DoD'sine dahil değildir.

## Durumlar

Yükleniyor / hata / boş durum bugünkü davranış ve metinlerle aynen kalır
(boş durum kutusu zaten mobile uyumlu). Veri kaynakları değişmez:
`rxResource` + `BoatService.getMine()` + `HarborService.getAll()`.

## Komponent değişiklikleri

`my-boats.ts`:

- Kalır: `boatsResource`, `citiesResource`, `loading`/`failed`/`boats`/`cities`,
  `boatTypeLabel`, `rentalTypeLabel`, `location`, `newBoatUrl`, `photosUrl`.
- Çıkar: `HlmTableImports` importu.
- Eklenir: `publicUrl(boat)` — `makeBoatSlug(boat.name, boat.id)` ile market
  detay linki (`ROUTE_MARKET` sabitleri üzerinden).

Yeni bileşen açılmaz: kart tek kullanım yeri olduğu için `my-boats.html`
içinde inline yazılır (YAGNI). İkinci bir tüketici çıkarsa o gün ayrılır.
