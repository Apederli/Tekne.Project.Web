# Fiyat Önizleme Ucu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Partner fiyatlandırma sekmesindeki canlı örnek hesabı backend'e taşımak; `pricing-breakdown.ts` istemci kopyasını silmek.

**Architecture:** Backend'e tekne id'si taşımayan, saf bir önizleme ucu eklenir (`POST /api/Boats/pricing/preview`): gövdedeki matrisi mevcut `PricingCalculator.Breakdown` ile hesaplar, senaryo başlığını ve gösterime hazır Türkçe grup etiketini üretip döner. İstemci `computed()` hesabını 300 ms debounce'lu `rxResource`'a çevirir; yeni istek uçarken son iyi sonucu `linkedSignal` ile korur.

**Tech Stack:** ASP.NET Core 10 + MediatR + FluentValidation + xUnit (API); Angular 22 signals + `rxResource` + Tailwind v4 (Web).

**Spec:** `docs/superpowers/specs/2026-08-13-fiyat-onizleme-ucu-design.md`

## Global Constraints

- **Commit atma.** Kullanıcı commit'leri kendi atıyor (2026-08-13'te açıkça belirtti). Hiçbir adımda `git commit` / `git add` çalıştırma; iş bitince değişiklikleri bırak.
- **Frontend'de test yazma.** Proje tercihi: özellik işi sırasında yeni Vitest testi yazılmaz, mevcut suite yalnızca yeşil tutulur. Backend'de test yazılır (kullanıcı onayı, 2026-08-13).
- **Angular 22:** `standalone: true` ve `changeDetection: OnPush` yazma (varsayılan). Erişim belirteci ve `readonly` kullanma — üyeler sade. `inject()`, `input()`/`output()`, `@if`/`@for`, `class`/`style` binding.
- **Modeller `src/app/core/models/` altında**, bileşen dosyasında `interface` tanımlanmaz. Alan adları backend sözleşmesiyle birebir.
- **Tek tema:** `dark:` sınıfı yazma.
- **Mobile-first:** taban sınıflar mobil düzeni tarif eder, `lg:` yalnızca büyütme yönünde.
- İki repo: `D:\Tekne\Tekne.Project.Api` (Task 1–2) ve `d:\Tekne\Tekne.Project.Web` (Task 3–4). Task 3, Task 2'nin ucu ayakta olmadan uçtan uca denenemez.

---

### Task 1: Backend — önizleme sorgusu ve hesap

**Files:**
- Modify: `D:\Tekne\Tekne.Project.Api\Tekne.Project.Shema\Model\BoatPricing.cs` (dosya sonuna üç model)
- Modify: `D:\Tekne\Tekne.Project.Api\Tekne.Project.Api\CQRS\BoatPricingCqrs.cs`
- Modify: `D:\Tekne\Tekne.Project.Api\Tekne.Project.Api\Impl\Query\BoatPricingQueryHandler.cs`
- Test: `D:\Tekne\Tekne.Project.Api\Tekne.Project.Tests\Handlers\BoatPricingHandlerTests.cs`

**Interfaces:**
- Consumes: `PricingCalculator.Breakdown(BoatPricing pricing, DateOnly date, int startHour, int hours, int morningStartHour, int eveningStartHour) → List<QuoteBreakdownOutputModel>`; `PricingOptions.MorningStartHour` / `.EveningStartHour`; `Result<T>` (değerden implicit dönüşüm var); test yardımcıları `TestDb.Create(int ownerId)`, `TestDb.Localizer()`, `FakeUserClaims`.
- Produces: `GetPricingPreviewQuery(BoatPricingInputModel Model) : IRequest<Result<PricingPreviewOutputModel>>`; `PricingPreviewOutputModel { List<PricingPreviewExampleOutputModel> Examples }`; `PricingPreviewExampleOutputModel { string Title; List<PricingPreviewGroupOutputModel> Groups; decimal Total }`; `PricingPreviewGroupOutputModel { string Label; int Hours; decimal HourRate; decimal Total }`. Task 2 sorguyu, Task 3 JSON sözleşmesini kullanır.

**Not — query'nin alan adı `Model` olmak zorunda.** `ValidationBehavior` request'in `Model` adlı property'sini bulup tipine kayıtlı validator'ı çalıştırıyor (`Infrastructure/ValidationBehavior.cs:34-49`). Alan başka adla yazılırsa `BoatPricingInputModelValidator` sessizce devre dışı kalır ve `baseRate = 0` gövdesi 422 yerine sıfırlı bir hesap döner.

- [ ] **Step 1: Yanıt modellerini ekle**

`Tekne.Project.Shema\Model\BoatPricing.cs` dosyasının sonuna, `QuoteOutputModel`'in altına:

```csharp
    /// <summary>
    /// Fiyatlandırma ekranındaki canlı örnek hesabın bir satırı. <c>Label</c>
    /// gösterime hazır tek metin ("hafta sonu akşam") — istemci gün tipi ve
    /// dilimi zaten yan yana basıyor, ayrı alan ona yalnızca birleştirme
    /// kuralı taşırdı.
    /// </summary>
    public record PricingPreviewGroupOutputModel
    {
        public required string Label { get; set; }
        public int Hours { get; set; }
        public decimal HourRate { get; set; }
        public decimal Total { get; set; }
    }

    public record PricingPreviewExampleOutputModel
    {
        public required string Title { get; set; }
        public required List<PricingPreviewGroupOutputModel> Groups { get; set; }
        public decimal Total { get; set; }
    }

    public record PricingPreviewOutputModel
    {
        public required List<PricingPreviewExampleOutputModel> Examples { get; set; }
    }
```

- [ ] **Step 2: Sorguyu ekle**

`CQRS\BoatPricingCqrs.cs` içine, `GetBoatQuoteQuery` satırının altına:

```csharp
    public record GetPricingPreviewQuery(BoatPricingInputModel Model) : IRequest<Result<PricingPreviewOutputModel>>;
```

- [ ] **Step 3: Başarısız testleri yaz**

`Tekne.Project.Tests\Handlers\BoatPricingHandlerTests.cs` içine, sınıfın sonuna (son `}` işaretlerinden önce):

```csharp
        private static BoatPricingInputModel WeekendMatrixModel() => new()
        {
            BaseRate = 3300,
            WeekendMorningRate = 4000,
            WeekendEveningRate = 5000,
        };

        [Fact]
        public async Task Preview_IkiSenaryoyuBasligiylaDoner()
        {
            var db = TestDb.Create(OwnerId);

            var result = await QueryHandler(db).Handle(
                new GetPricingPreviewQuery(new BoatPricingInputModel { BaseRate = 2500 }), CancellationToken.None);

            Assert.NotNull(result.Value);
            Assert.Equal(2, result.Value.Examples.Count);
            Assert.Equal("Çarşamba 10:00–14:00 (4 saat)", result.Value.Examples[0].Title);
            Assert.Equal("Cumartesi 16:00–20:00 (4 saat)", result.Value.Examples[1].Title);
        }

        [Fact]
        public async Task Preview_BosDilimTemelUcreteDuser()
        {
            var db = TestDb.Create(OwnerId);

            var result = await QueryHandler(db).Handle(
                new GetPricingPreviewQuery(WeekendMatrixModel()), CancellationToken.None);

            Assert.NotNull(result.Value);
            var example = result.Value.Examples[0];
            var group = Assert.Single(example.Groups);
            Assert.Equal("hafta içi sabah", group.Label);
            Assert.Equal(4, group.Hours);
            Assert.Equal(3300, group.HourRate);
            Assert.Equal(13200, group.Total);
            Assert.Equal(13200, example.Total);
        }

        [Fact]
        public async Task Preview_DilimGecisiniAyriSatirlaraBoler()
        {
            var db = TestDb.Create(OwnerId);

            var result = await QueryHandler(db).Handle(
                new GetPricingPreviewQuery(WeekendMatrixModel()), CancellationToken.None);

            Assert.NotNull(result.Value);
            var example = result.Value.Examples[1];
            Assert.Equal(2, example.Groups.Count);
            Assert.Equal("hafta sonu sabah", example.Groups[0].Label);
            Assert.Equal(8000, example.Groups[0].Total);
            Assert.Equal("hafta sonu akşam", example.Groups[1].Label);
            Assert.Equal(10000, example.Groups[1].Total);
            Assert.Equal(18000, example.Total);
        }
```

Beklenen sayılar: Çarşamba 10:00–14:00'ün dört saati de hafta içi sabah; `WeekdayMorningRate` boş olduğu için temele düşer → 4 × 3300 = 13200. Cumartesi 16:00–20:00 ise 18:00'de dilim değiştirir → 2 × 4000 = 8000 (hafta sonu sabah) + 2 × 5000 = 10000 (hafta sonu akşam) = 18000.

- [ ] **Step 4: Testleri çalıştır, derlenmediğini gör**

Run: `dotnet test D:\Tekne\Tekne.Project.Api\Tekne.Project.Tests --filter "FullyQualifiedName~Preview_"`
Expected: derleme hatası — `BoatPricingQueryHandler`, `GetPricingPreviewQuery` için `IRequestHandler` uygulamıyor.

- [ ] **Step 5: Handler'ı yaz**

`Impl\Query\BoatPricingQueryHandler.cs`:

Dosyanın başındaki `using` listesine iki satır ekle — `System.Globalization` (tr-TR gün adı için) ve `Tekne.Project.Api.Data.Entity` (geçici `BoatPricing` örneği için; dosyada bugün yalnız `Tekne.Project.Api.Data` var):

```csharp
using System.Globalization;
using Tekne.Project.Api.Data.Entity;
```

Sınıf bildirimindeki arayüz listesine üçüncü satırı ekle:

```csharp
        : IRequestHandler<GetBoatPricingQuery, Result<BoatPricingOutputModel>>,
          IRequestHandler<GetBoatQuoteQuery, Result<QuoteOutputModel>>,
          IRequestHandler<GetPricingPreviewQuery, Result<PricingPreviewOutputModel>>
```

Sınıfın sonuna (mevcut iki `Handle`'ın altına):

```csharp
        private static readonly CultureInfo Turkish = new("tr-TR");

        /// <summary>
        /// Sabit referans hafta (2024-01-01 Pazartesi). Örnek hesap "bugünkü
        /// Çarşamba"yı değil gün TİPİNİ anlatıyor; <c>TrTime.Now</c>'a
        /// bağlanmadığı için çıktı gün geçince değişmiyor ve test edilebiliyor.
        /// </summary>
        private static readonly DateOnly ReferenceMonday = new(2024, 1, 1);

        /// <summary>
        /// Birincisi tek dilimde kalan basit durum, ikincisi 18:00'de dilim
        /// değiştiren hafta sonu — ikisi birlikte matrisin hesaba nasıl
        /// döndüğünü anlatıyor.
        /// </summary>
        private static readonly (DayOfWeek Day, int StartHour, int Hours)[] PreviewScenarios =
        [
            (DayOfWeek.Wednesday, 10, 4),
            (DayOfWeek.Saturday, 16, 4),
        ];

        /// <summary>
        /// Fiyatlandırma ekranındaki canlı örnek hesap. Kayda hiç bakmaz —
        /// gövdedeki matris üzerinden çalışır, çünkü partner henüz kaydetmediği
        /// rakamların sonucunu görmek istiyor. Bu yüzden tekne id'si de yok.
        /// </summary>
        public Task<Result<PricingPreviewOutputModel>> Handle(GetPricingPreviewQuery request, CancellationToken cancellationToken)
        {
            // Breakdown entity imzasıyla çalışıyor; kaydedilmeyen geçici bir
            // örnek veriyoruz ki hesap kuralı tek yerde kalsın.
            var pricing = new BoatPricing
            {
                BaseRate = request.Model.BaseRate,
                WeekdayMorningRate = request.Model.WeekdayMorningRate,
                WeekdayEveningRate = request.Model.WeekdayEveningRate,
                WeekdayNightRate = request.Model.WeekdayNightRate,
                WeekendMorningRate = request.Model.WeekendMorningRate,
                WeekendEveningRate = request.Model.WeekendEveningRate,
                WeekendNightRate = request.Model.WeekendNightRate,
            };

            var examples = PreviewScenarios.Select(scenario =>
            {
                var groups = PricingCalculator.Breakdown(
                    pricing,
                    ScenarioDate(scenario.Day),
                    scenario.StartHour,
                    scenario.Hours,
                    pricingOptions.Value.MorningStartHour,
                    pricingOptions.Value.EveningStartHour);

                return new PricingPreviewExampleOutputModel
                {
                    Title = ScenarioTitle(scenario.Day, scenario.StartHour, scenario.Hours),
                    Groups = groups.Select(g => new PricingPreviewGroupOutputModel
                    {
                        Label = GroupLabel(g.DayType, g.Period),
                        Hours = g.Hours,
                        HourRate = g.HourRate,
                        Total = g.Total,
                    }).ToList(),
                    Total = groups.Sum(g => g.Total),
                };
            }).ToList();

            return Task.FromResult<Result<PricingPreviewOutputModel>>(
                new PricingPreviewOutputModel { Examples = examples });
        }

        private static DateOnly ScenarioDate(DayOfWeek day) =>
            ReferenceMonday.AddDays(((int)day - (int)DayOfWeek.Monday + 7) % 7);

        /// <summary>
        /// Başlık senaryodan türer — metni ayrıca resx'e yazmak, senaryo ile
        /// başlığın ayrışıp ekranda yalan söylemesine kapı bırakırdı.
        /// </summary>
        private static string ScenarioTitle(DayOfWeek day, int startHour, int hours) =>
            $"{Turkish.DateTimeFormat.GetDayName(day)} {startHour:00}:00–{(startHour + hours) % 24:00}:00 ({hours} saat)";

        private static string GroupLabel(string dayType, string period)
        {
            var dayLabel = dayType == "Weekend" ? "hafta sonu" : "hafta içi";
            var periodLabel = period switch
            {
                "Morning" => "sabah",
                "Evening" => "akşam",
                _ => "gece",
            };
            return $"{dayLabel} {periodLabel}";
        }
```

- [ ] **Step 6: Testleri çalıştır, geçtiklerini gör**

Run: `dotnet test D:\Tekne\Tekne.Project.Api\Tekne.Project.Tests --filter "FullyQualifiedName~Preview_"`
Expected: 3 passed.

Başlık testlerinden biri kırılırsa sebebi büyük olasılıkla ICU'nun `tr-TR` gün adı biçimidir (beklenen: `Çarşamba`, `Cumartesi`). Beklenen metni değiştirmeden önce gerçek çıktıyı yazdırıp gör; farklıysa spec'teki başlık biçimini güncelleyip kullanıcıya haber ver.

- [ ] **Step 7: Tüm backend suite'ini çalıştır**

Run: `dotnet test D:\Tekne\Tekne.Project.Api\Tekne.Project.Tests`
Expected: hepsi geçer — mevcut `Quote_*` ve `Upsert_*` testleri etkilenmemeli (`PricingCalculator` ve `QuoteBreakdownOutputModel` değişmedi).

---

### Task 2: Backend — controller ucu

**Files:**
- Modify: `D:\Tekne\Tekne.Project.Api\Tekne.Project.Api\Controller\BoatsController.cs:47` (mevcut `GetPricing` ile `GetQuote` arasına)

**Interfaces:**
- Consumes: Task 1'in `GetPricingPreviewQuery(BoatPricingInputModel Model)`; `Auth.Partner`; `Result<T>.ToActionResult()`.
- Produces: `POST /api/Boats/pricing/preview` — Task 3'ün istemci servisi bu adresi çağırır.

- [ ] **Step 1: Ucu ekle**

`GetPricing` metodunun hemen altına:

```csharp
        /// <summary>
        /// Fiyatlandırma ekranındaki canlı örnek hesap. Tekne id'si almaz:
        /// hesap kayda değil gövdedeki matrise bakar, dolayısıyla sahiplik
        /// kontrol edilecek bir kayıt yok.
        /// </summary>
        [HttpPost("pricing/preview")]
        [Authorize(Policy = Auth.Partner)]
        public async Task<IActionResult> PreviewPricing([FromBody] BoatPricingInputModel model) =>
            (await mediator.Send(new GetPricingPreviewQuery(model))).ToActionResult();
```

`pricing/preview` literal segment; `{id}` route'larıyla çakışmaz.

- [ ] **Step 2: Derle**

Run: `dotnet build D:\Tekne\Tekne.Project.Api\Tekne.Project.Api`
Expected: 0 error.

- [ ] **Step 3: API'yi çalıştır ve ucun şemada göründüğünü doğrula**

Run: `dotnet run --project D:\Tekne\Tekne.Project.Api\Tekne.Project.Api` (arka planda)
Sonra `http://localhost:5188/swagger/v1/swagger.json` içinde `/api/Boats/pricing/preview` yolunu ve `PricingPreviewOutputModel` şemasını ara.
Expected: yol POST olarak listeleniyor; yanıt şeması `examples[].groups[].label` alanını taşıyor.

- [ ] **Step 4: Doğrulamanın çalıştığını doğrula**

`http://localhost:5188/swagger/index.html` → **Authorize** ile partner hesabının token'ını gir → `POST /api/Boats/pricing/preview` → Try it out, gövde:

```json
{ "baseRate": 0, "weekdayMorningRate": null, "weekdayEveningRate": null, "weekdayNightRate": null, "weekendMorningRate": null, "weekendEveningRate": null, "weekendNightRate": null }
```

Expected: **422**, gövdede "Saat ücreti 0'dan büyük olmalıdır.". 200 dönüyorsa query'deki alan adı `Model` değildir — Task 1'in notuna dön.

Ardından aynı uca `"baseRate": 3300` ile geçerli bir gövde gönder.
Expected: **200**, iki örnek; birincisinin başlığı `Çarşamba 10:00–14:00 (4 saat)`, tek grubunun `label` alanı `hafta içi sabah`.

---

### Task 3: İstemci — modeller ve servis metodu

**Files:**
- Modify: `d:\Tekne\Tekne.Project.Web\src\app\core\models\boat-pricing.ts` (dosya sonuna)
- Modify: `d:\Tekne\Tekne.Project.Web\src\app\core\services\boat-pricing.service.ts`

**Interfaces:**
- Consumes: Task 2'nin `POST /api/Boats/pricing/preview`; `API_BASE_URL`; `SILENT_ERRORS` (`@interceptors/error.interceptor`).
- Produces: `PricingPreviewOutputModel`, `PricingPreviewExampleOutputModel`, `PricingPreviewGroupOutputModel` (barrel `@models` üzerinden); `BoatPricingService.preview(model: BoatPricingInputModel): Observable<PricingPreviewOutputModel>`. Task 4 ikisini de kullanır.

Barrel dosyalarına dokunulmuyor: `core/models/index.ts:17` ve `core/services/index.ts:16` zaten bu dosyaları `export *` ile dışa veriyor.

- [ ] **Step 1: Modelleri ekle**

`src/app/core/models/boat-pricing.ts` sonuna:

```ts
/**
 * `POST /api/Boats/pricing/preview` yanıtı — fiyatlandırma ekranındaki canlı
 * örnek hesap. Hesabın tamamı backend'de: dilim sınırları, boş dilimin temel
 * ücrete düşmesi, gece yarısı devri ve gruplama kuralı orada yaşıyor
 * (`PricingCalculator.Breakdown`). İstemci yalnızca basar.
 */
export interface PricingPreviewGroupOutputModel {
  /** Gösterime hazır tek metin — "hafta sonu akşam". */
  label: string;
  hours: number;
  hourRate: number;
  total: number;
}

export interface PricingPreviewExampleOutputModel {
  /** "Çarşamba 10:00–14:00 (4 saat)" — senaryo da başlık da backend'den gelir. */
  title: string;
  groups: PricingPreviewGroupOutputModel[];
  total: number;
}

export interface PricingPreviewOutputModel {
  examples: PricingPreviewExampleOutputModel[];
}
```

- [ ] **Step 2: Servis metodunu ekle**

`src/app/core/services/boat-pricing.service.ts`:

`@models` importuna `PricingPreviewOutputModel` ekle:

```ts
import { BoatPricingInputModel, BoatPricingOutputModel, PricingPreviewOutputModel } from '@models';
```

`upsert`'ün altına:

```ts
  /**
   * Kaydedilmemiş matrisin örnek hesabı. Tekne id'si yok — hesap kayda değil
   * gövdedeki değerlere bakıyor.
   *
   * SILENT_ERRORS: kullanıcı sayı yazarken uçan her başarısız istek için toast
   * basmak gürültüden ibaret olurdu; ekran son iyi sonucu göstermeye devam eder.
   */
  preview(model: BoatPricingInputModel): Observable<PricingPreviewOutputModel> {
    return this.http.post<PricingPreviewOutputModel>(
      `${this.baseUrl}/Boats/pricing/preview`,
      model,
      { context: new HttpContext().set(SILENT_ERRORS, true) },
    );
  }
```

Ayrıca dosya başındaki sınıf yorumunu güncelle — artık yalnız `/pricing` uçları değil:

```ts
/**
 * `BoatsController`'ın fiyatlandırma uçları (`/api/Boats/{id}/pricing` ve
 * `/api/Boats/pricing/preview`). Hepsi `Partner` politikasına bağlı; tekne
 * sahipliği backend'de doğrulanır.
 */
```

- [ ] **Step 3: Derlendiğini doğrula**

Run: `cd d:\Tekne\Tekne.Project.Web; npx ng build`
Expected: build başarılı. (Bu adımda ekran henüz değişmedi; yalnız yeni kodun tip olarak tuttuğunu görüyoruz.)

---

### Task 4: İstemci — ekranı uca bağla, kopyayı sil

**Files:**
- Delete: `d:\Tekne\Tekne.Project.Web\src\app\features\provider\boats\boat-pricing\pricing-breakdown.ts`
- Modify: `d:\Tekne\Tekne.Project.Web\src\app\features\provider\boats\boat-pricing\boat-pricing.ts`
- Modify: `d:\Tekne\Tekne.Project.Web\src\app\features\provider\boats\boat-pricing\boat-pricing.html:163-181`

**Interfaces:**
- Consumes: Task 3'ün `BoatPricingService.preview(...)` ve `PricingPreviewOutputModel`; mevcut `model` / `useMatrix` / `withoutSlices` üyeleri.
- Produces: ekranda çalışan önizleme. Sonraki task yok.

- [ ] **Step 1: `pricing-breakdown.ts` dosyasını sil**

Dosyanın tamamı gider: `breakdown`, `BreakdownGroup`, `MORNING_START_HOUR`, `EVENING_START_HOUR`. Başka tüketicisi yok (tek import `boat-pricing.ts:14`).

- [ ] **Step 2: Bileşenin import'larını ve ölü kodunu temizle**

`boat-pricing.ts` başında:

```ts
import { Component, computed, inject, linkedSignal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { rxResource, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { form, required, submit } from '@angular/forms/signals';
import { debounceTime, firstValueFrom, map } from 'rxjs';
import { HlmButton } from '@ui/button';
import { HlmCardImports } from '@ui/card';
import { HlmSkeleton } from '@ui/skeleton';
import { HlmSwitchImports } from '@ui/switch';
import { AppAmountInput } from '@forms';
import { RentalType } from '@enums';
import { BoatPricingFormModel, BoatPricingInputModel, PricingPreviewOutputModel } from '@models';
import { BoatPricingService, BoatService, ToastService } from '@services';
```

Ardından `PricingExample` arayüzünü (satır 16-21) ve `EXAMPLE_SCENARIOS` sabitini (satır 23-31) sil — ikisi de artık backend'de.

- [ ] **Step 3: Gövde dönüştürücüsünü ayır**

`save()` ile önizleme aynı gövdeyi üretiyor; tek yerde toplansın. `withoutSlices`'ın altına:

```ts
  /** Form modelinden istek gövdesi — `save()` ve önizleme aynı gövdeyi üretir. */
  toInput(m: BoatPricingFormModel): BoatPricingInputModel {
    return {
      baseRate: m.baseRate ?? 0,
      weekdayMorningRate: m.weekdayMorningRate,
      weekdayEveningRate: m.weekdayEveningRate,
      weekdayNightRate: m.weekdayNightRate,
      weekendMorningRate: m.weekendMorningRate,
      weekendEveningRate: m.weekendEveningRate,
      weekendNightRate: m.weekendNightRate,
    };
  }
```

`save()` içindeki gövde kurulumunu buna indir:

```ts
      const useMatrix = this.useMatrix();
      const m = useMatrix ? this.model() : this.withoutSlices(this.model());
      const saved = await firstValueFrom(
        this.pricingService.upsert(Number(this.boatId()), this.toInput(m)),
      );
```

(`const input: BoatPricingInputModel = { ... }` bloğu tamamen gider.)

- [ ] **Step 4: `examples` computed'ını önizleme kaynağıyla değiştir**

Mevcut `examples = computed<PricingExample[]>(...)` bloğunu (satır 147-164) sil, yerine:

```ts
  /**
   * Örnek hesap için gönderilecek gövde. Temel ücret geçersizken `undefined` —
   * istek atılmaz, kart da gizli. Anahtar kapalıyken dilimler null gider ki
   * ekran, Kaydet'in göndereceği hâlle aynı sonucu göstersin.
   */
  previewParams = computed<BoatPricingInputModel | undefined>(() => {
    const m = this.model();
    if (m.baseRate === null || m.baseRate <= 0) return undefined;
    return this.toInput(this.useMatrix() ? m : this.withoutSlices(m));
  });

  /**
   * Hesap backend'de olduğu için her tuş vuruşu bir istek demek; 300 ms'lik
   * bekleme yazarken çıkan istekleri tek isteğe indiriyor.
   */
  debouncedPreviewParams = toSignal(toObservable(this.previewParams).pipe(debounceTime(300)), {
    initialValue: undefined,
  });

  previewResource = rxResource({
    params: () => this.debouncedPreviewParams(),
    stream: ({ params }) => this.pricingService.preview(params),
  });

  /**
   * Yeni istek uçarken kart bir önceki hesabı göstermeye devam eder (kullanıcı
   * kararı 2026-08-13): kaynak yükleme sırasında değerini boşaltıyor, son iyi
   * sonucu burada tutuyoruz. Skeleton kullanılmadı — her düzenlemede yanıp
   * sönme yaratıyordu.
   */
  lastPreview = linkedSignal<PricingPreviewOutputModel | undefined, PricingPreviewOutputModel | undefined>({
    source: () => (this.previewResource.hasValue() ? this.previewResource.value() : undefined),
    computation: (value, previous) => value ?? previous?.value,
  });

  /**
   * Temel ücret silinince kart anında gizlenir — `lastPreview` elindeki eski
   * hesabı göstermeye devam etmesin.
   */
  examples = computed(() => (this.previewParams() ? (this.lastPreview()?.examples ?? []) : []));

  /**
   * Ekrandaki hesap bayat mı: debounce beklerken de, istek uçarken de evet.
   * `previewParams` her düzenlemede yeni bir nesne ürettiği için kimlik
   * karşılaştırması bekleme penceresini de yakalıyor.
   */
  previewStale = computed(
    () => this.previewParams() !== this.debouncedPreviewParams() || this.previewResource.isLoading(),
  );
```

- [ ] **Step 5: Şablonu güncelle**

`boat-pricing.html` içinde örnek hesap kartı (satır 162-182) şu hâle gelir:

```html
          <div class="rounded-xl border border-primary/20 bg-primary/10 p-4">
            <p class="text-sm font-semibold text-primary-deep">Örnek hesap</p>
            <p class="mt-0.5 text-xs text-muted-foreground">
              Girdiğiniz fiyatlarla güncellenir.
            </p>

            <!--
              Hesap backend'den geldiği için ekrandaki rakam bir an bayat
              kalabiliyor; başlık tam opaklıkta kalır, yalnız sayılar soluyor.
            -->
            <div class="transition-opacity" [class.opacity-60]="previewStale()">
              @for (example of examples(); track example.title) {
                <div class="mt-3 rounded-lg bg-background p-3">
                  <p class="text-sm font-medium">{{ example.title }}</p>
                  <ul class="mt-1 flex flex-col gap-0.5 text-sm text-muted-foreground">
                    @for (group of example.groups; track $index) {
                      <li>
                        {{ group.hours }} saat × {{ format(group.hourRate) }} TL
                        ({{ group.label }}) = {{ format(group.total) }} TL
                      </li>
                    }
                  </ul>
                  <p class="mt-1 text-sm font-medium">Toplam: {{ format(example.total) }} TL</p>
                </div>
              }
            </div>
          </div>
```

`format()` bileşende kalır — binlik ayracı ve "TL" sunum işidir.

- [ ] **Step 6: Derle**

Run: `cd d:\Tekne\Tekne.Project.Web; npx ng build`
Expected: 0 error. Hata `breakdown` veya `BreakdownGroup` diyorsa Step 2'de kalan bir referans var.

- [ ] **Step 7: Mevcut testlerin yeşil kaldığını doğrula**

Run: `cd d:\Tekne\Tekne.Project.Web; npm test -- --watch=false`
Expected: mevcut suite geçer. İlk koşuda "N failed (no tests)" görürsen bu bilinen geçici bir imza — bir kez daha koş.

- [ ] **Step 8: Ekranda uçtan uca dene**

API çalışırken (`http://localhost:5188`) `npm start` ile aç, partner olarak giriş yap, saatlik bir teknenin `/partner/boats/:id/pricing` sekmesine git ve şunları sırayla doğrula:

1. Temel ücret gir (ör. 3300) → kısa bir duraklamadan sonra iki örnek kart dolar; Çarşamba satırı `4 saat × 3.300 TL (hafta içi sabah) = 13.200 TL`.
2. Yazmaya devam ederken kart soluklaşıp yeni sonuçla tam opaklığa döner; **boşalmaz**.
3. Anahtarı aç, hafta sonu akşam ücretine 5.000 gir → Cumartesi örneği iki satıra ayrılır.
4. Anahtarı kapat → örnek yeniden tek fiyat üzerinden hesaplanır (dilimler yok sayılır).
5. Temel ücreti sil → kart tamamen gizlenir.
6. API'yi durdur, bir rakam değiştir → **toast çıkmaz**, kart son hesabı göstermeye devam eder.

Beklenenden sapan bir adım olursa düzelt ve bu listeyi baştan koştur.

---

## Notlar

- **Commit yok:** değişiklikler çalışma ağacında bırakılır; commit'i kullanıcı atar.
- **Kapsam dışı:** `GET /Boats/{id}/quote` yanıtına breakdown eklemek, `PricingOptions` config ucu, React Native ekranı.
- **Bilinerek kalan:** `boat-pricing.html` satır 93 / 112 / 131'deki `08:00–18:00`, `18:00–24:00`, `00:00–08:00` başlıkları sabit. Örnek hesap kartı gizliyken de göründükleri için önizleme yanıtından beslenemezler; backend 08/18 sınırlarını değiştirirse bu üç metin elle güncellenmeli.
