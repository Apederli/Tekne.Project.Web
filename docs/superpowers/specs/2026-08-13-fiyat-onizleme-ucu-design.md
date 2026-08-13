# Fiyat önizleme ucu — örnek hesabın backend'e taşınması

**Tarih:** 2026-08-13
**Repo'lar:** `Tekne.Project.Api` (yeni uç) + `Tekne.Project.Web` (istemci kopyasının kaldırılması)

## Sorun

Partner fiyatlandırma sekmesindeki "Örnek hesap" kartı, backend `PricingCalculator.Breakdown`'ın elle yazılmış istemci kopyasıyla hesaplanıyor (`src/app/features/provider/boats/boat-pricing/pricing-breakdown.ts`). Kopya dört ayrı backend semantiğini taşıyor:

- boş dilimin temel ücrete düşmesi (`dilim ?? temel`),
- dilim sınırları (08:00 / 18:00 — `PricingOptions`),
- hafta sonu tanımı (Cumartesi, Pazar),
- gece yarısını aşan kiralamada günün saat saat ilerlemesi,
- ardışık, aynı ücretli saatlerin tek satırda gruplanması.

Backend bunlardan birini değiştirdiğinde ekran sessizce yanlış **fiyat** gösterir; hiçbir test kırılmaz. Mobil (React Native) partner ekranı yazıldığında aynı kopya üçüncü kez çıkacak.

Mevcut `GET /Boats/{id}/quote` bu ihtiyacı karşılayamaz: **kayıtlı** fiyat üzerinden çalışır, teknenin aktif ve saatlik olmasını arar, `hours >= MinimumRentalDuration` şartı koyar. Partner ise henüz kaydetmediği rakamların sonucunu görmek istiyor. Ayrıca yanıtında döküm yok — `QuoteBreakdownOutputModel` hesaplanıp atılıyor.

## Karar

Hesap backend'e taşınır; **ayrı bir önizleme ucu** açılır. İstemcideki kopya silinir.

Değerlendirilen alternatifler:

- **Yalnız config ucu** (`GET /pricing/options` ile 08/18 sınırlarını servis edip aritmetiği istemcide bırakmak): anındalığı korur, elle senkron riskini daraltır, ama kuralın kendisi iki — yarın üç — dilde kalır. Ekranda para gösterildiği için yetersiz bulundu.
- **Şimdilik dokunmamak:** RN partner ekranı yazılırken bakmak. Reddedildi; kopya bugün de yanlış fiyat gösterme riski taşıyor.

Kabul edilen bedel: kart artık her tuş vuruşunda anında değil, ~300 ms debounce'lu ağ turuyla güncelleniyor.

## Uç sözleşmesi

`POST /api/Boats/pricing/preview` — `[Authorize(Policy = Auth.Partner)]`.

**Tekne id'si yok.** Hesap matrisin saf fonksiyonu; ortada okunan bir kayıt olmadığı için sahiplik kontrolü de gerekmez.

**İstek gövdesi:** mevcut `BoatPricingInputModel`, aynen. Yan faydası: `ValidationBehavior` request'in `Model` adlı property'sini otomatik doğruluyor (`ValidationBehavior.cs:34-49`), dolayısıyla query `Model` adında bir alan taşıdığı sürece `BoatPricingInputModelValidator` kendiliğinden çalışır — `baseRate ≤ 0` ve negatif dilim **422** döner, yeni doğrulama yazılmaz.

**Yanıt:**

```csharp
public record PricingPreviewOutputModel
{
    public required List<PricingPreviewExampleOutputModel> Examples { get; set; }
}

public record PricingPreviewExampleOutputModel
{
    public required string Title { get; set; }              // "Çarşamba 10:00–14:00 (4 saat)"
    public required List<PricingPreviewGroupOutputModel> Groups { get; set; }
    public decimal Total { get; set; }
}

public record PricingPreviewGroupOutputModel
{
    public required string Label { get; set; }              // "hafta sonu akşam"
    public int Hours { get; set; }
    public decimal HourRate { get; set; }
    public decimal Total { get; set; }
}
```

`Label` gösterime hazır tek metin. Ayrı `dayType` / `period` alanları yerine tek alan seçildi: istemci ikisini zaten yan yana basıyor, ayrı tutmak istemciye yalnızca birleştirme kuralı taşır.

`QuoteBreakdownOutputModel`'e ve `PricingCalculator.Breakdown` imzasına **dokunulmaz**. Yeni handler `Breakdown` çıktısını preview modeline map ederken etiketi üretir. Müşteri tarafındaki `quote` ucu ileride kendi kararıyla ilerler.

## Senaryolar

Backend'de sabit, tek yerde tanımlı:

| Gün | Başlangıç | Süre | Neden |
|---|---|---|---|
| Çarşamba | 10:00 | 4 saat | tek dilimde kalan basit durum |
| Cumartesi | 16:00 | 4 saat | 18:00'de sabahtan akşam dilimine geçiş |

**Başlık resx'e girmez, senaryodan türer:** `tr-TR` kültüründen gün adı + `startHour`/`hours`'tan saat aralığı. Başlığı resx'e koyup senaryoyu kodda tutmak, ikisinin ayrışıp ekranda yalan söylemesine kapı bırakır — bu spec'in kapatmaya çalıştığı hatanın aynısı.

`Breakdown` bir `DateOnly` istediği için handler sabit bir referans hafta kullanır: **2024-01-01 Pazartesi** (Çarşamba = 2024-01-03, Cumartesi = 2024-01-06). `TrTime.Now`'a bağlanmaz; çıktı gün geçince değişmez ve test edilebilir.

## İstemci değişikliği

- `src/app/features/provider/boats/boat-pricing/pricing-breakdown.ts` **silinir** — `breakdown`, `BreakdownGroup`, `MORNING_START_HOUR`, `EVENING_START_HOUR` dahil.
- `EXAMPLE_SCENARIOS` ve `PricingExample` bileşenden kalkar.
- Üç yeni model `src/app/core/models/boat-pricing.ts`'e eklenir (yanıt sözleşmesinin karşılıkları).
- `BoatPricingService.preview(model)` eklenir, istek `SILENT_ERRORS` ile gider: önizleme başarısızlığı için toast basmak, kullanıcı sayı yazarken gürültüden ibaret.
- `examples = computed(...)` yerine debounce'lu kaynak:
  - `previewParams` — `baseRate` geçersizse `undefined`; anahtar kapalıysa `withoutSlices(model)`.
  - `toObservable(previewParams).pipe(debounceTime(300))` → `rxResource`.
- **Ara durum:** yeni istek uçarken kart bir önceki hesabı göstermeye devam eder. `linkedSignal` ile son iyi sonuç korunur; kart `isLoading()` iken `opacity-60` + `transition-opacity`. Skeleton kullanılmaz — her düzenlemede yanıp sönme yaratır.
- Şablonda grup satırı `group.label` kullanır. `format()` istemcide kalır: binlik ayracı ve "TL" sunum işidir.
- Kart alt metni: `"Girdiğiniz fiyatlarla anında güncellenir."` → `"Girdiğiniz fiyatlarla güncellenir."`

## Uç durumlar

| Durum | Davranış |
|---|---|
| `baseRate` boş veya ≤ 0 | İstek atılmaz, kart gizli (bugünkü davranış korunur) |
| Dilim anahtarı kapalı | Gövde `withoutSlices` ile gider — ekran, Kaydet'in göndereceği halin sonucunu gösterir |
| İstek hata verdi | Toast yok; kart son iyi sonucu göstermeye devam eder |
| Henüz hiç sonuç yok + hata | Kart gizli kalır |
| Sekme ilk açıldı, kayıtlı fiyat geldi | Tek istek uçar |

## Test

Backend'de handler testi yazılır (`BoatPricingHandlerTests` ve `PricingCalculatorTests` zaten mevcut): iki senaryo için grup sayısı, etiketler ve toplamlar. Referans hafta sabit olduğu için deterministik.

Frontend'de test yazılmaz (proje tercihi); mevcut Vitest suite'i yeşil kalır.

## Kalan risk

Şablondaki dilim başlıkları — `08:00–18:00`, `18:00–24:00`, `00:00–08:00` (`boat-pricing.html` satır 93, 112, 131) — sabit kalır. Bunlar örnek hesap kartı gizliyken de görünür, dolayısıyla önizleme yanıtından beslenemezler.

Elle senkron yüzeyi kapanmıyor, daralıyor: aritmetik gidiyor, üç metin kalıyor. Kapatmak istenirse config ucu (`GET /pricing/options` → `morningStartHour`, `eveningStartHour`) sonradan eklenebilir. Bu spec'in kapsamında değil.

## Kapsam dışı

- `GET /Boats/{id}/quote` yanıtına breakdown eklemek (müşteri tarafı dökümü — ayrı iş).
- `PricingOptions` config ucu.
- React Native partner ekranı.

## Dokunulan dosyalar

### `Tekne.Project.Api`

| Dosya | Değişiklik |
|---|---|
| `Tekne.Project.Shema/Model/BoatPricing.cs` | üç yeni output modeli |
| `Tekne.Project.Api/CQRS/BoatPricingCqrs.cs` | `GetPricingPreviewQuery` |
| `Tekne.Project.Api/Impl/Query/BoatPricingQueryHandler.cs` | yeni handler: senaryolar, `Breakdown` çağrısı, etiket üretimi |
| `Tekne.Project.Api/Controller/BoatsController.cs` | `[HttpPost("pricing/preview")]` — literal segment, `{id}` route'larıyla çakışmaz |
| `Tekne.Project.Tests/Handlers/BoatPricingHandlerTests.cs` | iki senaryo testi |

### `Tekne.Project.Web`

| Dosya | Değişiklik |
|---|---|
| `src/app/core/models/boat-pricing.ts` | üç yeni model |
| `src/app/core/services/boat-pricing.service.ts` | `preview()` |
| `src/app/features/provider/boats/boat-pricing/pricing-breakdown.ts` | **silinir** |
| `src/app/features/provider/boats/boat-pricing/boat-pricing.ts` | `computed` → debounce'lu `rxResource` + `linkedSignal` |
| `src/app/features/provider/boats/boat-pricing/boat-pricing.html` | `group.label`, soluk ara durum, alt metin |
