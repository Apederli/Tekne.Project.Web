# Fotoğraf sıralama (drag & drop) — tasarım

Tarih: 2026-08-01
Durum: onaylandı, uygulanmadı

## Amaç

Partner, tekne fotoğraflarının sırasını sürükleyerek değiştirsin. Kapak
fotoğrafı ayrı bir işlem değildir: backend sözleşmesi gereği sıralama
dizisinin **ilk elemanı kapak olur** (`BoatPhotoService.reorder` yorumu),
yani kapağı değiştirmek = fotoğrafı başa sürüklemek.

## Kapsam

Dahil: ekle-karosunun bara dönüşmesi, CDK drag-drop ızgarası, tutamaç
butonu, optimistic sıralama + hata geri dönüşü, mevcut karşılıklı dışlama
düzenine katılım.

Hariç (bilinçli):

- **Yeni test yazımı** — proje kararı; `photo-uploader.spec.ts` kırılırsa
  yalnızca asgari uyarlanır.
- **Yeni bağımlılık yok** — `@angular/cdk` 22.0.0 zaten kurulu (spartan
  bağımlılığı), `@angular/cdk/drag-drop` oradan gelir.
- **`PUT /photos/{photoId}/main` ucu kullanılmaz** — kapak, sıralamanın ilk
  elemanı olarak zaten belirleniyor; ikinci bir kapak mekanizması kafa
  karıştırır.
- Sıralama modunda ok butonları, klavye ile taşıma (erişilebilirlik turu
  ayrı iş).

## Yerleşim değişikliği: ekle-karosu → ekle-barı

"Fotoğraf ekle" bugün ızgaranın ilk hücresi. `cdkDropList` içinde
sürüklenemeyen bir hücre CDK'nın karışık yön sıralama hesabını bozduğu için
ızgaradan çıkar:

- Izgaranın **üstüne**, tam genişlik, kesikli çerçeveli bir bar olur.
  Bugünkü label + `sr-only` input deseni aynen taşınır (telefonda tek
  dokunuşla galeri açılır), masaüstü dosya sürükle-bırak vurgusu
  (`dragging` sınıfları) barda devam eder.
- `full()` iken bar bugünkü karo gibi hiç render edilmez.
- İskelet kutucuklar ızgarada kalır (yüklenen fotoğrafın yerini gösterirler).
  Bunlar da sürüklenemeyen çocuklardır ama ekle-karosundaki sorunu
  yaratmazlar: yalnızca yükleme uçarken varlar ve o sırada sürükleme zaten
  `cdkDragDisabled` — CDK'nın sıralama hesabı yalnız aktif sürüklemede
  çalıştığı için ikisi hiçbir zaman çakışmaz.

## Sürükleme

- Izgara div'i `cdkDropList` + `cdkDropListOrientation="mixed"` (grid içinde
  her yöne sıralama). Sütun yapısı değişmez: `grid-cols-2 sm:grid-cols-3
  lg:grid-cols-4`.
- Her fotoğraf karosu `cdkDrag`. Sürükleme **yalnızca tutamaçtan** başlar:
  karonun alt-uç köşesinde (`end-2 bottom-2`) `cdkDragHandle` butonu,
  `lucideGripVertical` ikonu, **40px dokunma hedefi** (`h-10 w-10`,
  my-boats dokunma hedefi kararıyla tutarlı). Silme butonu üst-uç köşede
  kalır — çakışma yok.
- Karonun kendisine dokunmak sürükleme başlatmaz; sayfa kaydırma bozulmaz.
  Tutamaç kullanıldığı için `cdkDragStartDelay` gerekmiyor.
- Sürükleme sırasında CDK'nın varsayılan önizlemesi kullanılır; bırakılacak
  yer `.cdk-drag-placeholder` ile soluk gösterilir (global stile küçük bir
  ekleme gerekirse `src/styles.scss`).
- Tutamacın `sr-only` etiketi: "{{i+1}}. fotoğrafı taşı".

## Davranış (drop sonrası)

`cdkDropListDropped` işleyicisi (`PhotoUploader` içinde):

1. `moveItemInArray` ile görünen liste yeni sıraya dizilir.
2. **Optimistic emit:** `photosChanged` ile yeni liste yayınlanır; alanlar
   yeni sıraya göre yeniden yazılır — index 0 `isMain: true`, diğerleri
   `false`; `sortOrder: index`. Böylece `sortBoatPhotos` görsel sırayla
   aynı sonucu üretir, "Kapak" rozeti (i === 0) kendiliğinden doğru karoya
   geçer.
3. `BoatPhotoService.reorder(boatId, photoIdsInOrder)` çağrılır (yeni
   sıradaki id dizisi).
4. Hata olursa **önceki liste** yeniden emit edilir (geri dönüş); mesajı
   `errorInterceptor` gösterir, bileşen içinde ayrıca mesaj üretilmez.

## Karşılıklı dışlama

Uploader'daki mevcut kural (aynı anda tek fotoğraf işlemi) üçüncü ortağını
alır: `reordering` signal'i.

- Sıralama isteği uçarken: yükleme ve silme başlatılmaz, tutamaçlar ve
  silme butonları `disabled`.
- Yükleme veya silme uçarken: sürükleme devre dışı (`cdkDragDisabled`).
- Aynı yer değişikliği üst üste bırakılırsa (drop sırasında istek uçuyorsa)
  yeni drop yok sayılır — CDK disabled olduğu için zaten başlamaz.

## Bileşen sınırları

Her şey `PhotoUploader` içinde kalır; `BoatPhotos` host'u ve
`photosChanged` sözleşmesi değişmez. `BoatPhotoService.reorder` zaten var —
servis katmanına dokunulmaz. Yeni bileşen açılmaz.
