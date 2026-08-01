# Teknelerim Mobile-First Liste — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Partner panelindeki Teknelerim sayfasını masaüstü tablosundan mobile-first yönetim kartı listesine çevirmek.

**Architecture:** Tek sayfa değişikliği: `my-boats.html`'deki `hlmTable` silinir, yerine tek sütun taban / `sm:2` / `lg:3` sütunlu kart grid'i gelir. Kart inline yazılır (ayrı bileşen yok), market kartının galeri + `swallowSwiperClick` deseni kopyalanır. Komponent TS'ine yalnızca `publicUrl` ve `swallowSwiperClick` eklenir.

**Tech Stack:** Angular 22 (signals, `@for`/`@if`, inline template yok), Tailwind v4, spartan/ui `HlmButton`, mevcut `PhotoGallery` bileşeni, Vitest (yalnızca mevcut spec'in asgari uyarlaması).

**Spec:** `docs/superpowers/specs/2026-08-01-my-boats-mobile-first-design.md`

## Global Constraints

- Mobile-first: taban sınıflar mobil düzeni tarif eder; `sm:` / `lg:` yalnızca büyütür (CLAUDE.md kuralı).
- **Yeni test yazılmaz** (proje kararı, 2026-08-01). `my-boats.spec.ts` silinmez; yalnızca suite'i yeşil tutacak asgari seçici değişikliği yapılır. Yeni test senaryosu, yeni assertion eklenmez.
- Angular 22 konvansiyonları: `standalone`/`OnPush` yazılmaz, erişim belirteci (`private`/`readonly`) yazılmaz, `inject()` kullanılır.
- URL segmentleri `routes.const.ts` sabitlerinden gelir; string literal yazılmaz.
- Arayüz metinleri Türkçe: "Yayında değil", "İlanı gör", "Fotoğraflar", "Yeni tekne ekle" — birebir bu yazımlar.
- Interface/model tanımı eklenmez (mevcut `BoatOutputModel` yeterli).

---

### Task 1: Kart listesine geçiş (`my-boats.ts` + `my-boats.html`)

**Files:**
- Modify: `src/app/features/provider/boats/my-boats/my-boats.ts`
- Modify: `src/app/features/provider/boats/my-boats/my-boats.html`

**Interfaces:**
- Consumes: `PhotoGallery` (`[photos]`, `[alt]`, host'a `class` ile ebat), `HlmButton` (`hlmBtn`, `variant`), `makeBoatSlug(name, id)`, `ROUTE_MARKET.boatDetail`, mevcut `photosUrl(boatId)`.
- Produces: `publicUrl(boat: BoatOutputModel): string[]` ve `swallowSwiperClick(event: Event): void` — yalnızca bu sayfanın şablonu kullanır. Kart kök elemanı `<article>` — Task 2'deki spec seçicisi buna dayanır.

İki dosya birlikte değişmek zorunda: `HlmTableImports` TS'ten çıkınca şablondaki `hlmTable` direktifleri derlenmez; şablon değişmeden TS değişikliği build'i kırar.

- [ ] **Step 1: `my-boats.ts`'i güncelle**

Dosyanın tam yeni içeriği:

```ts
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { HlmButton } from '@ui/button';
import { BoatType, RentalType } from '@enums';
import { BoatOutputModel } from '@models';
import { BoatService, HarborService } from '@services';
import { PhotoGallery } from '../../../../shared/photo-gallery/photo-gallery';
import { ROUTE_MARKET, ROUTE_PARTNER } from '../../../../core/routes.const';
import { BOAT_TYPE_LABELS, RENTAL_TYPE_LABELS } from '../../../../core/util/boat-labels';
import { formatBoatLocation } from '../../../../core/util/boat-location';
import { makeBoatSlug } from '../../../../core/util/boat-slug';

@Component({
  selector: 'app-my-boats',
  imports: [RouterLink, HlmButton, PhotoGallery],
  templateUrl: './my-boats.html',
})
export class MyBoats {
  boatService = inject(BoatService);
  harborService = inject(HarborService);

  newBoatUrl = [
    '/',
    ROUTE_PARTNER.main,
    ROUTE_PARTNER.dashboard,
    ROUTE_PARTNER.boats,
    ROUTE_PARTNER.boatNew,
  ];

  /** Kartın birincil hedefi — `/partner/dashboard/teknelerim/{id}/fotograflar`. */
  photosUrl(boatId: number): (string | number)[] {
    return [
      '/',
      ROUTE_PARTNER.main,
      ROUTE_PARTNER.dashboard,
      ROUTE_PARTNER.boats,
      boatId,
      ROUTE_PARTNER.boatPhotos,
    ];
  }

  /** Marketteki herkese açık ilan — yalnızca yayındaki teknelerde gösterilir. */
  publicUrl(boat: BoatOutputModel): string[] {
    return ['/', ROUTE_MARKET.boatDetail, makeBoatSlug(boat.name, boat.id)];
  }

  boatsResource = rxResource({ stream: () => this.boatService.getMine() });
  citiesResource = rxResource({ stream: () => this.harborService.getAll() });

  loading = computed(() => this.boatsResource.isLoading());
  failed = computed(() => this.boatsResource.status() === 'error');

  /** Oturumdaki partner'ın ilanları — süzme backend'de, `GET /Boats/mine`. */
  boats = computed(() => (this.boatsResource.hasValue() ? this.boatsResource.value() : []));

  cities = computed(() => (this.citiesResource.hasValue() ? this.citiesResource.value() : []));

  boatTypeLabel(type: BoatType): string {
    return BOAT_TYPE_LABELS[type] ?? type;
  }

  rentalTypeLabel(type: RentalType): string {
    return RENTAL_TYPE_LABELS[type] ?? type;
  }

  /** Listede gösterilen konum: bağlı olduğu limanın adı, yanında şehir. */
  location(boat: BoatOutputModel): string {
    return formatBoatLocation(boat, this.cities(), '—');
  }

  /**
   * Swiper nokta/sürükleme tıklamasında preventDefault ediyor ama propagation'ı
   * durdurmuyor; RouterLink ise defaultPrevented'a bakmıyor. Burada kesilmezse
   * karttaki noktaya dokunmak fotoğraf sayfasına götürürdü.
   */
  swallowSwiperClick(event: Event): void {
    if (event.defaultPrevented) event.stopPropagation();
  }
}
```

Öncekine göre farklar: `HlmTableImports` importu ve `imports` dizisindeki kaydı çıktı; `ROUTE_MARKET`, `makeBoatSlug` importları ve `publicUrl` / `swallowSwiperClick` metotları girdi. Diğer her üye aynen korunuyor.

- [ ] **Step 2: `my-boats.html`'i güncelle**

Dosyanın tam yeni içeriği:

```html
<div class="flex items-center justify-between">
  <h1 class="text-2xl font-semibold">Teknelerim</h1>
  <a hlmBtn [routerLink]="newBoatUrl">Yeni tekne ekle</a>
</div>

@if (loading()) {
  <p class="mt-6 text-sm text-muted-foreground">İlanlar yükleniyor…</p>
} @else if (failed()) {
  <p class="mt-6 text-sm text-destructive">
    İlanlar yüklenemedi. Sayfayı yenileyip tekrar deneyin.
  </p>
} @else if (boats().length === 0) {
  <div class="mt-6 rounded-lg border border-dashed border-input p-10 text-center">
    <p class="font-medium">Henüz ilanınız yok</p>
    <p class="mt-1 text-sm text-muted-foreground">
      İlk teknenizi ekleyin, rezervasyon almaya başlayın.
    </p>
    <a hlmBtn class="mt-4" [routerLink]="newBoatUrl">Yeni tekne ekle</a>
  </div>
} @else {
  <!-- Taban düzen tek sütun (mobil); sm/lg yalnızca sütun sayısını artırır. -->
  <div class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    @for (boat of boats(); track boat.id) {
      <article class="overflow-hidden rounded-xl border border-border bg-background">
        <!-- Kartın tamamı bugünkü tek yönetim işine, fotoğraf yönetimine gider.
             Düzenleme geldiğinde yalnızca bu linkin hedefi değişecek (spec: gelecek uyumu). -->
        <a
          [routerLink]="photosUrl(boat.id)"
          class="block"
          [attr.aria-label]="boat.name + ' — fotoğrafları yönet'"
        >
          <span class="block" (click)="swallowSwiperClick($event)">
            <app-photo-gallery [photos]="boat.photos" [alt]="boat.name" class="aspect-[5/4] w-full" />
          </span>

          <div class="p-3">
            <div class="flex items-center justify-between gap-2">
              <span class="truncate font-medium">{{ boat.name }}</span>
              @if (!boat.isActive) {
                <span
                  class="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800"
                >
                  Yayında değil
                </span>
              }
            </div>
            <span class="mt-1 block text-sm text-muted-foreground">{{ location(boat) }}</span>
            <span class="mt-1 block text-sm text-muted-foreground">
              {{ boatTypeLabel(boat.boatType) }} · {{ rentalTypeLabel(boat.rentalType) }} ·
              {{ boat.totalCapacity }} kişi
            </span>
          </div>
        </a>

        <!-- Aksiyon şeridi linkin KARDEŞİ: link içinde link geçersiz HTML olurdu.
             Düzenleme geldiğinde "Düzenle" buraya birincil buton olarak eklenecek. -->
        <div class="flex items-center gap-2 border-t border-border p-3">
          <a hlmBtn variant="outline" class="h-10 px-4" [routerLink]="photosUrl(boat.id)">Fotoğraflar</a>
          @if (boat.isActive) {
            <a hlmBtn variant="ghost" class="h-10 px-4" [routerLink]="publicUrl(boat)">İlanı gör</a>
          }
        </div>
      </article>
    }
  </div>
}
```

Dikkat noktaları:

- Şeritteki butonlar `class="h-10 px-4"` taşır — hlmBtn'nin varsayılanı `h-8` (32px) dokunmatik hedef için yetersiz; 40px'e bilinçli yükseltme (CLAUDE.md: parmakla basılabilir boyut).
- "İlanı gör" yalnızca `boat.isActive` iken render edilir (spec kararı).
- Rozet yalnızca pasifken render edilir; yayındaki tekne rozet taşımaz.
- Başlık satırı, yükleniyor/hata/boş durum blokları öncekiyle birebir aynı.

- [ ] **Step 3: Derlemenin kırılmadığını doğrula, DOM testlerinin beklenen şekilde kırıldığını gör**

Run: `npx ng test --include src/app/features/provider/boats/my-boats --watch=false`

Expected: `konumu bağlı olduğu liman ve şehir olarak gösterir` PASS;
`kendi tekneleri ucundan gelen ilanları listeler` FAIL (`tbody tr` artık yok) ve
`ilan yoksa boş durum gösterir` FAIL (`tbody` seçicisi) — ikisi Task 2'de düzelecek.
Şablon derleme hatası (`hlmTable` benzeri) görürsen Step 1/2 eksik demektir; testin
kendisini düzeltmeye kalkma.

### Task 2: Mevcut spec'in asgari uyarlaması + suite doğrulaması + commit

**Files:**
- Modify: `src/app/features/provider/boats/my-boats/my-boats.spec.ts:59-74`

**Interfaces:**
- Consumes: Task 1'in kart kök elemanı `<article>`.
- Produces: yeşil test suite'i.

Yeni test/assertion eklenmez; yalnızca tabloya bağlı iki seçici kart eşdeğerine çevrilir.

- [ ] **Step 1: `kendi tekneleri ucundan gelen ilanları listeler` testindeki seçiciyi değiştir**

`my-boats.spec.ts` içinde şu iki satır:

```ts
    const rows = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
```

şununla değişir (değişken adı da karta uyarlanır, `textContent` assertion'ı aynen kalır):

```ts
    const cards = fixture.nativeElement.querySelectorAll('article');
    expect(cards.length).toBe(2);
```

Hemen altındaki `expect(rows[0].textContent).toContain('Mavi Rüzgar');` satırı
`expect(cards[0].textContent).toContain('Mavi Rüzgar');` olur.

- [ ] **Step 2: `ilan yoksa boş durum gösterir` testindeki seçiciyi değiştir**

```ts
    expect(fixture.nativeElement.querySelector('tbody')).toBeNull();
```

şu olur:

```ts
    expect(fixture.nativeElement.querySelector('article')).toBeNull();
```

- [ ] **Step 3: Sayfa testlerinin geçtiğini doğrula**

Run: `npx ng test --include src/app/features/provider/boats/my-boats --watch=false`
Expected: 3/3 PASS.

- [ ] **Step 4: Tüm suite'i çalıştır**

Run: `npm test -- --watch=false`
Expected: tamamı PASS — başka dosya bu sayfanın DOM'una bağlı değil ama regresyonu
burada yakalamak ucuz.

- [ ] **Step 5: Commit**

```bash
git add src/app/features/provider/boats/my-boats/
git commit -m "Convert my-boats to a mobile-first card list"
```

## Self-check

- Spec'teki her bölümün karşılığı: sayfa düzeni → Task 1 Step 2; yönetim kartı
  (galeri, rozet, meta, aksiyon şeridi, `isActive` koşulu) → Task 1 Step 2;
  komponent değişiklikleri (`publicUrl`, `HlmTableImports` çıkışı) → Task 1 Step 1;
  durumlar → değişmeden korunuyor (Task 1 Step 2 aynen taşıyor); test kararı →
  Task 2. Gelecek uyumu bölümü bilinçli olarak kapsam dışı (yalnızca yorum satırı
  olarak işaretlendi).
- Tip tutarlılığı: `publicUrl` `string[]` döner (`makeBoatSlug` string üretir),
  `photosUrl` `(string | number)[]` (id sayı) — ikisi de şablonda `[routerLink]`'e
  veriliyor, ikisi de Task 1'de tanımlı.
