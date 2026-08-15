# Market Arama Paneli Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Market başlığındaki arama pill'ini gerçek bir panele çevirmek ve `/tekneler` listesini bu aramanın URL'e yazdığı filtrelerle beslemek.

**Architecture:** Panel durum tutmaz; topladığı filtreyi `/tekneler`'in query string'ine yazar, liste URL'i okur. Ayrıştırma/serileştirme tek bir saf modülde (`core/util/boat-search-params.ts`) toplanır. Panel tek bileşendir, kabuğu `HlmDialogService` taşır — mobilde tam ekran, `sm:` üstünde ortada kutu (auth-modal'daki desenin aynısı).

**Tech Stack:** Angular 22 (signals, Signal Forms, `rxResource`), spartan/ui (combobox, date-picker, dialog, button, field), Tailwind v4, SSR (hybrid rendering).

**Spec:** `docs/superpowers/specs/2026-08-15-market-arama-paneli-design.md`

## Global Constraints

**Bu projede iki genel kural bu planın adımlarını değiştirir — skill'in varsayılanı değil, bunlar geçerli:**

- **Test yazılmaz.** Proje sonuna kadar özellik işlerinde test yazılmıyor; mevcut takım yalnız yeşil tutulur. Her görevin doğrulaması `npx ng build` + tarayıcıda elle kontrol, ardından `npm test -- --watch=false` ile mevcut 95 testin hâlâ geçtiğini görmek.
- **Commit atılmaz.** Hiçbir görev commit adımı içermez. Görev bitince kullanıcıya haber verilir, commit kararı onundur.

Proje kuralları (CLAUDE.md'den, her görev için geçerli):

- Angular 22: `standalone: true` **yazma**, `changeDetection: OnPush` **yazma**, yeni servislerde `@Service()`, `inject()`, `input()`/`output()`, `@if`/`@for`, `class`/`style` binding (`ngClass` yok), dekoratör yerine `host` objesi.
- **Bileşen ve servislerde erişim belirteci yazma** — `private`/`protected`/`public`/`readonly` kullanılmıyor, üyeler sade bırakılır.
- Yeni formlar **Signal Forms** (`@angular/forms/signals`).
- **Interface'ler bileşen dosyasında tanımlanmaz** — hepsi `src/app/core/models/` altında, konu başına bir dosya, `index.ts` barrel'ına satırı eklenir.
- **Mobile-first**: taban sınıflar mobil düzeni tarif eder, `sm:`/`md:`/`lg:` yalnız büyütme yönünde. Dokunma hedefi ≥44px.
- **Tek tema**: `dark:` sınıfı yazma.
- SSR: `window`/`document`/`localStorage`'a doğrudan dokunma.
- Tailwind v4 CSS-first: `tailwind.config.js` yok, tema `src/tailwind.css` içinde `@theme`.

Sabit değerler (spec'ten):

- Saatlik süre tavanı **12** (`Rental:HourlyMaxHours`, backend `appsettings.json`; istemciye açan uç yok).
- `rentalType` istemcide sabit **`Hourly`** — yalnız arama filtresi varken gönderilir.
- Query param adları: `city`, `harbor`, `date`, `startHour`, `hours`, `people`, `page`.

---

### Task 1: Backend — liste filtresine `cityId`

Şehir düğümünün çalışması için gereken API değişikliği. **Ayrı repo:** `D:\Tekne\Tekne.Project.Api`.

**Files:**
- Modify: `Tekne.Project.Shema/Model/Boat.cs` (`BoatListFilterInputModel` record'u)
- Modify: `Tekne.Project.Api/Impl/Query/BoatQueryHandler.cs` (`Handle(GetBoatListQuery …)`)
- Modify: `Tekne.Project.Api/Impl/Validation/BoatValidators.cs` (`GetBoatListQueryValidator`)

**Interfaces:**
- Consumes: yok (ilk görev).
- Produces: `GET /api/Boats?CityId=<int>` — o şehirdeki aktif tekneleri döndürür. Yanıt şekli değişmez (`PagedResult<BoatCardOutputModel>`).

- [ ] **Step 1: Filtre modeline alanı ekle**

`Tekne.Project.Shema/Model/Boat.cs` içinde `BoatListFilterInputModel`, `HarborId`'nin hemen üstüne:

```csharp
public record BoatListFilterInputModel
{
    public int? CityId { get; set; }
    public int? HarborId { get; set; }
    public DateOnly? Date { get; set; }
    // … kalan alanlar aynı
}
```

- [ ] **Step 2: Handler'a filtreyi ekle**

`BoatQueryHandler.Handle` içinde, mevcut `HarborId` bloğunun **üstüne**:

```csharp
if (filter?.CityId is int cityId)
    boats = boats.Where(b => b.CityId == cityId);

if (filter?.HarborId is int harborId)
    boats = boats.Where(b => b.Harbors.Any(h => h.HarborId == harborId));
```

`City` → `Harbor` hiyerarşisinde tekne tek şehirde hizmet verdiği için `b.CityId` doğrudan karşılaştırılır; `Harbors` koleksiyonuna gerek yok.

- [ ] **Step 3: Validator kuralını ekle**

`BoatValidators.cs` içinde `GetBoatListQueryValidator`'da, `HarborId` kuralının yanına aynı kalıpla:

```csharp
RuleFor(x => x.Filter!.CityId)
    .GreaterThan(0)
    .When(x => x.Filter!.CityId.HasValue)
    .WithMessage("Şehir geçersiz.");
```

- [ ] **Step 4: Derle**

Çalıştır: `dotnet build` (`D:\Tekne\Tekne.Project.Api` kökünde)
Beklenen: hatasız.

- [ ] **Step 5: Uçtan uca dene**

API'yi çalıştır, sonra:

```bash
curl -s "http://localhost:5188/api/Boats?CityId=1" | head -c 300
curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:5188/api/Boats?CityId=0"
```

Beklenen: birincisi `{"items":[…]}` (yalnız o şehrin tekneleri), ikincisi **`422`** — bu API doğrulama hatalarını `ValidationBehavior` üzerinden 422 ile döndürüyor, 400 ile değil.

Not: canlı veritabanında yalnız `CityId=34` (İstanbul) dolu; var olmayan bir şehir kimliği boş liste döner, bu doğru davranıştır.

- [ ] **Step 6: Kullanıcıya haber ver**

Backend değişikliği bitti; commit **atma**, kullanıcıya söyle.

---

### Task 2: Filtre modeli + URL ayrıştırma modülü

**Files:**
- Modify: `src/app/core/models/boat.ts` (`BoatListFilterInputModel`)
- Create: `src/app/core/util/boat-search-params.ts`

**Interfaces:**
- Consumes: Task 1'in `CityId` alanı (API tarafı).
- Produces:
  - `BoatListFilterInputModel.cityId?: number`
  - `SEARCH_MAX_HOURS: number` (= 12)
  - `parseSearchParams(map: ParamMap): BoatListFilterInputModel`
  - `toQueryParams(filter: BoatListFilterInputModel): Params`
  - `hasSearchFilter(filter: BoatListFilterInputModel): boolean`
  - `toIsoDate(date: Date): string`
  - `fromIsoDate(value: string): Date`

- [ ] **Step 1: Modele `cityId` ekle**

`src/app/core/models/boat.ts`:

```ts
export interface BoatListFilterInputModel {
  cityId?: number;
  harborId?: number;
  date?: string;
  startHour?: number;
  hours?: number;
  numberOfPeople?: number;
  rentalType?: RentalType;
  /** 1'den başlar; gönderilmezse backend ilk sayfayı döner. Sayfa boyutu sunucuda sabit. */
  pageNumber?: number;
}
```

- [ ] **Step 2: Ayrıştırma modülünü yaz**

`src/app/core/util/boat-search-params.ts` (tamamı):

```ts
import { ParamMap, Params } from '@angular/router';
import { RentalType } from '@enums/rental-type';
import { BoatListFilterInputModel } from '@models';

/**
 * Saatlik sürenin tavanı. Backend'de `Rental:HourlyMaxHours` (appsettings.json)
 * ve `BoatValidators` içinde; istemciye açan bir uç yok, bu yüzden burada
 * sabit. Backend'de değişirse elle güncellenmesi gereken tek yer burasıdır.
 */
export const SEARCH_MAX_HOURS = 12;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function intInRange(raw: string | null, min: number, max: number): number | undefined {
  if (raw === null) return undefined;
  const value = Number(raw);
  return Number.isInteger(value) && value >= min && value <= max ? value : undefined;
}

function isoDate(raw: string | null): string | undefined {
  if (raw === null || !ISO_DATE.test(raw)) return undefined;
  // JS Date takvim taşmasını sessizce yuvarlıyor ('2026-02-30' → 2 Mart) ve
  // bu NaN üretmiyor. Geri çevirip karşılaştırmak hem taşmayı hem NaN'i
  // yakalar: geçersiz tarihte `toIsoDate` "NaN-NaN-NaN" döner, eşleşmez.
  return toIsoDate(fromIsoDate(raw)) === raw ? raw : undefined;
}

/**
 * `/tekneler` query string'ini API filtresine çevirir.
 *
 * Bozuk değer sessizce düşer: elle yazılmış URL bozuk ekran değil, o alanı yok
 * sayılmış bir arama üretir. İki kural ayrıştırmada uygulanır ki backend 400
 * dönmesin:
 *
 * - `harbor` ile `city` birlikte gelirse `harbor` kazanır (daha dar olan).
 * - Zincir: `date` yoksa `startHour`, `startHour` yoksa `hours` düşer
 *   (`BoatValidators` bu kombinasyonları reddediyor).
 */
export function parseSearchParams(map: ParamMap): BoatListFilterInputModel {
  const harborId = intInRange(map.get('harbor'), 1, Number.MAX_SAFE_INTEGER);
  const cityId =
    harborId === undefined ? intInRange(map.get('city'), 1, Number.MAX_SAFE_INTEGER) : undefined;

  const date = isoDate(map.get('date'));
  const startHour = date === undefined ? undefined : intInRange(map.get('startHour'), 0, 23);
  const hours =
    startHour === undefined ? undefined : intInRange(map.get('hours'), 1, SEARCH_MAX_HOURS);

  const filter: BoatListFilterInputModel = {
    cityId,
    harborId,
    date,
    startHour,
    hours,
    numberOfPeople: intInRange(map.get('people'), 1, Number.MAX_SAFE_INTEGER),
    pageNumber: intInRange(map.get('page'), 1, Number.MAX_SAFE_INTEGER),
  };

  // Panel saat cinsinden süre soruyor; gecelik tekneyi bu aramanın sonucunda
  // göstermek tutarsız olurdu (fiyat birimi ₺/gece, startHour anlamsız).
  // Aramasız /tekneler (yalnız ?page=) her tipi listelemeye devam eder.
  if (hasSearchFilter(filter)) filter.rentalType = RentalType.Hourly;

  return filter;
}

/** Sayfa numarası arama sayılmaz — `?page=2` tek başına listeyi kısıtlamaz. */
export function hasSearchFilter(filter: BoatListFilterInputModel): boolean {
  return (
    filter.cityId !== undefined ||
    filter.harborId !== undefined ||
    filter.date !== undefined ||
    filter.numberOfPeople !== undefined
  );
}

/**
 * Filtreyi query param'lara çevirir. Boş alanlar `null` yazılır ki
 * `queryParamsHandling: 'merge'` onları URL'den **silsin** — atlanan alan
 * merge'de eskisini bırakırdı.
 */
export function toQueryParams(filter: BoatListFilterInputModel): Params {
  return {
    city: filter.cityId ?? null,
    harbor: filter.harborId ?? null,
    date: filter.date ?? null,
    startHour: filter.startHour ?? null,
    hours: filter.hours ?? null,
    people: filter.numberOfPeople ?? null,
    // Yeni arama 1. sayfadan başlar: eski ?page= taşınırsa iki sonuçlu bir
    // aramada kullanıcı boş ekrana düşer.
    page: null,
  };
}

/**
 * Yerel tarihten `YYYY-MM-DD`. `toISOString()` bilinçli kullanılmıyor — UTC'ye
 * kaydırıp günü bir öne/arkaya atabiliyor; buradaki tarih bir takvim günü,
 * bir an değil.
 */
export function toIsoDate(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** `YYYY-MM-DD` → yerel gün başlangıcı. */
export function fromIsoDate(value: string): Date {
  return new Date(`${value}T00:00:00`);
}
```

- [ ] **Step 3: Derle**

Çalıştır: `npx ng build`
Beklenen: hatasız. (Modül henüz kimse tarafından kullanılmıyor; bu adım yalnız tip hatası olmadığını gösterir.)

---

### Task 3: `BoatSearch` filtreyi URL'den okusun

`?sayfa=` → `?page=` yeniden adlandırması da bu görevde: tek konvansiyon kalsın.

**Files:**
- Modify: `src/app/features/market/boat-search/boat-search.ts`
- Modify: `src/app/features/market/boat-search/boat-search.html`

**Interfaces:**
- Consumes: Task 2'nin `parseSearchParams`, `hasSearchFilter`.
- Produces: `/tekneler` artık `?city/harbor/date/startHour/hours/people/page` okuyor. Panelin yazacağı sözleşme bu görevden sonra canlı.

- [ ] **Step 1: Bileşeni filtre okuyacak şekilde değiştir**

`boat-search.ts` — `sayfa` input'u ve içindeki sayı ayrıştırma kalkıyor, yerine tüm filtreyi tek yerden okuyan kaynak geliyor:

```ts
import { Component, computed, inject } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Params, RouterLink, convertToParamMap } from '@angular/router';
import { BoatCardOutputModel } from '@models';
import { BoatService } from '@services';
import {
  HlmPagination,
  HlmPaginationContent,
  HlmPaginationEllipsis,
  HlmPaginationItem,
  HlmPaginationLink,
  HlmPaginationNext,
  HlmPaginationPrevious,
  createPageArray,
} from '@ui/pagination';
import { ROUTE_MARKET } from '../../../core/routes.const';
import { hasSearchFilter, parseSearchParams } from '../../../core/util/boat-search-params';
import { BoatCard } from './boat-card';
```

Sınıf gövdesinde `sayfa` ve eski `page` yerine:

```ts
  route = inject(ActivatedRoute);

  /**
   * Filtrenin tek kaynağı URL. `withComponentInputBinding` ile yedi ayrı string
   * input almak yerine tek ParamMap okunuyor — ayrıştırma ve doğrulama
   * `boat-search-params` içinde tek yerde kalsın.
   */
  queryParams = toSignal(this.route.queryParamMap, { initialValue: convertToParamMap({}) });

  filter = computed(() => parseSearchParams(this.queryParams()));

  /** Arama yapılmış mı — boş durum metnini ve "temizle" çıkışını belirler. */
  searching = computed(() => hasSearchFilter(this.filter()));

  page = computed(() => this.filter().pageNumber ?? 1);

  boatsResource = rxResource({
    params: () => this.filter(),
    stream: ({ params }) => this.boatService.getList(params),
  });
```

`queryParamsFor` param adı `sayfa` → `page`:

```ts
  /** İlk sayfa param'sız adreste kalır: `/tekneler` ile `?page=1` aynı sayfayı iki URL yapmasın. */
  queryParamsFor(page: number): Params {
    return { page: page === 1 ? null : page };
  }
```

Kalan üyeler (`boatService`, `loading`, `result`, `boats`, `totalCount`, `totalPages`, `hasPrevious`, `hasNext`, `outOfRange`, `pages`, `listUrl`, `location`) aynen kalır.

- [ ] **Step 2: Boş durum metnini ayır**

`boat-search.html` — mevcut boş durum bloğu üç dala çıkar. Aralık dışı sayfadan dönüş artık filtreyi **korur** (`merge` + `page: null`), "filtreleri temizle" ise param'sız adrese gider:

```html
} @else if (boats().length === 0) {
  @if (page() > 1) {
    <!--
      Aralık dışı `?page=` elle yazılmış olabilir: liste boş ama katalog dolu.
      Pager bu durumda gizlendiği için çıkış yolunu bu link veriyor. Aramayı
      koruyor — kullanıcı filtresini kaybetmesin.
    -->
    <p class="mt-6 text-sm text-muted-foreground">
      Bu sayfada tekne yok.
      <a
        class="underline underline-offset-4"
        [routerLink]="listUrl"
        [queryParams]="{ page: null }"
        queryParamsHandling="merge"
        >İlk sayfaya dön</a
      >
    </p>
  } @else if (searching()) {
    <p class="mt-6 text-sm text-muted-foreground">
      Aramana uygun tekne bulunamadı.
      <a class="underline underline-offset-4" [routerLink]="listUrl">Filtreleri temizle</a>
    </p>
  } @else {
    <p class="mt-6 text-sm text-muted-foreground">Henüz listelenecek tekne yok.</p>
  }
} @else {
```

- [ ] **Step 3: Derle**

Çalıştır: `npx ng build`
Beklenen: hatasız.

- [ ] **Step 4: Elle dene**

`npm start` çalışırken sırayla aç:

| URL | Beklenen |
|---|---|
| `/tekneler` | tüm tekneler, boş durumda "Henüz listelenecek tekne yok" |
| `/tekneler?people=999` | boş sonuç + "Aramana uygun tekne bulunamadı" + Filtreleri temizle |
| `/tekneler?page=2` | (tek sayfaysa) "Bu sayfada tekne yok" + İlk sayfaya dön |
| `/tekneler?hours=4` | zincir kuralı: `hours` düşer, tüm tekneler gelir (400 **yok**) |
| `/tekneler?city=1&harbor=1` | `harbor` kazanır; ağ sekmesinde istekte `CityId` **olmamalı** |

- [ ] **Step 5: Mevcut testleri koş**

Çalıştır: `npm test -- --watch=false`
Beklenen: 95 test geçer. (İlk koşu "N failed (no tests)" derse bir kez daha koş — bilinen kararsızlık.)

- [ ] **Step 6: Kullanıcıya haber ver**

Commit **atma**.

---

### Task 4: `app-stepper` — sayı sayacı

Panelde iki kez kullanılacak ortak form atomu ("− 4 saat +", "− 6 kişi +").

**Files:**
- Create: `src/app/shared/forms/app-stepper.ts`
- Modify: `src/app/shared/forms/index.ts`

**Interfaces:**
- Consumes: yok.
- Produces: `AppStepper` — `<app-stepper label="Süre" [field]="form.hours" [min]="1" [max]="12" unit="saat" />`
  - `label: string` (zorunlu), `field: FieldTree<number | null>` (zorunlu), `min = 1`, `max = Number.MAX_SAFE_INTEGER`, `unit = ''`, `placeholder = 'Seçilmedi'`.

- [ ] **Step 1: Bileşeni yaz**

`src/app/shared/forms/app-stepper.ts` (tamamı):

```ts
import { Component, computed, input } from '@angular/core';
import { FieldTree } from '@angular/forms/signals';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideMinus, lucidePlus } from '@ng-icons/lucide';
import { HlmButton } from '@ui/button';
import { HlmFieldImports } from '@ui/field';

let nextId = 0;

/**
 * Signal Forms alanına bağlı sayı sayacı: `− değer +`. Klavye girişi yok —
 * arama panelindeki süre ve misafir sayısı küçük aralıklarda hareket ediyor,
 * dokunmatikte iki butona basmak yazmaktan hızlı.
 *
 * Model `number | null` tutar: `null` "kullanıcı dokunmadı" demek, `min`
 * değil. Bu ayrım önemli — dokunulmamış alan URL'e hiç yazılmaz.
 */
@Component({
  selector: 'app-stepper',
  imports: [HlmButton, HlmFieldImports, NgIcon],
  viewProviders: [provideIcons({ lucideMinus, lucidePlus })],
  template: `
    <div hlmField>
      <label hlmFieldLabel [for]="valueId()">{{ label() }}</label>
      <div class="flex items-center gap-3">
        <!-- size-11 = 44px: dokunma hedefi. -->
        <button
          hlmBtn
          type="button"
          variant="outline"
          size="icon"
          class="size-11 rounded-full"
          [disabled]="!canDecrease()"
          [attr.aria-label]="label() + ' azalt'"
          (click)="step(-1)"
        >
          <ng-icon name="lucideMinus" />
        </button>

        <output [id]="valueId()" class="min-w-28 text-center text-sm" aria-live="polite">
          {{ display() }}
        </output>

        <button
          hlmBtn
          type="button"
          variant="outline"
          size="icon"
          class="size-11 rounded-full"
          [disabled]="!canIncrease()"
          [attr.aria-label]="label() + ' artır'"
          (click)="step(1)"
        >
          <ng-icon name="lucidePlus" />
        </button>
      </div>
    </div>
  `,
})
export class AppStepper {
  label = input.required<string>();

  field = input.required<FieldTree<number | null>>();

  min = input(1);

  max = input(Number.MAX_SAFE_INTEGER);

  /** Değerin yanında görünen birim: "saat", "kişi". */
  unit = input('');

  /** Alan boşken gösterilen metin. */
  placeholder = input('Seçilmedi');

  valueId = input(`app-stepper-${nextId++}`);

  state = computed(() => this.field()());

  value = computed(() => this.state().value());

  display = computed(() => {
    const value = this.value();
    return value === null ? this.placeholder() : `${value} ${this.unit()}`.trim();
  });

  canDecrease = computed(() => {
    const value = this.value();
    return value !== null && value > this.min();
  });

  canIncrease = computed(() => {
    const value = this.value();
    return value === null || value < this.max();
  });

  /** Boş alanda ilk dokunuş `min`'e oturur; artı da eksi de oradan başlar. */
  step(delta: number): void {
    const value = this.value();
    const next = value === null ? this.min() : value + delta;
    this.state().value.set(Math.min(Math.max(next, this.min()), this.max()));
  }
}
```

- [ ] **Step 2: Barrel'a ekle**

`src/app/shared/forms/index.ts` içine, mevcut satırların arasına:

```ts
export * from './app-stepper';
```

- [ ] **Step 3: Derle**

Çalıştır: `npx ng build`
Beklenen: hatasız.

---

### Task 5: Arama paneli

**Files:**
- Create: `src/app/core/models/boat-search.ts`
- Modify: `src/app/core/models/index.ts`
- Create: `src/app/features/market/search/search-panel.ts`
- Create: `src/app/features/market/search/search-panel.html`
- Create: `src/app/features/market/search/search-panel.service.ts`

**Interfaces:**
- Consumes: Task 2 (`parseSearchParams`, `toQueryParams`, `toIsoDate`, `fromIsoDate`, `SEARCH_MAX_HOURS`), Task 4 (`AppStepper`), mevcut `HarborService.getAll()`.
- Produces: `SearchPanelService.open(): void` — paneli açar. `BoatSearchFormModel` (model dosyasında).

- [ ] **Step 1: Form modelini yaz**

Interface bileşen dosyasında tanımlanamaz. `src/app/core/models/boat-search.ts`:

```ts
/**
 * Arama panelinin form modeli. API filtresinden ayrı bir tip: burada değerler
 * kontrol tiplerinde tutulur (`location` tek combobox değeri, `date` bir
 * `Date`), API'ye çevrim `boat-search-params` üzerinden yapılır.
 */
export interface BoatSearchFormModel {
  /** `city:3` | `harbor:7` | `''`. İki kimlik uzayı tek combobox değerinde. */
  location: string;
  date: Date | null;
  /** `hlm-select` string taşır: `''` | `'0'` … `'23'`. */
  startHour: string;
  hours: number | null;
  people: number | null;
}
```

`src/app/core/models/index.ts` içine (alfabetik, `boat-pricing` ile `boat-usage-term` arasına):

```ts
export * from './boat-search';
```

- [ ] **Step 2: Paneli açan servisi yaz**

`src/app/features/market/search/search-panel.service.ts`:

```ts
import { Service, inject } from '@angular/core';
import { HlmDialogService } from '@ui/dialog';
import { SearchPanel } from './search-panel';

/**
 * Arama panelini açar. Kabuk `auth-modal.service.ts`'teki desenin aynısı:
 * tek dialog, sunum farkını responsive panel sınıfları taşıyor — mobilde tam
 * ekran, sm üstünde ortalanmış kutu. Breakpoint gözlemcisi yok, SSR'da
 * dallanma yok.
 */
@Service()
export class SearchPanelService {
  dialogService = inject(HlmDialogService);

  open(): void {
    this.dialogService.open(SearchPanel, {
      // Genel dialog perdesi saydam (ürün kararı); auth modalinin karartması
      // istisnaydı, arama paneli genel kurala uyar.
      contentClass:
        'fixed inset-0 max-w-none content-start overflow-y-auto rounded-none ' +
        'data-open:slide-in-from-bottom-8 data-closed:slide-out-to-bottom-8 ' +
        'sm:static sm:inset-auto sm:max-w-none sm:w-[34rem] sm:content-normal sm:rounded-xl sm:p-6',
    });
  }
}
```

- [ ] **Step 3: Panel bileşenini yaz**

`src/app/features/market/search/search-panel.ts`:

```ts
import { Component, computed, inject } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { form } from '@angular/forms/signals';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { BrnDialogRef } from '@spartan-ng/brain/dialog';
import { HlmButton } from '@ui/button';
import { HlmComboboxImports } from '@ui/combobox';
import { HlmDatePickerImports } from '@ui/date-picker';
import { HlmDialogTitle } from '@ui/dialog';
import { HlmFieldImports } from '@ui/field';
import { AppSelect, AppStepper } from '@forms';
import { BoatSearchFormModel, SelectOption } from '@models';
import { HarborService } from '@services';
import { ROUTE_MARKET } from '../../../core/routes.const';
import {
  SEARCH_MAX_HOURS,
  fromIsoDate,
  parseSearchParams,
  toIsoDate,
  toQueryParams,
} from '../../../core/util/boat-search-params';

/** 00:00 … 23:00 — `hlm-select` string taşıdığı için değerler de string. */
const HOUR_OPTIONS: SelectOption<string>[] = Array.from({ length: 24 }, (_, hour) => ({
  value: `${hour}`,
  label: `${`${hour}`.padStart(2, '0')}:00`,
}));

/**
 * Saatlik arama paneli. Kendi durumunu tutmaz: açılırken formu URL'deki
 * filtreden doldurur, "Ara" deyince URL'e geri yazar. Tek gerçek kaynak
 * `/tekneler`'in query string'i.
 *
 * Zaman alanları sonucu **daraltmaz** — backend `Date`/`StartHour`/`Hours`
 * alanlarını yalnız kart ücretini hesaplamak için kullanıyor (müsaitlik
 * filtresi henüz yok). Metinler bu yüzden "müsait tekne" değil "seçtiğin
 * zamana göre fiyat" dilinde.
 */
@Component({
  selector: 'app-search-panel',
  imports: [
    AppSelect,
    AppStepper,
    HlmButton,
    HlmComboboxImports,
    HlmDatePickerImports,
    HlmDialogTitle,
    HlmFieldImports,
  ],
  templateUrl: './search-panel.html',
})
export class SearchPanel {
  ref = inject<BrnDialogRef<void>>(BrnDialogRef);
  router = inject(Router);
  route = inject(ActivatedRoute);
  harborService = inject(HarborService);

  maxHours = SEARCH_MAX_HOURS;
  hourOptions = HOUR_OPTIONS;

  /** Bugünün başlangıcı — takvimde geçmiş günler kapalı. */
  minDate = new Date(new Date().setHours(0, 0, 0, 0));

  citiesResource = rxResource({ stream: () => this.harborService.getAll() });

  cities = computed(() => (this.citiesResource.hasValue() ? this.citiesResource.value() : []));

  queryParams = toSignal(this.route.queryParamMap, { initialValue: convertToParamMap({}) });

  /** Panel açılırken form URL'deki aramayla doldurulur — kullanıcı kaldığı yerden düzenler. */
  model = computed(() => {
    const filter = parseSearchParams(this.queryParams());

    return {
      location: filter.harborId
        ? `harbor:${filter.harborId}`
        : filter.cityId
          ? `city:${filter.cityId}`
          : '',
      date: filter.date ? fromIsoDate(filter.date) : null,
      startHour: filter.startHour === undefined ? '' : `${filter.startHour}`,
      hours: filter.hours ?? null,
      people: filter.numberOfPeople ?? null,
    } satisfies BoatSearchFormModel;
  });

  /**
   * Model ayrı bir signal, form onu sarıyor — `auth-modal.ts`'teki desenin
   * aynısı. `model()` bir kez okunuyor: panel açıldığı andaki URL'i alır,
   * sonra kullanıcının düzenlemesi kendi başına yaşar.
   */
  searchModel = signal(this.model());

  searchForm = form(this.searchModel);

  /**
   * Zincir kuralı (`BoatValidators`): `date` olmadan `startHour`, `startHour`
   * olmadan `hours` reddediliyor. Panel bunu görünür kılar — kullanıcı
   * reddedilecek kombinasyonu hiç kuramaz.
   */
  hourDisabled = computed(() => this.searchForm.date().value() === null);

  durationDisabled = computed(() => this.searchForm.startHour().value() === '');

  cityLabel(cityName: string): string {
    return `${cityName} — tüm limanlar`;
  }

  search(): void {
    const value = this.searchForm().value();
    const [kind, rawId] = value.location.split(':');
    const id = Number(rawId);

    this.router.navigate(['/', ROUTE_MARKET.boats], {
      queryParams: toQueryParams({
        cityId: kind === 'city' ? id : undefined,
        harborId: kind === 'harbor' ? id : undefined,
        date: value.date ? toIsoDate(value.date) : undefined,
        startHour: value.date && value.startHour !== '' ? Number(value.startHour) : undefined,
        hours: value.startHour !== '' ? (value.hours ?? undefined) : undefined,
        numberOfPeople: value.people ?? undefined,
      }),
      queryParamsHandling: 'merge',
    });

    this.ref.close();
  }

  clear(): void {
    this.searchModel.set({
      location: '',
      date: null,
      startHour: '',
      hours: null,
      people: null,
    });
  }
}
```

`signal` import'unu `@angular/core` satırına ekle (`Component, computed, inject, signal`).

- [ ] **Step 4: Panel şablonunu yaz**

`src/app/features/market/search/search-panel.html`:

```html
<h2 hlmDialogTitle class="text-lg font-semibold">Tekne ara</h2>
<p class="mt-1 text-sm text-muted-foreground">
  Tarih ve saat, kartlarda o zaman dilimine göre fiyat gösterir.
</p>

<div class="mt-6 flex flex-col gap-5">
  <div hlmField>
    <label hlmFieldLabel for="search-location">Nereden</label>
    <hlm-combobox [formField]="searchForm.location" [itemToString]="locationLabel">
      <hlm-combobox-trigger class="w-full" id="search-location">
        <hlm-combobox-value placeholder="Şehir veya liman" />
      </hlm-combobox-trigger>

      <hlm-combobox-content *hlmComboboxPortal>
        <input hlmComboboxInput placeholder="Ara…" />
        <div hlmComboboxList>
          @for (city of cities(); track city.cityId) {
            <hlm-combobox-group>
              <hlm-combobox-label>{{ city.cityName }}</hlm-combobox-label>
              <hlm-combobox-item [value]="'city:' + city.cityId">
                {{ cityLabel(city.cityName) }}
              </hlm-combobox-item>
              <!-- Girinti hiyerarşiyi taşıyor: liman şehrin altında. -->
              @for (harbor of city.harbors; track harbor.id) {
                <hlm-combobox-item [value]="'harbor:' + harbor.id" class="ps-6">
                  {{ harbor.name }}
                </hlm-combobox-item>
              }
            </hlm-combobox-group>
          }
          <hlm-combobox-empty class="block p-2 text-sm text-muted-foreground">
            Sonuç bulunamadı.
          </hlm-combobox-empty>
        </div>
      </hlm-combobox-content>
    </hlm-combobox>
  </div>

  <div hlmField>
    <label hlmFieldLabel>Tarih</label>
    <hlm-date-picker
      [formField]="searchForm.date"
      [min]="minDate"
      [formatDate]="formatDate"
      autoCloseOnSelect
    >
      <hlm-date-picker-trigger class="w-full">Tarih seçin</hlm-date-picker-trigger>
    </hlm-date-picker>
  </div>

  <!-- Zincir kuralı görünür: tarih seçilmeden saat, saat seçilmeden süre pasif. -->
  <div [class]="hourDisabled() ? 'pointer-events-none opacity-50' : ''">
    <app-select
      label="Başlangıç saati"
      [field]="searchForm.startHour"
      [options]="hourOptions"
      placeholder="Saat seçin"
      optional
    />
  </div>

  <div [class]="durationDisabled() ? 'pointer-events-none opacity-50' : ''">
    <app-stepper
      label="Süre"
      [field]="searchForm.hours"
      [min]="1"
      [max]="maxHours"
      unit="saat"
      placeholder="Süre seçilmedi"
    />
  </div>

  <app-stepper
    label="Misafir sayısı"
    [field]="searchForm.people"
    [min]="1"
    unit="kişi"
    placeholder="Fark etmez"
  />
</div>

<!-- Mobilde eylemler altta sabit değil, akışın sonunda: panel zaten tam ekran
     ve içerik kısa; sticky çubuk klavye açıldığında yer kavgası çıkarıyor. -->
<div class="mt-8 flex items-center justify-between gap-3">
  <button hlmBtn type="button" variant="ghost" class="h-11" (click)="clear()">Temizle</button>
  <button hlmBtn type="button" class="h-11 flex-1 sm:flex-none sm:px-8" (click)="search()">
    Ara
  </button>
</div>
```

- [ ] **Step 5: `locationLabel` ve `formatDate` yardımcılarını ekle**

Şablon ikisini kullanıyor; `SearchPanel` sınıfına ekle:

```ts
  /** Combobox trigger'ında ham `city:3` yerine okunur etiket. */
  locationLabel = (value: string): string => {
    const [kind, rawId] = value.split(':');
    const id = Number(rawId);

    for (const city of this.cities()) {
      if (kind === 'city' && city.cityId === id) return this.cityLabel(city.cityName);
      const harbor = city.harbors.find((h) => h.id === id);
      if (kind === 'harbor' && harbor) return `${harbor.name}, ${city.cityName}`;
    }

    return '';
  };

  /** Tetikleyicide "12 Eylül 2026" — varsayılan `toDateString()` İngilizce. */
  formatDate = (date: Date): string =>
    date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
```

- [ ] **Step 6: Derle ve API uyumsuzluklarını gider**

Çalıştır: `npx ng build`

Bu görevdeki tek risk noktası combobox ve date-picker kompozisyonu: bu repoda daha önce **tekli** combobox ve date-picker hiç kullanılmadı (`app-multi-select` çoklu combobox'ı, date-picker'ı hiç kimse). Derleme "not a known element" veya "can't bind to" derse doğru selector/input adlarını şu iki dizinden oku ve şablonu ona göre düzelt:

- `src/app/shared/ui/combobox/src/index.ts` ve `src/lib/*`
- `src/app/shared/ui/date-picker/src/index.ts` ve `src/lib/*`

Doğrulanmış olgular: `hlm-combobox` selector'ı `[hlmCombobox],hlm-combobox`; `HlmComboboxImports` tüm parçaları dışa veriyor; `HlmDatePicker` bir `ControlValueAccessor` (yani `[formField]` ile bağlanır) ve `min` / `formatDate` / `autoCloseOnSelect` input'larına sahip; `hlm-date-picker-trigger` seçili tarihi kendi basar, `<ng-content>` yalnız yer tutucu metindir.

- [ ] **Step 7: Kullanıcıya haber ver**

Panel henüz hiçbir yerden açılmıyor (tetikleyici Task 6'da). Commit **atma**.

---

### Task 6: Başlıktaki tetikleyici + layout bağlantısı

**Files:**
- Create: `src/app/features/market/search/search-trigger.ts`
- Modify: `src/app/layouts/market-layout/market-layout.html` (23–34. satırlardaki statik `<button>`)
- Modify: `src/app/layouts/market-layout/market-layout.ts` (imports)

**Interfaces:**
- Consumes: Task 5 (`SearchPanelService.open()`), Task 2 (`parseSearchParams`, `hasSearchFilter`).
- Produces: `<app-search-trigger />` — market başlığındaki arama pill'i.

- [ ] **Step 1: Tetikleyiciyi yaz**

`src/app/features/market/search/search-trigger.ts`:

```ts
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideSearch } from '@ng-icons/lucide';
import { hasSearchFilter, fromIsoDate, parseSearchParams } from '../../../core/util/boat-search-params';
import { SearchPanelService } from './search-panel.service';

/**
 * Market başlığındaki arama pill'i. Kendi durumu yok: özeti URL'den türetir,
 * tıklanınca paneli açar. Market'in her sayfasında durur.
 */
@Component({
  selector: 'app-search-trigger',
  imports: [NgIcon],
  viewProviders: [provideIcons({ lucideSearch })],
  template: `
    <button
      type="button"
      class="mx-auto flex w-full items-center gap-3 rounded-full border border-slate-200 px-4 py-2.5 text-start shadow-sm transition-shadow hover:shadow-md lg:max-w-md"
      (click)="open()"
    >
      <ng-icon name="lucideSearch" size="18" class="shrink-0 text-slate-500" aria-hidden="true" />
      <span class="min-w-0">
        <span class="block truncate text-sm font-medium">{{ title() }}</span>
        <span class="block truncate text-xs text-slate-500">{{ subtitle() }}</span>
      </span>
    </button>
  `,
})
export class SearchTrigger {
  route = inject(ActivatedRoute);
  searchPanelService = inject(SearchPanelService);

  queryParams = toSignal(this.route.queryParamMap, { initialValue: convertToParamMap({}) });

  filter = computed(() => parseSearchParams(this.queryParams()));

  searching = computed(() => hasSearchFilter(this.filter()));

  title = computed(() => (this.searching() ? 'Aramanı düzenle' : 'Nereye gitmek istiyorsun?'));

  /**
   * Aktif filtrelerin özeti. Konum adı burada çözülmüyor — liman/şehir listesi
   * ayrı bir istek ve pill her sayfada render ediliyor; sayıyı ada çevirmek
   * için başlıkta bir istek daha atmak istemiyoruz.
   */
  subtitle = computed(() => {
    const filter = this.filter();
    if (!this.searching()) return 'Bölge · Tarih · Misafir sayısı';

    const parts: string[] = [];
    if (filter.date) {
      parts.push(
        fromIsoDate(filter.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' }),
      );
    }
    if (filter.startHour !== undefined) {
      parts.push(`${`${filter.startHour}`.padStart(2, '0')}:00`);
    }
    if (filter.hours !== undefined) parts.push(`${filter.hours} saat`);
    if (filter.numberOfPeople !== undefined) parts.push(`${filter.numberOfPeople} kişi`);

    return parts.length > 0 ? parts.join(' · ') : 'Seçili konum';
  });

  open(): void {
    this.searchPanelService.open();
  }
}
```

- [ ] **Step 2: Layout'a bağla**

`market-layout.html` — 23–34. satırlardaki `<div class="mx-auto max-w-8xl …">` bloğunun **içindeki** statik `<button>`'ın tamamı `<app-search-trigger />` ile değişir. Sarmalayıcı `div` ve yorumu kalır:

```html
    <!-- Arama başlığı. Açılan panelin içeriği:
         docs/superpowers/specs/2026-08-15-market-arama-paneli-design.md -->
    <div class="mx-auto max-w-8xl px-4 pb-3 sm:px-6 lg:px-10 lg:pb-4">
      <app-search-trigger />
    </div>
```

`market-layout.ts` — üç değişiklik:

1. `imports` dizisine (17. satır) `SearchTrigger` eklenir.
2. `lucideSearch` ikon kaydı silinir (24. satır, `provideIcons` içinden) — ikon artık tetikleyicinin kendi `viewProviders`'ında.
3. `lucideSearch` import'u silinir (9. satır). **Diğer dördü kalır** (`lucideCompass`, `lucideEllipsis`, `lucideHeart`, `lucideInbox`) — hepsi mobil alt çubukta kullanılıyor.

- [ ] **Step 3: Derle**

Çalıştır: `npx ng build`
Beklenen: hatasız. `lucideSearch` kaldırıldıktan sonra kullanılmayan import uyarısı **kalmamalı**.

- [ ] **Step 4: Uçtan uca dene**

`npm start`, sonra:

1. `/` anasayfada pill'e tıkla → panel mobil genişlikte tam ekran, `sm:` üstünde ortada kutu açılıyor.
2. Şehir seç ("Bodrum — tüm limanlar"), misafir 4, **Ara** → `/tekneler?city=…&people=4`'e gidiyor, liste daralıyor.
3. Pill artık "Aramanı düzenle · 4 kişi" özetini gösteriyor; tıklayınca form dolu açılıyor.
4. Tarih seçmeden başlangıç saati pasif; tarih seçilince açılıyor, saat seçilince süre açılıyor.
5. Tek liman seç → `?harbor=…`, `?city=` URL'den siliniyor.
6. **Temizle** → alanlar boşalıyor; **Ara** → `/tekneler` param'sız.
7. Sayfa 2'ye geç, sonra yeni arama yap → `?page=` düşüyor, 1. sayfadan başlıyor.
8. Tarayıcıyı yenile (SSR) → arama sonucu sunucuda render ediliyor, hydration hatası yok (konsol temiz).

- [ ] **Step 5: Mevcut testleri koş**

Çalıştır: `npm test -- --watch=false`
Beklenen: 95 test geçer.

- [ ] **Step 6: Kullanıcıya haber ver**

İş bitti. Commit **atma** — kullanıcıya özet ver, commit'i o karara bağla.

---

## Kapsam dışı (spec'ten)

Bu plan bunları **yapmaz**: müsaitlik filtresi (backend'de yok), gecelik arama ve tip seçici, anasayfaya öne çıkan tekneler, sıralama seçenekleri, harita görünümü.
