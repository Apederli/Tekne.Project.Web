# Tekne detay sayfası — uygulama planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Foto mozaikli (masaüstü) / kaydırmalı galerili (mobil) herkese açık tekne detay sayfası; kartlar `{ad}-{id}` slug'ıyla detaya bağlanır.

**Architecture:** Slug üretme/ayrıştırma saf fonksiyonlar olarak `core/util`'de yaşar; detay sayfası slug'dan id çıkarıp `BoatService.getById` ile çeker (`rxResource`), galeri sırası her yerdeki gibi `sortBoatPhotos`. Mozaik/mobil galeri geçişi saf CSS — `isPlatformBrowser` dallanması yok, hydration riski yok.

**Tech Stack:** Angular 22 (signals, `rxResource`, `withComponentInputBinding`), Tailwind v4, mevcut `PhotoGallery` (Swiper Element), Vitest + `HttpTestingController`.

**Kaynak spec:** [docs/superpowers/specs/2026-08-01-boat-detail-design.md](../specs/2026-08-01-boat-detail-design.md)

## Global Constraints

- Angular 22: `standalone`/`changeDetection` yazma; üyelerde `private`/`protected`/`public`/`readonly` yok; `inject()`, `input()`/`output()`, `computed()`, `@if`/`@for`, `class` binding (`ngClass` yok).
- Mobile-first: taban sınıflar mobil, `lg:` yalnızca büyütür. Mozaik `hidden lg:grid`, mobil galeri `lg:hidden`.
- `try/catch` yok — hata mesajını `errorInterceptor` gösterir; sayfa yalnızca "bulunamadı" durumunu render eder.
- Slug'da gerçek kaynak **id**; ad kısmı doğrulanmaz. Türkçe sadeleştirme: ç→c, ğ→g, ı→i, ö→o, ş→s, ü→u (büyükleriyle).
- Interface/tip tanımı bileşen dosyasına yazılmaz.
- **Commit atma.** Kullanıcı commit'leri kendisi atıyor; her task'ın sonunda yalnızca `git add` ile stage'le.
- Testler Vitest: `npx ng test --include <yol> --watch=false`.

## File Structure

| Dosya | Sorumluluk |
|---|---|
| `src/app/core/util/boat-slug.ts` (+ `boat-slug.spec.ts`) | slug üret/ayrıştır — saf fonksiyonlar |
| `src/app/core/util/boat-labels.ts` | `BoatType`/`RentalType` → Türkçe etiket haritaları (my-boats'taki kopya buraya taşınır) |
| `src/app/features/market/boat-search/boat-card.ts/.html` (+ yeni `boat-card.spec.ts`) | kartın tamamı detaya link; kalp navigasyonu yutar |
| `src/app/features/market/boat-detail/boat-detail.ts/.html` (+ yeni `boat-detail.spec.ts`) | mozaik + mobil galeri + künye + bulunamadı + sayfa başlığı |
| `src/app/features/provider/boats/my-boats/my-boats.ts` | yerel etiket haritaları `boat-labels`'a taşındıktan sonra oradan import |

---

### Task 1: Slug yardımcıları

**Files:**
- Create: `src/app/core/util/boat-slug.ts`
- Test: `src/app/core/util/boat-slug.spec.ts`

**Interfaces:**
- Consumes: yok.
- Produces: `makeBoatSlug(name: string, id: number): string`, `parseBoatIdFromSlug(slug: string): number | null`.

- [ ] **Step 1: Write the failing test**

`boat-slug.spec.ts`:

```ts
import { makeBoatSlug, parseBoatIdFromSlug } from './boat-slug';

describe('makeBoatSlug', () => {
  it('adı küçük harfe çevirip tireler, id’yi sona ekler', () => {
    expect(makeBoatSlug('Mavi Rüzgar', 5)).toBe('mavi-ruzgar-5');
  });

  it('tüm Türkçe karakterleri sadeleştirir', () => {
    expect(makeBoatSlug('Çılgın Şövalye Öykü ĞÜİI', 12)).toBe('cilgin-sovalye-oyku-guii-12');
  });

  it('harf/rakam dışını tireye çevirir, ardışık tireleri tekler, uçları kırpar', () => {
    expect(makeBoatSlug('  Deniz  Yıldızı!! ', 3)).toBe('deniz-yildizi-3');
  });

  it('addan geriye bir şey kalmazsa yalnızca id döner', () => {
    expect(makeBoatSlug('***', 9)).toBe('9');
  });
});

describe('parseBoatIdFromSlug', () => {
  it('sondaki sayıyı çözer', () => {
    expect(parseBoatIdFromSlug('mavi-ruzgar-5')).toBe(5);
  });

  it('ad içindeki sayıya aldanmaz, en sondakini alır', () => {
    expect(parseBoatIdFromSlug('poyraz-2-7')).toBe(7);
  });

  it('üretilen slug ile gidiş-dönüş tutarlıdır', () => {
    expect(parseBoatIdFromSlug(makeBoatSlug('Ada Rüyası', 41))).toBe(41);
  });

  it('sayı yoksa null döner', () => {
    expect(parseBoatIdFromSlug('tekne')).toBeNull();
    expect(parseBoatIdFromSlug('')).toBeNull();
  });

  it('sıfır ve negatif id geçersizdir', () => {
    expect(parseBoatIdFromSlug('abc-0')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx ng test --include src/app/core/util --watch=false`
Expected: FAIL — `./boat-slug` modülü bulunamıyor.

- [ ] **Step 3: Write minimal implementation**

`boat-slug.ts`:

```ts
/**
 * Detay URL'i slug'ı: `{ad-slug}-{id}` (örn. `mavi-ruzgar-5`).
 *
 * Gerçek kaynak id'dir — ad kısmı yalnızca SEO içindir ve hiçbir yerde
 * doğrulanmaz. Bu yüzden ad değişse de eski linkler çalışmaya devam eder.
 */

const TURKISH_TO_ASCII: Record<string, string> = {
  ç: 'c',
  ğ: 'g',
  ı: 'i',
  ö: 'o',
  ş: 's',
  ü: 'u',
};

export function makeBoatSlug(name: string, id: number): string {
  // `toLocaleLowerCase('tr')`: ASCII "I" Türkçe kuralla "ı"ya iner, harita
  // onu da "i"ye çevirir — "ISPARTA" → "isparta".
  const base = name
    .toLocaleLowerCase('tr')
    .replace(/[çğıöşü]/g, (ch) => TURKISH_TO_ASCII[ch])
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return base ? `${base}-${id}` : String(id);
}

/** Sondaki `-{sayı}` parçasını çözer; yoksa veya pozitif değilse `null`. */
export function parseBoatIdFromSlug(slug: string): number | null {
  const match = /(\d+)$/.exec(slug);
  if (!match) return null;
  const id = Number(match[1]);
  return id > 0 ? id : null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx ng test --include src/app/core/util --watch=false`
Expected: PASS (9 test).

- [ ] **Step 5: Stage (commit YOK)**

```bash
git add src/app/core/util
```

---

### Task 2: Kart detaya bağlanır

**Files:**
- Modify: `src/app/features/market/boat-search/boat-card.ts`
- Modify: `src/app/features/market/boat-search/boat-card.html`
- Test (yeni): `src/app/features/market/boat-search/boat-card.spec.ts`

**Interfaces:**
- Consumes: `makeBoatSlug` (Task 1); `ROUTE_MARKET.boatDetail` (`'tekne'`).
- Produces: kartta `detailUrl = computed(() => (string)[])`; `toggleFavorite(event: Event)` imzası (parametre eklendi).

- [ ] **Step 1: Write the failing test**

`boat-card.spec.ts` (yeni dosya):

```ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { BoatType, RentalType } from '@enums';
import { BoatOutputModel } from '@models';
import { BoatCard } from './boat-card';

/** Fotoğrafsız tekne: galeri boş durumunu çizer, jsdom'da Swiper'a hiç girilmez. */
function boat(): BoatOutputModel {
  return {
    id: 5,
    name: 'Mavi Rüzgar',
    boatType: BoatType.Sailboat,
    rentalType: RentalType.Hourly,
    lengthInMeters: 12,
    diningCapacity: 0,
    totalCapacity: 10,
    swimmingCapacity: 8,
    cityId: 1,
    primaryHarborId: 3,
    harborIds: [3],
    ownerId: 7,
    isActive: true,
    photos: [],
  };
}

describe('BoatCard', () => {
  let fixture: ComponentFixture<BoatCard>;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    fixture = TestBed.createComponent(BoatCard);
    fixture.componentRef.setInput('boat', boat());
    fixture.detectChanges();
  });

  it('kartın tamamı slug’lı detay linkidir', () => {
    const link = fixture.nativeElement.querySelector('a');
    expect(link?.getAttribute('href')).toBe('/tekne/mavi-ruzgar-5');
  });

  it('kalp tıklaması favoriyi değiştirir, navigasyon tetiklemez', () => {
    const before = TestBed.inject(Router).url;

    fixture.nativeElement.querySelector('button').click();
    fixture.detectChanges();

    expect(fixture.componentInstance.favorite()).toBe(true);
    expect(TestBed.inject(Router).url).toBe(before);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx ng test --include src/app/features/market/boat-search --watch=false`
Expected: FAIL — `<a>` yok (`href` null) ve `toggleFavorite` çağrısı navigasyonu engellemiyor.

- [ ] **Step 3: Write minimal implementation**

`boat-card.ts` — import ve üyeler:

```ts
import { Component, computed, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideHeart } from '@ng-icons/lucide';
import { BoatOutputModel } from '@models';
import { PhotoGallery } from '../../../shared/photo-gallery/photo-gallery';
import { makeBoatSlug } from '../../../core/util/boat-slug';
import { ROUTE_MARKET } from '../../../core/routes.const';
```

`imports: [NgIcon, PhotoGallery, RouterLink]` olur. Sınıfa ekle / değiştir:

```ts
  detailUrl = computed(() => [
    '/',
    ROUTE_MARKET.boatDetail,
    makeBoatSlug(this.boat().name, this.boat().id),
  ]);

  /**
   * Kalp, kartı saran linkin İÇİNDE — tıklamanın linke kabarcıklanması ve
   * varsayılan navigasyon burada kesilir, yoksa favoriye her dokunuş detaya
   * götürürdü.
   */
  toggleFavorite(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.favorite.update((f) => !f);
  }
```

`boat-card.html` — kök `<div>` içeriği `<a>` ile sarılır; overlay ve künye aynen kalır:

```html
<div class="overflow-hidden rounded-xl border border-border bg-background">
  <a [routerLink]="detailUrl()" class="block">
    <app-photo-gallery [photos]="boat().photos" [alt]="boat().name" class="aspect-[5/4] w-full">
      <!-- Noktalar z-10'da; overlay z-20 ile üstte. -->
      <div class="absolute inset-x-1.5 top-1.5 z-20 flex items-start justify-between">
        <!-- TODO(backend): Boat modelinde anında rezervasyon alanı yok; rozet test için sabit. -->
        <span
          class="rounded-full bg-sky-600 px-3 py-1.5 text-xs text-white shadow-sm shadow-slate-500"
        >
          ⚡ Anında Rezerve
        </span>

        <button
          type="button"
          class="rounded-full p-1 transition-transform duration-100 ease-in active:scale-90"
          (click)="toggleFavorite($event)"
        >
          <!-- Lucide çizgi seti: dolu/boş ayrımı fill ile. Yarı saydam dolgu + beyaz
               çizgi, fotoğraf üzerinde her zeminde okunur (teknevia kalıbı). -->
          <ng-icon
            name="lucideHeart"
            size="26"
            class="drop-shadow-md"
            [class]="
              favorite() ? 'text-red-500 [&_svg]:fill-current' : 'text-white [&_svg]:fill-black/30'
            "
          />
          <span class="sr-only">
            {{ favorite() ? 'Favorilerden çıkar' : 'Favorilere ekle' }}
          </span>
        </button>
      </div>
    </app-photo-gallery>

    <div class="p-3">
      <div class="flex items-center justify-between gap-2">
        <span class="truncate font-medium">{{ boat().name }}</span>
        <span class="shrink-0 text-sm text-muted-foreground">{{ boat().totalCapacity }} kişi</span>
      </div>
      @if (location()) {
        <span class="mt-1 block text-sm text-muted-foreground">{{ location() }}</span>
      }
    </div>
  </a>
</div>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx ng test --include src/app/features/market/boat-search --watch=false`
Expected: PASS (2 test).

- [ ] **Step 5: Stage (commit YOK)**

```bash
git add src/app/features/market/boat-search
```

---

### Task 3: Detay sayfası

**Files:**
- Create: `src/app/core/util/boat-labels.ts`
- Modify: `src/app/features/provider/boats/my-boats/my-boats.ts` (yerel etiket haritaları silinir, `boat-labels`'tan import edilir)
- Modify: `src/app/features/market/boat-detail/boat-detail.ts` (placeholder tamamen değişir; `templateUrl`'e geçer)
- Create: `src/app/features/market/boat-detail/boat-detail.html`
- Test (yeni): `src/app/features/market/boat-detail/boat-detail.spec.ts`

**Interfaces:**
- Consumes: `parseBoatIdFromSlug` (Task 1); `BoatService.getById(id): Observable<BoatOutputModel>`; `sortBoatPhotos` (`@models`); `PhotoUrlService.url`; `HarborService.getAll`.
- Produces: `boat-labels.ts` → `BOAT_TYPE_LABELS: Record<BoatType, string>`, `RENTAL_TYPE_LABELS: Record<RentalType, string>` (değerler my-boats'takiyle birebir: Yelkenli, Motor yat, Katamaran, Gulet; Saatlik, Günlük).

- [ ] **Step 1: `boat-labels.ts`'i çıkar**

`src/app/core/util/boat-labels.ts`:

```ts
import { BoatType, RentalType } from '@enums';

/**
 * Enum → kullanıcıya görünen Türkçe etiket. Üçüncü kopya çıkmadan tek yere
 * alındı (my-boats + boat-detail kullanıyor); form seçenekleri kendi
 * `{value, label}` dizilerini bu haritalardan bağımsız kurmayı sürdürür.
 */
export const BOAT_TYPE_LABELS: Record<BoatType, string> = {
  [BoatType.Sailboat]: 'Yelkenli',
  [BoatType.MotorYacht]: 'Motor yat',
  [BoatType.Catamaran]: 'Katamaran',
  [BoatType.Gulet]: 'Gulet',
};

export const RENTAL_TYPE_LABELS: Record<RentalType, string> = {
  [RentalType.Hourly]: 'Saatlik',
  [RentalType.Daily]: 'Günlük',
};
```

`my-boats.ts`: dosya başındaki yerel `BOAT_TYPE_LABELS` / `RENTAL_TYPE_LABELS` sabitlerini sil, yerine
`import { BOAT_TYPE_LABELS, RENTAL_TYPE_LABELS } from '../../../../core/util/boat-labels';` ekle. Metotlar aynı kalır.

Run: `npx ng test --include src/app/features/provider/boats/my-boats --watch=false`
Expected: PASS — davranış değişmedi.

- [ ] **Step 2: Write the failing test**

`boat-detail.spec.ts` (yeni dosya):

```ts
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Title } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { BoatType, RentalType } from '@enums';
import { BoatOutputModel, BoatPhotoOutputModel } from '@models';

// jsdom Swiper'ın shadow DOM render'ını taşıyamıyor — photo-gallery.spec ile aynı sebep.
vi.mock('swiper/element/bundle', () => ({ register: () => {} }));
import { BoatDetail } from './boat-detail';

function photo(id: number, sortOrder: number, isMain = false): BoatPhotoOutputModel {
  return { id, objectKey: `boat-image/${id}.webp`, isMain, sortOrder };
}

function boat(photos: BoatPhotoOutputModel[]): BoatOutputModel {
  return {
    id: 5,
    name: 'Mavi Rüzgar',
    boatType: BoatType.Sailboat,
    rentalType: RentalType.Hourly,
    manufactureYear: 2019,
    lengthInMeters: 12,
    diningCapacity: 0,
    totalCapacity: 10,
    swimmingCapacity: 8,
    cityId: 1,
    primaryHarborId: 3,
    harborIds: [3],
    ownerId: 7,
    description: 'Ege koylarına günlük turlar.',
    isActive: true,
    photos,
  };
}

describe('BoatDetail', () => {
  let fixture: ComponentFixture<BoatDetail>;
  let http: HttpTestingController;

  function create(slug: string): void {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(BoatDetail);
    fixture.componentRef.setInput('slug', slug);
    fixture.detectChanges();
  }

  afterEach(() => http.verify());

  async function flush(model: BoatOutputModel): Promise<void> {
    http.expectOne((r) => r.url.endsWith('/Boats/5')).flush(model);
    http.expectOne((r) => r.url.endsWith('/Harbors')).flush([
      { cityId: 1, cityName: 'Muğla', harbors: [{ id: 3, name: 'Bodrum Limanı' }] },
    ]);
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('slug’daki id ile tekneyi çeker ve künyeyi çizer', async () => {
    create('mavi-ruzgar-5');
    await flush(boat([photo(1, 0, true)]));

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h1')?.textContent).toContain('Mavi Rüzgar');
    expect(el.textContent).toContain('Bodrum Limanı, Muğla');
    expect(el.textContent).toContain('Yelkenli');
    expect(el.textContent).toContain('10 kişi');
    expect(el.textContent).toContain('Ege koylarına günlük turlar.');
  });

  it('sayfa başlığına tekne adını yazar', async () => {
    create('mavi-ruzgar-5');
    await flush(boat([photo(1, 0, true)]));

    expect(TestBed.inject(Title).getTitle()).toBe('Mavi Rüzgar — Tekne');
  });

  it('5’ten çok fotoğrafta mozaik 5 görsel ve +N çipi gösterir', async () => {
    create('mavi-ruzgar-5');
    await flush(boat([0, 1, 2, 3, 4, 5, 6].map((i) => photo(i + 1, i, i === 0))));

    const mosaic = fixture.nativeElement.querySelector('[data-testid="mosaic"]');
    expect(mosaic.querySelectorAll('img').length).toBe(5);
    expect(mosaic.textContent).toContain('+2 fotoğraf');
  });

  it('tek fotoğrafta mozaikte yalnız kapak vardır, çip yoktur', async () => {
    create('mavi-ruzgar-5');
    await flush(boat([photo(1, 0, true)]));

    const mosaic = fixture.nativeElement.querySelector('[data-testid="mosaic"]');
    expect(mosaic.querySelectorAll('img').length).toBe(1);
    expect(mosaic.textContent).not.toContain('fotoğraf');
  });

  it('bozuk slug’da istek açmaz ve bulunamadı gösterir', () => {
    create('tekne');

    http.expectNone((r) => r.url.includes('/Boats/'));
    expect(fixture.nativeElement.textContent).toContain('Tekne bulunamadı');
  });

  it('404’te bulunamadı gösterir', async () => {
    create('mavi-ruzgar-5');
    http
      .expectOne((r) => r.url.endsWith('/Boats/5'))
      .flush({ message: 'yok' }, { status: 404, statusText: 'Not Found' });
    http.expectOne((r) => r.url.endsWith('/Harbors')).flush([]);
    await fixture.whenStable();
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Tekne bulunamadı');
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx ng test --include src/app/features/market/boat-detail --watch=false`
Expected: FAIL — mevcut placeholder'da `h1` "Tekne detayı" ve HTTP isteği yok.

- [ ] **Step 4: Write minimal implementation**

`boat-detail.ts` (dosya tamamen değişir):

```ts
import { Component, computed, effect, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { rxResource } from '@angular/core/rxjs-interop';
import { BoatOutputModel, CityHarborsOutputModel, sortBoatPhotos } from '@models';
import { BoatService, HarborService, PhotoUrlService } from '@services';
import { PhotoGallery } from '../../../shared/photo-gallery/photo-gallery';
import { BOAT_TYPE_LABELS } from '../../../core/util/boat-labels';
import { parseBoatIdFromSlug } from '../../../core/util/boat-slug';
import { ROUTE_MARKET } from '../../../core/routes.const';

/**
 * Herkese açık tekne detayı. Masaüstünde foto mozaiği, mobilde kaydırmalı
 * galeri — geçiş saf CSS, iki blok da DOM'da (hydration riski yok).
 */
@Component({
  selector: 'app-boat-detail',
  imports: [RouterLink, PhotoGallery],
  templateUrl: './boat-detail.html',
})
export class BoatDetail {
  boatService = inject(BoatService);
  harborService = inject(HarborService);
  photoUrl = inject(PhotoUrlService);
  title = inject(Title);

  /** `withComponentInputBinding` route parametresini doğrudan bağlar. */
  slug = input.required<string>();

  boatsUrl = ['/', ROUTE_MARKET.boats];

  /** Slug'un yalnızca sondaki id kısmı anlamlı — ad kısmı doğrulanmaz. */
  boatId = computed(() => parseBoatIdFromSlug(this.slug()));

  // `?? undefined`: id çözülemezse resource hiç istek açmaz (params undefined = bekle).
  boatResource = rxResource({
    params: () => this.boatId() ?? undefined,
    stream: ({ params }) => this.boatService.getById(params),
  });

  citiesResource = rxResource({ stream: () => this.harborService.getAll() });

  loading = computed(() => this.boatId() !== null && this.boatResource.isLoading());
  notFound = computed(() => this.boatId() === null || this.boatResource.status() === 'error');

  boat = computed(() => (this.boatResource.hasValue() ? this.boatResource.value() : null));

  /** Sıra her yerdeki gibi `sortBoatPhotos` — kapak başta. */
  photos = computed(() => sortBoatPhotos(this.boat()?.photos ?? []));

  cover = computed(() => this.photos()[0]);
  tiles = computed(() => this.photos().slice(1, 5));
  /** Mozaikte görünmeyen fotoğraf sayısı — "+N fotoğraf" çipi. */
  extraCount = computed(() => Math.max(0, this.photos().length - 5));

  cities = computed(() =>
    this.citiesResource.hasValue() ? this.citiesResource.value() : [],
  );

  /** "Bodrum Limanı, Muğla" — MyBoats.location kuralının aynısı. */
  location = computed(() => {
    const b = this.boat();
    if (!b) return '';
    const city = this.cities().find((c) => c.cityId === b.cityId);
    const harbor = harborName(city, b.primaryHarborId);
    if (!city) return harbor ?? '';
    return harbor ? `${harbor}, ${city.cityName}` : city.cityName;
  });

  typeLabel = computed(() => {
    const b = this.boat();
    return b ? BOAT_TYPE_LABELS[b.boatType] : '';
  });

  constructor() {
    // SEO: başlık tekne adına çekilir; Title servisi SSR'da da çalışır.
    effect(() => {
      const b = this.boat();
      if (b) this.title.setTitle(`${b.name} — Tekne`);
    });
  }
}

function harborName(
  city: CityHarborsOutputModel | undefined,
  harborId: number,
): string | undefined {
  return city?.harbors.find((h) => h.id === harborId)?.name;
}
```

`boat-detail.html`:

```html
@if (notFound()) {
  <div class="rounded-lg border border-dashed border-input p-10 text-center">
    <p class="font-medium">Tekne bulunamadı</p>
    <p class="mt-1 text-sm text-muted-foreground">İlan kaldırılmış veya bağlantı hatalı olabilir.</p>
    <a [routerLink]="boatsUrl" class="mt-4 inline-block text-sm underline">Teknelere dön</a>
  </div>
} @else if (loading()) {
  <p class="text-sm text-muted-foreground">Tekne yükleniyor…</p>
} @else if (boat(); as b) {
  <!-- Mobil: kaydırmalı galeri. Masaüstü: mozaik. Geçiş saf CSS. -->
  <app-photo-gallery [photos]="b.photos" [alt]="b.name" class="aspect-[4/3] w-full lg:hidden" />

  <div
    data-testid="mosaic"
    class="hidden aspect-[2/1] w-full gap-2 overflow-hidden rounded-xl lg:grid lg:grid-cols-4 lg:grid-rows-2"
  >
    @if (cover(); as coverPhoto) {
      <img
        [src]="photoUrl.url(coverPhoto.objectKey)"
        [alt]="b.name + ' — kapak fotoğrafı'"
        loading="eager"
        class="col-span-2 row-span-2 h-full w-full object-cover"
      />
    } @else {
      <div
        class="col-span-4 row-span-2 flex items-center justify-center rounded-xl border border-dashed border-input"
      >
        <p class="text-sm text-muted-foreground">Fotoğraf yok</p>
      </div>
    }

    @for (tile of tiles(); track tile.id; let i = $index) {
      <div class="relative">
        <img
          [src]="photoUrl.url(tile.objectKey)"
          [alt]="b.name + ' — fotoğraf ' + (i + 2)"
          loading="lazy"
          decoding="async"
          class="h-full w-full object-cover"
        />
        <!-- Tam ekran görüntüleyici sonraki tur — çip şimdilik bilgi amaçlı. -->
        @if (extraCount() > 0 && i === tiles().length - 1) {
          <span
            class="absolute bottom-2 end-2 rounded-md bg-white/90 px-2 py-1 text-xs font-medium"
          >
            +{{ extraCount() }} fotoğraf
          </span>
        }
      </div>
    }
  </div>

  <div class="mt-6">
    <h1 class="text-2xl font-semibold">{{ b.name }}</h1>
    @if (location()) {
      <p class="mt-1 text-slate-600">{{ location() }}</p>
    }
    <p class="mt-3 text-sm text-slate-600">
      {{ typeLabel() }} · {{ b.totalCapacity }} kişi · {{ b.lengthInMeters }} m@if (b.manufactureYear) { · {{ b.manufactureYear }}}
    </p>
    @if (b.description) {
      <p class="mt-4 max-w-2xl whitespace-pre-line text-slate-700">{{ b.description }}</p>
    }
  </div>
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx ng test --include src/app/features/market/boat-detail --watch=false`
Expected: PASS (6 test).

- [ ] **Step 6: Tüm projeyi doğrula**

Run: `npx ng test --watch=false`
Expected: yalnızca bilinen `dashboard-shell` hatası (main'de mevcut, bu işle ilgisiz); başka kırmızı yok.

Run: `npx tsc -p tsconfig.json --noEmit`
Expected: boş çıktı.

- [ ] **Step 7: Stage (commit YOK)**

```bash
git add src/app/core/util src/app/features/market/boat-detail src/app/features/provider/boats/my-boats
```

---

## Plan dışı (bilinçli)

- Lightbox / tam ekran görüntüleyici — "+N fotoğraf" çipi tıklanmaz.
- Video, fiyat, müsaitlik, rezervasyon kutusu, olanaklar — backend alanları yok.
- `boat-search`/`my-boats` sayfalarının başka bir davranışı değişmez.
