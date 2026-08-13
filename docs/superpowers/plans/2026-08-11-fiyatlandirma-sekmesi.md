# Fiyatlandırma Sekmesi Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tekne düzenleme sayfasına beşinci sekme: partner'ın saatlik fiyat matrisini (temel ücret + hafta içi/sonu × sabah/akşam/gece) girdiği, açıklamalı ve canlı örnek hesaplı "Fiyatlandırma" ekranı.

**Architecture:** Yeni model dosyası + yeni servis (`/Boats/{id}/pricing` uçları) + yeni sekme bileşeni (Signal Forms, iki paralel `rxResource`) + `boat-edit`'e sekme kaydı. Örnek hesap, backend `PricingCalculator.Breakdown`'ın saf-fonksiyon istemci kopyasıyla `computed()` üzerinden canlı hesaplanır.

**Tech Stack:** Angular 22 (Signal Forms, `rxResource`, `linkedSignal`), spartan/ui (`HlmButton`, `HlmSkeleton`), mevcut `AppInput`, Tailwind v4.

**Spec:** `docs/superpowers/specs/2026-08-11-fiyatlandirma-sekmesi-design.md`

## Global Constraints

- **Test yazılmaz** (proje kuralı: proje sonuna kadar yeni test yok). Doğrulama `npx ng build` + mevcut süitin yeşil kalması (`npm test -- --watch=false`) ile yapılır. Bu plan bilinçli olarak TDD içermez.
- **Commit atılmaz** — kullanıcı açıkça istemedikçe (HARD RULE). Task sonlarında commit adımı YOK; kullanıcıya sorulur. Subagent dispatch'lerine commit talimatı yazılmaz.
- Angular 22: `standalone`/`OnPush` yazma; `inject()`; `input()`/`output()`; `@if`/`@for`; erişim belirteci (`private`/`readonly`) yazma; yeni singleton'da `@Service()`.
- Interface'ler bileşen dosyasına değil `src/app/core/models/` altına.
- Mobile-first: taban sınıflar mobil, `sm:`+ yalnızca genişletir. `dark:` sınıfı yazma (tek tema).
- UI metinleri Türkçe.
- Dilim sınırları (08 / 18) backend `PricingOptions` ile **elle senkron** — kod yorumunda işaretlenir.
- Vitest ilk koşuda "N failed (no tests)" verebilir — geçici; bir kez daha koş.

---

### Task 1: Model dosyası + servis + barrel'lar

**Files:**
- Create: `src/app/core/models/boat-pricing.ts`
- Modify: `src/app/core/models/index.ts` (alfabetik sıraya export satırı)
- Create: `src/app/core/services/boat-pricing.service.ts`
- Modify: `src/app/core/services/index.ts` (alfabetik sıraya export satırı)

**Interfaces:**
- Consumes: `API_BASE_URL` (`core/api/api.config`), `@angular/core` `Service`.
- Produces: `BoatPricingInputModel`, `BoatPricingOutputModel`, `BoatPricingFormModel` (`@models`'ten); `BoatPricingService.getPricing(boatId: number): Observable<BoatPricingOutputModel | null>` ve `BoatPricingService.upsert(boatId: number, model: BoatPricingInputModel): Observable<boolean>` (`@services`'ten). Task 2 `BoatPricingFormModel`'i, Task 3 hepsini kullanır.

- [ ] **Step 1: Model dosyasını yaz**

`src/app/core/models/boat-pricing.ts`:

```ts
/**
 * `BoatsController`'ın fiyatlandırma uçlarının modelleri
 * (`GET/PUT /api/Boats/{id}/pricing`). Alanlar Swagger şemasıyla birebir.
 *
 * Matris: hafta içi/sonu × sabah/akşam/gece. `null` dilim temel ücrete düşer —
 * çözüm backend'de (`PricingCalculator.Resolve`: `rate ?? baseRate`).
 */
export interface BoatPricingInputModel {
  baseRate: number;
  weekdayMorningRate: number | null;
  weekdayEveningRate: number | null;
  weekdayNightRate: number | null;
  weekendMorningRate: number | null;
  weekendEveningRate: number | null;
  weekendNightRate: number | null;
}

export interface BoatPricingOutputModel {
  baseRate: number;
  weekdayMorningRate: number | null;
  weekdayEveningRate: number | null;
  weekdayNightRate: number | null;
  weekendMorningRate: number | null;
  weekendEveningRate: number | null;
  weekendNightRate: number | null;
}

/** Form durumu — `baseRate` daha girilmemişken `null` olabilir. */
export interface BoatPricingFormModel {
  baseRate: number | null;
  weekdayMorningRate: number | null;
  weekdayEveningRate: number | null;
  weekdayNightRate: number | null;
  weekendMorningRate: number | null;
  weekendEveningRate: number | null;
  weekendNightRate: number | null;
}
```

- [ ] **Step 2: Model barrel'ına ekle**

`src/app/core/models/index.ts` içinde `export * from './boat-photo';` satırından ÖNCE (alfabetik):

```ts
export * from './boat-pricing';
```

- [ ] **Step 3: Servisi yaz**

`src/app/core/services/boat-pricing.service.ts` (desen: `boat-usage-term.service.ts`):

```ts
import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api/api.config';
import { BoatPricingInputModel, BoatPricingOutputModel } from '@models';

/**
 * `BoatsController`'ın fiyatlandırma uçları (`/api/Boats/{id}/pricing`).
 * İkisi de `Partner` politikasına bağlı; tekne sahipliği backend'de doğrulanır.
 */
@Service()
export class BoatPricingService {
  http = inject(HttpClient);
  baseUrl = inject(API_BASE_URL);

  /** Teknenin fiyat kaydı; hiç girilmemişse `null`. */
  getPricing(boatId: number): Observable<BoatPricingOutputModel | null> {
    return this.http.get<BoatPricingOutputModel | null>(
      `${this.baseUrl}/Boats/${boatId}/pricing`,
    );
  }

  /** Tam model gönderilir — upsert; `null` dilim o dilimi temel ücrete düşürür. */
  upsert(boatId: number, model: BoatPricingInputModel): Observable<boolean> {
    return this.http.put<boolean>(`${this.baseUrl}/Boats/${boatId}/pricing`, model);
  }
}
```

- [ ] **Step 4: Servis barrel'ına ekle**

`src/app/core/services/index.ts` içinde `export * from './boat-usage-term.service';` satırından ÖNCE (alfabetik):

```ts
export * from './boat-pricing.service';
```

- [ ] **Step 5: Build ile doğrula**

Run: `npx ng build`
Expected: hatasız tamamlanır (`dist/tekne-web` üretilir).

---

### Task 2: Örnek hesap util'i — istemci breakdown kopyası

**Files:**
- Create: `src/app/features/provider/boats/boat-pricing/pricing-breakdown.ts`

**Interfaces:**
- Consumes: `BoatPricingFormModel` (`@models`, Task 1).
- Produces: `MORNING_START_HOUR: number`, `EVENING_START_HOUR: number`, `BreakdownGroup { dayType: 'hafta içi' | 'hafta sonu'; period: 'sabah' | 'akşam' | 'gece'; hours: number; hourRate: number; total: number }`, `breakdown(pricing: BoatPricingFormModel, startDay: number, startHour: number, hours: number): BreakdownGroup[]`. Task 3 hepsini kullanır.

- [ ] **Step 1: Util dosyasını yaz**

`src/app/features/provider/boats/boat-pricing/pricing-breakdown.ts`:

```ts
import { BoatPricingFormModel } from '@models';

/**
 * Backend `PricingCalculator.Breakdown`'ın istemci kopyası — Fiyatlandırma
 * sekmesindeki canlı "örnek hesap" bölümü için. Kural birebir aynı: her saat
 * kendi diliminin ücretiyle toplanır (`dilim ?? temel`), ardışık aynı-ücretli
 * saatler tek satırda gruplanır.
 *
 * Dilim sınırları backend `PricingOptions` config'iyle ELLE SENKRON — bu
 * değerleri servis eden uç yok. Backend 08/18'i değiştirirse burası ve
 * ekrandaki saat aralığı metinleri elle güncellenmeli.
 */
export const MORNING_START_HOUR = 8;
export const EVENING_START_HOUR = 18;

export interface BreakdownGroup {
  dayType: 'hafta içi' | 'hafta sonu';
  period: 'sabah' | 'akşam' | 'gece';
  hours: number;
  hourRate: number;
  total: number;
}

/**
 * @param startDay JS `getDay()` düzeni: 0 = Pazar … 6 = Cumartesi.
 *                 Gece yarısını aşan kiralamada gün (dolayısıyla hafta içi/sonu
 *                 ayrımı) backend'deki gibi saat saat ilerletilir.
 */
export function breakdown(
  pricing: BoatPricingFormModel,
  startDay: number,
  startHour: number,
  hours: number,
): BreakdownGroup[] {
  const base = pricing.baseRate ?? 0;
  const groups: BreakdownGroup[] = [];

  for (let i = 0; i < hours; i++) {
    const hour = (startHour + i) % 24;
    const day = (startDay + Math.floor((startHour + i) / 24)) % 7;
    const isWeekend = day === 0 || day === 6;
    const period: BreakdownGroup['period'] =
      hour < MORNING_START_HOUR ? 'gece' : hour < EVENING_START_HOUR ? 'sabah' : 'akşam';
    const rate = resolve(pricing, isWeekend, period) ?? base;
    const dayType: BreakdownGroup['dayType'] = isWeekend ? 'hafta sonu' : 'hafta içi';
    const last = groups[groups.length - 1];

    if (last && last.dayType === dayType && last.period === period && last.hourRate === rate) {
      last.hours += 1;
      last.total += rate;
    } else {
      groups.push({ dayType, period, hours: 1, hourRate: rate, total: rate });
    }
  }

  return groups;
}

function resolve(
  pricing: BoatPricingFormModel,
  isWeekend: boolean,
  period: BreakdownGroup['period'],
): number | null {
  switch (period) {
    case 'sabah':
      return isWeekend ? pricing.weekendMorningRate : pricing.weekdayMorningRate;
    case 'akşam':
      return isWeekend ? pricing.weekendEveningRate : pricing.weekdayEveningRate;
    case 'gece':
      return isWeekend ? pricing.weekendNightRate : pricing.weekdayNightRate;
  }
}
```

- [ ] **Step 2: Build ile doğrula**

Run: `npx ng build`
Expected: hatasız tamamlanır.

---

### Task 3: BoatPricing sekme bileşeni

**Files:**
- Create: `src/app/features/provider/boats/boat-pricing/boat-pricing.ts`
- Create: `src/app/features/provider/boats/boat-pricing/boat-pricing.html`

**Interfaces:**
- Consumes: Task 1'in modelleri ve `BoatPricingService`; Task 2'nin `breakdown` / `BreakdownGroup` / sabitleri; `BoatService.getById(id): Observable<BoatOutputModel>`; `ToastService.success/error(message: string)`; `AppInput` (`@forms`; `label`, `hideLabel`, `type`, `placeholder`, `field` girdileri); `HlmButton` (`@ui/button`); `HlmSkeleton` (`@ui/skeleton`); `RentalType` (`@enums`).
- Produces: `BoatPricing` bileşeni (selector `app-boat-pricing`) — Task 4 `boat-edit`'e ekler. Girdisi yok; `boatId`'yi route'tan okur.

- [ ] **Step 1: Bileşen sınıfını yaz**

`src/app/features/provider/boats/boat-pricing/boat-pricing.ts`:

```ts
import { Component, computed, inject, linkedSignal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { form, required, submit, validate } from '@angular/forms/signals';
import { firstValueFrom, map } from 'rxjs';
import { HlmButton } from '@ui/button';
import { HlmSkeleton } from '@ui/skeleton';
import { AppInput } from '@forms';
import { RentalType } from '@enums';
import { BoatPricingFormModel, BoatPricingInputModel } from '@models';
import { BoatPricingService, BoatService, ToastService } from '@services';
import { breakdown, BreakdownGroup } from './pricing-breakdown';

/** Şablondaki örnek hesap birimi. */
interface PricingExample {
  title: string;
  groups: BreakdownGroup[];
  total: number;
}

/**
 * Örnek senaryolar sabit: biri tek dilimlik basit durum, diğeri dilim geçişli
 * hafta sonu — matrisin hesaba nasıl döndüğünü ikisi birlikte anlatıyor.
 * `startDay` JS `getDay()` düzeni (3 = Çarşamba, 6 = Cumartesi).
 */
const EXAMPLE_SCENARIOS = [
  { title: 'Çarşamba 10:00–14:00 (4 saat)', startDay: 3, startHour: 10, hours: 4 },
  { title: 'Cumartesi 16:00–20:00 (4 saat)', startDay: 6, startHour: 16, hours: 4 },
];

/**
 * Düzenleme sayfasının "Fiyatlandırma" sekmesi.
 *
 * İki kaynağı paralel çeker: tekne (`rentalType` için) ve fiyat kaydı.
 * Gecelik teknede form yerine bilgi notu gösterilir — backend'in gecelik
 * hesabı henüz yok, quote ucu yalnızca saatlik teknelere cevap veriyor.
 *
 * Kaydet butonlu tek `PUT` — sayı alanlarında otomatik kayıt, yarım yazılmış
 * değerleri sunucuya taşıyacağı için bilinçli olarak yok.
 */
@Component({
  selector: 'app-boat-pricing',
  imports: [AppInput, HlmButton, HlmSkeleton],
  templateUrl: './boat-pricing.html',
})
export class BoatPricing {
  route = inject(ActivatedRoute);
  boatService = inject(BoatService);
  pricingService = inject(BoatPricingService);
  toast = inject(ToastService);

  /**
   * Sekme olduğu için route paramı input'a bağlanmıyor; kapsayıcının
   * route'undan okunur (boat-terms ile aynı gerekçe).
   */
  boatId = toSignal(this.route.paramMap.pipe(map((p) => p.get('boatId'))), {
    initialValue: null,
  });

  boatResource = rxResource({
    params: () => {
      const id = this.boatId();
      return id ? Number(id) : undefined;
    },
    stream: ({ params }) => this.boatService.getById(params),
  });

  /**
   * Fiyat kaydı tekneyi beklemeden paralel istenir. Gecelik teknede sonuç
   * kullanılmaz ama istek zararsız; yaygın durum (saatlik) için hızlı olan bu.
   */
  pricingResource = rxResource({
    params: () => {
      const id = this.boatId();
      return id ? Number(id) : undefined;
    },
    stream: ({ params }) => this.pricingService.getPricing(params),
  });

  boat = computed(() => (this.boatResource.hasValue() ? this.boatResource.value() : null));
  pricing = computed(() =>
    this.pricingResource.hasValue() ? this.pricingResource.value() : null,
  );

  loading = computed(() => this.boatResource.isLoading() || this.pricingResource.isLoading());
  failed = computed(
    () => this.boatResource.status() === 'error' || this.pricingResource.status() === 'error',
  );

  isHourly = computed(() => this.boat()?.rentalType === RentalType.Hourly);

  /** Kayıt yoksa (`null`) boş form — ilk giriş senaryosu. */
  model = linkedSignal<BoatPricingFormModel>(() => {
    const p = this.pricing();
    return {
      baseRate: p?.baseRate ?? null,
      weekdayMorningRate: p?.weekdayMorningRate ?? null,
      weekdayEveningRate: p?.weekdayEveningRate ?? null,
      weekdayNightRate: p?.weekdayNightRate ?? null,
      weekendMorningRate: p?.weekendMorningRate ?? null,
      weekendEveningRate: p?.weekendEveningRate ?? null,
      weekendNightRate: p?.weekendNightRate ?? null,
    };
  });

  pricingForm = form(this.model, (path) => {
    required(path.baseRate);
    // Backend validator'la aynı kural: dolu her alan > 0. Yedi alan aynı
    // tipte olduğu için tek döngü yeterli.
    const rateFields = [
      path.baseRate,
      path.weekdayMorningRate,
      path.weekdayEveningRate,
      path.weekdayNightRate,
      path.weekendMorningRate,
      path.weekendEveningRate,
      path.weekendNightRate,
    ];
    for (const field of rateFields) {
      validate(field, (ctx) => {
        const value = ctx.value();
        return value !== null && value <= 0
          ? { kind: 'greaterThanZero', message: '0’dan büyük olmalı.' }
          : undefined;
      });
    }
  });

  /** Boş dilim input'unda soluk görünen temel ücret — "boş = temel ücret". */
  basePlaceholder = computed(() => {
    const base = this.model().baseRate;
    return base !== null && base > 0 ? this.format(base) : '';
  });

  /** Temel ücret geçerli değilken örnekler gizli (boş dizi). */
  examples = computed<PricingExample[]>(() => {
    const m = this.model();
    if (m.baseRate === null || m.baseRate <= 0) return [];
    return EXAMPLE_SCENARIOS.map((s) => {
      const groups = breakdown(m, s.startDay, s.startHour, s.hours);
      return {
        title: s.title,
        groups,
        total: groups.reduce((sum, g) => sum + g.total, 0),
      };
    });
  });

  format(value: number): string {
    return value.toLocaleString('tr-TR');
  }

  async save(): Promise<void> {
    await submit(this.pricingForm, async () => {
      const m = this.model();
      const input: BoatPricingInputModel = {
        baseRate: m.baseRate ?? 0,
        weekdayMorningRate: m.weekdayMorningRate,
        weekdayEveningRate: m.weekdayEveningRate,
        weekdayNightRate: m.weekdayNightRate,
        weekendMorningRate: m.weekendMorningRate,
        weekendEveningRate: m.weekendEveningRate,
        weekendNightRate: m.weekendNightRate,
      };
      const saved = await firstValueFrom(
        this.pricingService.upsert(Number(this.boatId()), input),
      );
      if (!saved) {
        this.toast.error('Fiyatlar kaydedilemedi.');
        return;
      }
      this.toast.success('Fiyatlar kaydedildi.');
    });
  }
}
```

- [ ] **Step 2: Şablonu yaz**

`src/app/features/provider/boats/boat-pricing/boat-pricing.html`:

```html
@if (loading()) {
  <!-- İskelet matris ölçülerine yakın: 1 alan + 3 satırlık grid. -->
  <div class="max-w-2xl" aria-hidden="true">
    <hlm-skeleton class="h-9 w-48" />
    <div class="mt-6 grid grid-cols-[minmax(5rem,auto)_1fr_1fr] gap-x-3 gap-y-4">
      <div></div>
      <hlm-skeleton class="h-4 w-16" />
      <hlm-skeleton class="h-4 w-16" />
      @for (row of [0, 1, 2]; track row) {
        <hlm-skeleton class="h-4 w-14 self-center" />
        <hlm-skeleton class="h-9" />
        <hlm-skeleton class="h-9" />
      }
    </div>
  </div>
} @else if (failed() || !boat()) {
  <!-- Lazy sekme yeniden istek atmıyor; tek çıkış sayfa yenilemek. -->
  <p class="text-sm text-destructive">
    Fiyat bilgisi yüklenemedi. Sayfayı yenileyip tekrar deneyin.
  </p>
} @else if (!isHourly()) {
  <p class="text-sm text-muted-foreground">
    Gecelik fiyatlandırma henüz hazır değil. Şimdilik yalnızca saatlik kiralama
    yapan teknelere fiyat girilebiliyor.
  </p>
} @else {
  <div class="max-w-2xl">
    <app-input
      class="sm:max-w-[12rem]"
      label="Temel saat ücreti (TL)"
      type="number"
      [field]="pricingForm.baseRate"
    />

    <p class="mt-5 text-sm text-muted-foreground">
      Dilersen gün ve saat dilimine göre farklı ücret belirle. Boş bıraktığın
      dilimde temel saat ücreti geçerli olur.
    </p>

    <!--
      Matris: satırlar dilimler, sütunlar hafta içi/sonu. Etiketler grid
      başlığında olduğu için input etiketleri sr-only (hideLabel) — ekran
      okuyucu yine tam adı duyar.
    -->
    <div class="mt-3 grid grid-cols-[minmax(5rem,auto)_1fr_1fr] items-center gap-x-3 gap-y-4">
      <div></div>
      <p class="text-sm font-medium">Hafta içi</p>
      <p class="text-sm font-medium">Hafta sonu</p>

      <div>
        <p class="text-sm font-medium">Sabah</p>
        <p class="text-xs text-muted-foreground">08:00–18:00</p>
      </div>
      <app-input
        hideLabel
        label="Hafta içi sabah ücreti (TL)"
        type="number"
        [placeholder]="basePlaceholder()"
        [field]="pricingForm.weekdayMorningRate"
      />
      <app-input
        hideLabel
        label="Hafta sonu sabah ücreti (TL)"
        type="number"
        [placeholder]="basePlaceholder()"
        [field]="pricingForm.weekendMorningRate"
      />

      <div>
        <p class="text-sm font-medium">Akşam</p>
        <p class="text-xs text-muted-foreground">18:00–24:00</p>
      </div>
      <app-input
        hideLabel
        label="Hafta içi akşam ücreti (TL)"
        type="number"
        [placeholder]="basePlaceholder()"
        [field]="pricingForm.weekdayEveningRate"
      />
      <app-input
        hideLabel
        label="Hafta sonu akşam ücreti (TL)"
        type="number"
        [placeholder]="basePlaceholder()"
        [field]="pricingForm.weekendEveningRate"
      />

      <div>
        <p class="text-sm font-medium">Gece</p>
        <p class="text-xs text-muted-foreground">00:00–08:00</p>
      </div>
      <app-input
        hideLabel
        label="Hafta içi gece ücreti (TL)"
        type="number"
        [placeholder]="basePlaceholder()"
        [field]="pricingForm.weekdayNightRate"
      />
      <app-input
        hideLabel
        label="Hafta sonu gece ücreti (TL)"
        type="number"
        [placeholder]="basePlaceholder()"
        [field]="pricingForm.weekendNightRate"
      />
    </div>

    @if (examples().length) {
      <div class="mt-6 rounded-lg border border-input p-4">
        <p class="text-sm font-medium">Örnek hesap</p>
        <p class="mt-1 text-xs text-muted-foreground">
          Girdiğin fiyatlarla iki örnek kiralama — her saat kendi diliminin
          ücretiyle toplanır.
        </p>

        @for (example of examples(); track example.title) {
          <div class="mt-4">
            <p class="text-sm font-medium">{{ example.title }}</p>
            <ul class="mt-1 flex flex-col gap-0.5 text-sm text-muted-foreground">
              @for (group of example.groups; track $index) {
                <li>
                  {{ group.hours }} saat × {{ format(group.hourRate) }} TL
                  ({{ group.dayType }} {{ group.period }}) = {{ format(group.total) }} TL
                </li>
              }
            </ul>
            <p class="mt-1 text-sm font-medium">Toplam: {{ format(example.total) }} TL</p>
          </div>
        }
      </div>
    }

    <div class="mt-6">
      <button hlmBtn type="button" (click)="save()">Kaydet</button>
    </div>
  </div>
}
```

- [ ] **Step 3: Build ile doğrula**

Run: `npx ng build`
Expected: hatasız tamamlanır. (Bileşen henüz hiçbir yerden import edilmiyor; build yine de şablon tip hatalarını yakalamaz — asıl doğrulama Task 4'te. Bu adım sınıf dosyasının derlendiğini garantiler.)

---

### Task 4: Sekme kaydı — routes.const + boat-edit

**Files:**
- Modify: `src/app/core/routes.const.ts` (`BOAT_EDIT_TABS`)
- Modify: `src/app/features/provider/boats/boat-edit/boat-edit.ts`
- Modify: `src/app/features/provider/boats/boat-edit/boat-edit.html`

**Interfaces:**
- Consumes: `BoatPricing` (Task 3).
- Produces: `BOAT_EDIT_TABS.pricing = 'fiyatlandirma'` — `?sekme=fiyatlandirma` URL'i sekmeyi açar.

- [ ] **Step 1: Slug'ı ekle**

`src/app/core/routes.const.ts` içinde `BOAT_EDIT_TABS`'e (mevcut sıra korunarak sona):

```ts
export const BOAT_EDIT_TABS = {
  general: 'genel',
  photos: 'fotograflar',
  terms: 'sartlar',
  amenities: 'imkanlar',
  pricing: 'fiyatlandirma',
} as const;
```

- [ ] **Step 2: boat-edit.ts'e bileşeni ekle**

- Import satırı (`BoatTerms` import'unun altına):

```ts
import { BoatPricing } from '../boat-pricing/boat-pricing';
```

- `imports` dizisine `BoatPricing` ekle (sona, `BoatAmenities`'ten sonra).
- Sınıf üstündeki doc yorumundaki "dört sekmenin kapsayıcısı" ifadesini "beş sekmenin kapsayıcısı" yap.

- [ ] **Step 3: boat-edit.html'e trigger + içerik ekle**

Trigger şeridine, `İmkanlar` butonundan sonra:

```html
<button [hlmTabsTrigger]="tabs.pricing">Fiyatlandırma</button>
```

İçerik bölümüne, `tabs.amenities` div'inden sonra:

```html
<div [hlmTabsContent]="tabs.pricing" class="pt-4">
  <ng-template hlmTabsContentLazy>
    <app-boat-pricing />
  </ng-template>
</div>
```

- [ ] **Step 4: Build + süit ile doğrula**

Run: `npx ng build`
Expected: hatasız tamamlanır — bu build artık `BoatPricing` şablonunu da derler.

Run: `npm test -- --watch=false`
Expected: mevcut süit yeşil. ("N failed (no tests)" görürsen bir kez daha koş — bilinen geçici durum.)

---

### Task 5: Elle uçtan uca doğrulama

**Files:** yok (doğrulama görevi).

**Interfaces:** —

- [ ] **Step 1: API'nin ayakta olduğunu doğrula**

Run: `curl -s -o /dev/null -w "%{http_code}" http://localhost:5188/swagger/v1/swagger.json`
Expected: `200`. Değilse kullanıcıdan backend'i başlatmasını iste — bu adımlar API olmadan doğrulanamaz.

- [ ] **Step 2: Uygulamayı başlat ve sekmeyi dene**

Run: `npm start` (arka planda) → `http://localhost:4200/partner/dashboard/teknelerim` → saatlik bir teknede "Düzenle" → **Fiyatlandırma** sekmesi.

Kontrol listesi:
- Sekme şeridinde "Fiyatlandırma" görünür; `?sekme=fiyatlandirma` URL'i doğrudan açar.
- Kayıt yokken form boş gelir; temel ücret girilince boş hücre placeholder'ları ve örnek hesap canlı güncellenir.
- Dilim geçişli örnekte (Cumartesi 16:00–20:00) iki satır görünür: 2 saat sabah + 2 saat akşam.
- Kaydet → başarı toast'ı; sayfa yenilenince girilen değerler geri gelir (GET doğrulaması).
- Negatif/sıfır değerde alan hatası görünür, PUT gitmez.
- Gecelik teknede (varsa) bilgi notu görünür, form görünmez.
- Mobil genişlikte (≈390px, tarayıcı devtools) matris taşmaz, dokunma hedefleri basılabilir.

- [ ] **Step 3: Sonucu raporla**

Kontrol listesindeki her maddenin sonucunu kullanıcıya bildir; commit atma — kullanıcıya sor.
