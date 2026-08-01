# Tam ekran fotoğraf görüntüleyici (lightbox) — uygulama planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tekne detay sayfasındaki fotoğrafları tam ekran, kırpılmadan gösteren CDK Dialog tabanlı görüntüleyici; mobilde satır içi galeriden, masaüstünde mozaikten açılır.

**Architecture:** `shared/photo-lightbox/` altında CDK `Dialog` ile açılan Swiper tabanlı bileşen + colocated `PhotoLightboxService` (confirm-dialog deseni). Tetikler: `PhotoGallery`'ye `interactive` input + `photoOpened` output; mozaikte kapak/karolar buton olur, "+N" çipi kardeş buton.

**Tech Stack:** Angular 22, `@angular/cdk/dialog`, Swiper Element (`swiper/element/bundle`, kayıtlı desen), `@ng-icons/lucide`, Tailwind v4.

**Spec:** `docs/superpowers/specs/2026-08-01-photo-lightbox-design.md` (onaylandı 2026-08-01)

## Global Constraints

- **COMMIT ATILMAZ.** Kullanıcı talimatı: değişiklikler working tree'de bırakılır, kullanıcı inceleyip kendisi isteyecek. Skill'in commit adımları bu plana bilinçli olarak konmadı.
- **Yeni test yazılmaz** (proje kararı). Mevcut testler kırılırsa asgari uyarlanır. `dashboard-shell.spec.ts`'te eskiden beri 1 hata var — 90/91 geçer durum normaldir.
- Mobile-first: taban sınıflar mobil, `sm:`/`lg:` yalnızca büyütme. Dokunma hedefleri ≥ 40px (kapat düğmesi spec gereği 44px).
- Angular 22 konvansiyonları: `standalone`/`OnPush` yazılmaz, `input()`/`output()`, `inject()`, `@if`/`@for`, erişim belirteci yok, servislerde `@Service()`.
- Interface'ler bileşen dosyasına yazılmaz → `core/models/`.
- `PhotoLightboxService` `@services` barrel'ına **girmez** (confirm-dialog kuralıyla aynı: bileşene referans veren servis barrel'a girerse dialog bağımlılığı barrel'ı import eden herkese bulaşır).
- UI metinleri Türkçe.

## Plan aşamasında doğrulananlar (spec'teki riskler)

- Swiper element olay adı: `eventsPrefix` varsayılanı `'swiper'` (`swiper/shared/swiper-core.mjs:359`) + `name.toLowerCase()` → **`swiperslidechange`**; `event.detail` = `[swiperInstance]` (`swiper-element-bundle.mjs:159-172`).
- `navigation` attribute'u element bundle'da çalışıyor: `needsNavigation(passedParams)` true ise prev/next düğmeleri shadow DOM'a basılıyor (`swiper-element-bundle.mjs:127-132`). Ok düğmeleri `::part(button-prev)` / `::part(button-next)` ile stillenebilir.
- `initialSlide` `paramsList`'te var (`swiper/shared/update-swiper.mjs:14`) → `initial-slide` attribute'u çalışır.
- `Swiper` tipi: `import type { Swiper } from 'swiper/types'` (`swiper/package.json` exports `./types` → `types/public.d.ts`, `Swiper`'ı re-export ediyor).
- CDK Dialog API: `Dialog.open<R, D, C>(component, config)`, config'de `data`, `ariaLabel`, `width`/`height` yok ama `panelClass` var; `DialogRef.close()`, `DIALOG_DATA` token. (`@angular/cdk/types/dialog.d.ts:314-348`)

---

### Task 1: `PhotoLightboxData` modeli

**Files:**

- Create: `src/app/core/models/photo-lightbox.ts`
- Modify: `src/app/core/models/index.ts` (barrel satırı)

**Interfaces:**

- Consumes: `BoatPhotoOutputModel` (`@models/boat-photo`)
- Produces: `PhotoLightboxData { photos, startIndex, alt }` — Task 2'nin `DIALOG_DATA` tipi.

- [x] **Step 1: Model dosyasını yaz**

```ts
import { BoatPhotoOutputModel } from '@models/boat-photo';

/** `PhotoLightboxService.open` bağlamı — CDK `DIALOG_DATA` ile bileşene taşınır. */
export interface PhotoLightboxData {
  photos: BoatPhotoOutputModel[];
  /** Açılış slaytı — tıklanan fotoğrafın `sortBoatPhotos` sonrası index'i. */
  startIndex: number;
  /** Tekne adı — sayaç ve alt metinler bundan üretilir. */
  alt: string;
}
```

Not: barrel içi dosyalar birbirini `@models/boat-photo` ile import eder, `@models` ile değil (döngü kuralı, `index.ts` başındaki yorum).

- [x] **Step 2: Barrel'a ekle**

`src/app/core/models/index.ts` içine alfabetik sıraya uygun satır: `export * from './photo-lightbox';` (`./harbor`'dan önce).

### Task 2: `PhotoLightbox` bileşeni + `PhotoLightboxService`

**Files:**

- Create: `src/app/shared/photo-lightbox/photo-lightbox.ts`
- Create: `src/app/shared/photo-lightbox/photo-lightbox.html`
- Create: `src/app/shared/photo-lightbox/photo-lightbox.service.ts`

**Interfaces:**

- Consumes: `PhotoLightboxData` (Task 1), `PhotoUrlService` (`@services`), `sortBoatPhotos` (`@models`)
- Produces: `PhotoLightboxService.open(photos: BoatPhotoOutputModel[], startIndex: number, alt: string): void` — Task 4 bunu çağırır.

- [x] **Step 1: Bileşen TS**

```ts
import { afterNextRender, Component, CUSTOM_ELEMENTS_SCHEMA, inject, signal } from '@angular/core';
import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideX } from '@ng-icons/lucide';
import { register } from 'swiper/element/bundle';
import type { Swiper } from 'swiper/types';
import { sortBoatPhotos } from '@models';
import type { PhotoLightboxData } from '@models';
import { PhotoUrlService } from '@services';

/**
 * Tam ekran fotoğraf görüntüleyici. Tek başına kullanılmaz —
 * `PhotoLightboxService.open` CDK Dialog ile açar, bağlam `DIALOG_DATA`'dan gelir.
 *
 * Satır içi `PhotoGallery`'den bilinçli ayrı: o kart için tasarlandı
 * (kırpma + noktalar), buranın varlık sebebi kırpmadan göstermek
 * (`object-contain`) ve nokta yerine "3 / 12" sayacı.
 *
 * Host `fixed inset-0`: CDK'nın pane/container boyutlarına bağımlılık yok,
 * panel her durumda ekranı kaplar. Escape ve odak yönetimi CDK'da.
 */
@Component({
  selector: 'app-photo-lightbox',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  imports: [NgIcon],
  providers: [provideIcons({ lucideX })],
  templateUrl: './photo-lightbox.html',
  host: { class: 'fixed inset-0 z-10 block bg-black' },
})
export class PhotoLightbox {
  ref = inject<DialogRef<void>>(DialogRef);
  data = inject<PhotoLightboxData>(DIALOG_DATA);
  photoUrl = inject(PhotoUrlService);

  /** Sıra her yerdeki gibi `sortBoatPhotos` — tetikleyen index'ler bu sırayla üretildi. */
  photos = sortBoatPhotos(this.data.photos);

  /** Sayaç için aktif slayt — `swiperslidechange` olayından güncellenir. */
  current = signal(this.data.startIndex);

  scrollable = this.photos.length > 1;

  constructor() {
    // `customElements` sunucuda yok; `register` tanımlıysa atlar (PhotoGallery deseni).
    afterNextRender(() => register());
  }

  onSlideChange(event: Event): void {
    const [swiper] = (event as CustomEvent<[Swiper]>).detail;
    this.current.set(swiper.activeIndex);
  }

  photoAlt(index: number): string {
    const position = `fotoğraf ${index + 1} / ${this.photos.length}`;
    const name = this.data.alt.trim();
    return name ? `${name} — ${position}` : position;
  }
}
```

- [x] **Step 2: Bileşen şablonu**

```html
<!-- Üst şerit: sayaç ortada, 44px kapat düğmesi sağda (dokunmatikte hover yok,
     daima görünür). Swiper'ın üstünde durması için z-10. -->
<div
  class="pointer-events-none absolute inset-x-0 top-0 z-10 flex h-14 items-center justify-center"
>
  @if (scrollable) {
  <p class="text-sm font-medium text-white" aria-live="polite">
    {{ current() + 1 }} / {{ photos.length }}
  </p>
  }
  <button
    type="button"
    class="pointer-events-auto absolute end-2 top-2 flex size-11 items-center justify-center rounded-full text-white hover:bg-white/10"
    aria-label="Görüntüleyiciyi kapat"
    (click)="ref.close()"
  >
    <ng-icon name="lucideX" size="24" />
  </button>
</div>

<!-- Ok düğmeleri masaüstü işi: tabanda gizli, lg: ile görünür (mobilde kaydırma).
     Shadow DOM'a ::part ile erişiliyor; renk --swiper-navigation-* ile geçiyor. -->
<swiper-container
  class="block h-full w-full [--swiper-navigation-color:#fff] [--swiper-navigation-size:32px] [&::part(button-next)]:hidden [&::part(button-prev)]:hidden lg:[&::part(button-next)]:flex lg:[&::part(button-prev)]:flex"
  [attr.initial-slide]="data.startIndex"
  [attr.rewind]="scrollable"
  [attr.navigation]="scrollable"
  [attr.keyboard]="scrollable"
  (swiperslidechange)="onSlideChange($event)"
>
  @for (photo of photos; track photo.id; let i = $index) {
  <swiper-slide class="block h-full w-full">
    <img
      [src]="photoUrl.url(photo.objectKey)"
      [alt]="photoAlt(i)"
      [attr.loading]="i === data.startIndex ? 'eager' : 'lazy'"
      decoding="async"
      draggable="false"
      class="h-full w-full select-none object-contain"
    />
  </swiper-slide>
  }
</swiper-container>
```

Notlar:

- `object-contain` bileşenin varlık sebebi (spec).
- Nokta sayfalama yok; `pagination` attribute'u hiç verilmiyor.
- `keyboard`: masaüstünde ok tuşlarıyla gezinme; Escape'i CDK kapatıyor. Satır içi galeri keyboard vermiyor, çakışma yok.
- Eager yüklenen slayt açılış slaytı (`data.startIndex`), 0 değil.

- [x] **Step 3: Servis**

```ts
import { inject, Service } from '@angular/core';
import { Dialog } from '@angular/cdk/dialog';
import { BoatPhotoOutputModel, PhotoLightboxData } from '@models';
import { PhotoLightbox } from './photo-lightbox';

/**
 * Lightbox'ı açan tek kapı. `HlmDialogService` değil CDK `Dialog`:
 * Helm içeriği kart görünümlü `HlmDialogContent`'e sarıyor (bg-popover, p-4,
 * rounded-xl, max-w-*) — tam ekran siyah yüzey bunların hepsini ezmek zorunda
 * kalırdı. CDK kabı görsel olarak boş ama davranışı tam: odak tuzağı, kapanışta
 * odak geri dönüşü, Escape, kaydırma kilidi, aria rolleri.
 *
 * `@services` barrel'ında DEĞİL (confirm-dialog kuralı): bileşene referans
 * veren servis barrel'a girerse bileşen bağımlılığı barrel'ı import eden
 * herkese bulaşır.
 */
@Service()
export class PhotoLightboxService {
  dialog = inject(Dialog);

  open(photos: BoatPhotoOutputModel[], startIndex: number, alt: string): void {
    this.dialog.open<void, PhotoLightboxData>(PhotoLightbox, {
      data: { photos, startIndex, alt },
      ariaLabel: alt.trim() ? `${alt} fotoğrafları` : 'Fotoğraflar',
    });
  }
}
```

Not: panel boyutu config'de değil bileşen host'unda (`fixed inset-0`) — Tailwind sınıfları `panelClass` string'inde tarayıcıdan kaçabilir, host'ta güvenli. Backdrop CDK varsayılanı; panel opak siyah olduğu için görünmez, kalması zararsız (dışarı tıklama kapatma davranışını da CDK yönetir).

- [x] **Step 4: Derleme kontrolü**

Run: `npx ng build --configuration development 2>&1 | tail -5` (hızlı tip kontrolü için) veya doğrudan sonraki task'lere geçip Task 5'te topluca. Bileşen henüz hiçbir yerden import edilmediği için tree-shake edilir — hata görünmemesi normal; asıl doğrulama Task 4 sonrası.

### Task 3: `PhotoGallery`'ye `interactive` + `photoOpened`

**Files:**

- Modify: `src/app/shared/photo-gallery/photo-gallery.ts`
- Modify: `src/app/shared/photo-gallery/photo-gallery.html`

**Interfaces:**

- Produces: `interactive = input(false)`, `photoOpened = output<number>()` — Task 4 mobil tetiği bunlara bağlanır. Output, tıklanan slaytın `visible()` (sıralı) index'ini taşır.

- [x] **Step 1: TS — input/output ekle**

`photo-gallery.ts` içine (`alt` input'unun altına):

```ts
/** true iken slaytlar butona dönüşür; tıklanan index `photoOpened`'dan çıkar. */
interactive = input(false);

/** Tıklanan slaytın `visible()` içindeki index'i — lightbox açılış slaytı. */
photoOpened = output<number>();
```

`output` import'u `@angular/core`'dan eklenecek (`input`'un yanına).

- [x] **Step 2: Şablon — slayt içeriğini koşullu butona sar**

`photo-gallery.html`'de `swiper-slide` içi şu hale gelir (img iki dalda tekrar eder — Angular'da koşullu wrapper yok, `@if` dalları tam içerik taşır):

```html
<swiper-slide class="block h-full w-full">
  @if (interactive()) {
  <!-- Slayt butonu: swiper sürüklemeyi yutar, tıklama yalnızca kaydırma
         olmadığında düşer (preventClicks varsayılanı). Yalnızca görünür slayt
         tıklanabildiği için index doğal olarak doğru gelir. -->
  <button
    type="button"
    class="block h-full w-full cursor-pointer"
    [attr.aria-label]="'Tam ekran aç — ' + photoAlt(i)"
    (click)="photoOpened.emit(i)"
  >
    <img
      [src]="photoUrl.url(photo.objectKey)"
      [alt]="photoAlt(i)"
      [attr.loading]="i === 0 ? 'eager' : 'lazy'"
      decoding="async"
      draggable="false"
      class="h-full w-full select-none object-cover"
    />
  </button>
  } @else {
  <img
    [src]="photoUrl.url(photo.objectKey)"
    [alt]="photoAlt(i)"
    [attr.loading]="i === 0 ? 'eager' : 'lazy'"
    decoding="async"
    draggable="false"
    class="h-full w-full cursor-grab select-none object-cover active:cursor-grabbing"
  />
  }
</swiper-slide>
```

Market kartları ve `my-boats` `interactive` vermez → `@else` dalı bugünkü markup'ın aynısı, davranışları değişmez (kart linki içine buton girmez).

- [x] **Step 3: Mevcut testleri koştur**

Run: `npx ng test --include src/app/shared/photo-gallery -- --watch=false`
Expected: hepsi geçer (varsayılan dal markup'ı birebir korundu). Kırılan olursa asgari uyarla, yeni test ekleme.

### Task 4: `boat-detail` tetikleri

**Files:**

- Modify: `src/app/features/market/boat-detail/boat-detail.ts`
- Modify: `src/app/features/market/boat-detail/boat-detail.html`

**Interfaces:**

- Consumes: `PhotoLightboxService.open(photos, startIndex, alt)` (Task 2), `PhotoGallery.interactive`/`photoOpened` (Task 3)

- [x] **Step 1: TS — servis + `openLightbox`**

`boat-detail.ts`:

- Import: `import { PhotoLightboxService } from '../../../shared/photo-lightbox/photo-lightbox.service';` (barrel yok — bilinçli, `PhotoGallery` import'uyla aynı stil).
- Inject (diğer inject'lerin yanına): `lightbox = inject(PhotoLightboxService);`
- Metot (`tileClass`'ın yakınına):

```ts
/** index: `photos()` (sıralı) içindeki konum — kapak 0, karolar i+1, çip 5. */
openLightbox(index: number): void {
  const b = this.boat();
  if (!b) return;
  this.lightbox.open(this.photos(), index, b.name);
}
```

- `coverClass` yalnızca grid konumunu döndürür hale gelir (görsel sınıflar şablondaki `img`'a taşınıyor, Step 2):

```ts
coverClass = computed(() =>
  this.tiles().length === 0 ? 'col-span-4 row-span-2' : 'col-span-2 row-span-2',
);
```

- [x] **Step 2: Şablon — mobil galeri**

```html
<app-photo-gallery
  [photos]="b.photos"
  [alt]="b.name"
  class="aspect-[4/3] w-full lg:hidden"
  [interactive]="true"
  (photoOpened)="openLightbox($event)"
/>
```

- [x] **Step 3: Şablon — mozaik kapak butonu**

Kapak `@if` dalı şu olur (grid çocuğu artık buton; `coverClass` grid konumu, görsel sınıflar img'da):

```html
@if (cover(); as coverPhoto) {
<button
  type="button"
  [class]="'relative cursor-pointer ' + coverClass()"
  aria-label="1. fotoğrafı tam ekran aç"
  (click)="openLightbox(0)"
>
  <img
    [src]="photoUrl.url(coverPhoto.objectKey)"
    [alt]="b.name + ' — kapak fotoğrafı'"
    loading="eager"
    class="h-full w-full object-cover"
  />
</button>
} @else { … mevcut boş durum aynen … }
```

Etiket dili notu: spec "Fotoğraf {N}'yi" yazıyor ama `'yi` eki sayıya göre değişir (1'i, 3'ü, 6'yı…); "{N}. fotoğrafı …" kalıbı her sayıda doğru — bilinçli sapma.

- [x] **Step 4: Şablon — karo butonları + kardeş çip**

```html
@for (tile of tiles(); track tile.id; let i = $index) {
<div [class]="tileClass(i)">
  <button
    type="button"
    class="block h-full w-full cursor-pointer"
    [attr.aria-label]="i + 2 + '. fotoğrafı tam ekran aç'"
    (click)="openLightbox(i + 1)"
  >
    <img
      [src]="photoUrl.url(tile.objectKey)"
      [alt]="b.name + ' — fotoğraf ' + (i + 2)"
      loading="lazy"
      decoding="async"
      class="h-full w-full object-cover"
    />
  </button>
  <!-- Çip karo butonunun KARDEŞİ (iç içe buton olmaz) ve "gerisini göster"
         işi görür: ilk gizli fotoğraftan (index 5) açar. -->
  @if (extraCount() > 0 && i === tiles().length - 1) {
  <button
    type="button"
    class="absolute bottom-2 end-2 flex min-h-10 cursor-pointer items-center rounded-md bg-white/90 px-3 text-xs font-medium hover:bg-white"
    (click)="openLightbox(5)"
  >
    +{{ extraCount() }} fotoğraf
  </button>
  }
</div>
}
```

Çip `min-h-10` (40px): dokunma hedefi kuralı; `span`ken `px-2 py-1`'di, buton olunca büyüdü.

- [x] **Step 5: boat-detail testlerini koştur**

Run: `npx ng test --include src/app/features/market/boat-detail -- --watch=false`
Expected: geçer. Mozaik testleri `img`/çip arıyorsa buton sarmalayıcı yüzünden kırılabilir — asgari uyarla (ör. selector güncelle), yeni test ekleme.

### Task 5: Doğrulama (commit YOK)

- [x] **Step 1: Tam test koşusu**

Run: `npm test -- --watch=false`
Expected: 90/91 (dashboard-shell'deki 1 eski hata normal), yeni kırık yok.

- [x] **Step 2: Prettier**

Run: `npx prettier --write` (değişen/yeni dosyalar) sonra `npx prettier --check .`
Expected: "All matched files use Prettier code style!"

- [x] **Step 3: Build + bundle kontrolü**

Run: `npm run build`
Expected: hata yok, **başlangıç bundle bütçe uyarısı yok** (sonner dersi). Swiper zaten market chunk'ında, CDK dialog spartan üzerinden yüklü; boat-detail lazy — başlangıç bundle'ına ek yük beklenmiyor. Çıktıdaki initial bundle boyutunu bir önceki build'le kıyasla ve raporla.

- [x] **Step 4: Working tree'yi olduğu gibi bırak**

`git status` çıktısını raporla; **commit atma** — kullanıcı inceleyecek.
