# Çalışma Kartı (Kiralama Tipi + Minimum Süre) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Partner tekne formuna yeni "Çalışma" kartı: kiralama tipi toggle'ı oraya taşınır (etiket "Gecelik" olur), tipe göre birim etiketi değişen minimum süre alanı eklenir; `RentalType.Daily` → `Nightly` düzeltmesiyle backend'le eşitlenir.

**Architecture:** Alan tanımları `core/` katmanında (enum, modeller, form-model util), UI ve doğrulama `boat-form` bileşeninde. Doğrulama kuralları backend `BoatInputModelValidator` ile birebir: zorunlu, ≥ 1, Saatlik'te ≤ 12. Spec: `docs/superpowers/specs/2026-08-09-calisma-karti-minimum-sure-design.md`.

**Tech Stack:** Angular 22, Signal Forms (`@angular/forms/signals`), spartan/ui (HlmCard, HlmToggleGroup), Vitest.

## Global Constraints

- **Commit YOK.** Hiçbir adımda commit atılmaz; kullanıcı istediğinde kendisi söyler. (Kullanıcının kalıcı kuralı — plan şablonundaki commit adımları bilinçli çıkarıldı.)
- **Yeni test yazılmaz.** Proje sonuna kadar kural; yalnızca mevcut suite yeşil tutulur — derlemeyi kıran fixture'lar güncellenir.
- Angular 22 konvansiyonları: `standalone`/`OnPush` yazma, erişim belirteci (`private`/`readonly`) yazma, `inject()`, `computed()`, `@if`/`@for`.
- Interface'ler bileşen dosyasına değil `src/app/core/models/` altına yazılır.
- Ekran metinleri Türkçe; hata mesajları backend validator mesajlarıyla aynı dilde/tonda.
- Mobile-first: taban sınıflar mobil düzeni tarif eder, `sm:`/`lg:` yalnızca büyütür.
- Beklenen HTTP hataları için try/catch yazılmaz (`errorInterceptor` gösterir).
- Test komutu: `npm test -- --watch=false` (Vitest; Karma değil).

---

### Task 1: Core katmanı — enum, modeller, form-model util, fixture düzeltmeleri

**Files:**
- Modify: `src/app/core/enums/rental-type.ts`
- Modify: `src/app/core/models/boat.ts` (BoatInputModel, BoatFormModel, BoatOutputModel)
- Modify: `src/app/core/util/boat-form-model.ts`
- Modify: `src/app/features/provider/boats/boat-form/boat-form.spec.ts` (yalnızca derleme düzeltmesi)
- Modify: `src/app/features/provider/boats/my-boats/my-boats.spec.ts` (yalnızca derleme düzeltmesi)
- Modify: `src/app/features/market/boat-detail/boat-detail.spec.ts` (yalnızca derleme düzeltmesi)

**Interfaces:**
- Consumes: —
- Produces: `RentalType.Nightly = 'Nightly'`; `BoatInputModel.minimumRentalDuration?: number`; `BoatOutputModel.minimumRentalDuration: number`; `BoatFormModel.minimumRentalDuration: number | null`; `emptyBoatForm()` bu alanı `1` ile başlatır. Task 2 bu adları kullanır.

- [ ] **Step 1: Enum'u backend ile eşitle**

`src/app/core/enums/rental-type.ts` dosyasının tamamı şöyle olacak:

```ts
/**
 * Kiralama tipi. Bir tekne tek tip yapar; şu anki odak saatlik.
 *
 * Kaynak: `Tekne.Project.Shema/Enums/RentalType.cs`. Backend'de sayısal
 * (`Hourly = 1`, `Nightly = 2`) ama JSON'a isimle serialize edilir.
 */
export enum RentalType {
  Hourly = 'Hourly',
  Nightly = 'Nightly',
}
```

- [ ] **Step 2: `BoatInputModel`'e alanı ekle**

`src/app/core/models/boat.ts` içinde `BoatInputModel`'de `swimmingCapacity: number;` satırının hemen altına:

```ts
  /**
   * Minimum kiralama süresi — birimi `rentalType`'a göre saat ya da gece.
   * Swagger'da nullable (boş gönderilirse backend 1 kaydeder); form her
   * zaman değer gönderir. Saatlik teknede backend tavanı 12'dir.
   */
  minimumRentalDuration?: number;
```

- [ ] **Step 3: `BoatFormModel`'e alanı ekle**

Aynı dosyada `BoatFormModel`'de `swimmingCapacity: number | null;` satırının hemen altına:

```ts
  minimumRentalDuration: number | null;
```

- [ ] **Step 4: `BoatOutputModel`'e alanı ekle**

Aynı dosyada `BoatOutputModel`'de `swimmingCapacity: number;` satırının hemen altına:

```ts
  /** Minimum kiralama süresi — backend her zaman doldurur (≥ 1). */
  minimumRentalDuration: number;
```

- [ ] **Step 5: Form-model util'i güncelle**

`src/app/core/util/boat-form-model.ts`:

`emptyBoatForm()` içinde `swimmingCapacity: null,` satırının altına (ürün kararı: varsayılan 1 gider):

```ts
    minimumRentalDuration: 1,
```

`toBoatFormModel()` içinde `swimmingCapacity: boat.swimmingCapacity,` satırının altına:

```ts
    minimumRentalDuration: boat.minimumRentalDuration,
```

- [ ] **Step 6: Mevcut spec fixture'larını derlenir hâle getir (yeni test yazma)**

Üç dosyada da yalnızca eksik alan eklenir:

`src/app/features/provider/boats/boat-form/boat-form.spec.ts` — `validModel` sabitinde `swimmingCapacity: 8,` satırının altına:

```ts
  minimumRentalDuration: 1,
```

`src/app/features/provider/boats/my-boats/my-boats.spec.ts` — `boat()` fabrikasındaki nesnede `rentalTypeLabel: 'Saatlik',` satırının altına:

```ts
    minimumRentalDuration: 1,
```

`src/app/features/market/boat-detail/boat-detail.spec.ts` — `boat()` fabrikasındaki nesnede `rentalTypeLabel: 'Saatlik',` satırının altına:

```ts
    minimumRentalDuration: 1,
```

Not: `boat-form.spec.ts`'teki POST gövdesi assertion'ına dokunma — `save()` bu task'ta henüz alanı göndermiyor, assertion bu hâliyle geçer. Task 2 günceller.

- [ ] **Step 7: Suite'i çalıştır, yeşil doğrula**

Run: `npm test -- --watch=false`
Expected: tüm testler PASS (derleme hatası yok, davranış değişmedi).

---

### Task 2: Çalışma kartı — UI, doğrulama, gönderim

**Files:**
- Modify: `src/app/features/provider/boats/boat-form/boat-form.ts`
- Modify: `src/app/features/provider/boats/boat-form/boat-form.html`
- Modify: `src/app/features/provider/boats/boat-form/boat-form.spec.ts` (yalnızca mevcut assertion güncellemesi)

**Interfaces:**
- Consumes: Task 1'in `RentalType.Nightly`, `BoatFormModel.minimumRentalDuration: number | null`, `BoatInputModel.minimumRentalDuration?: number` tanımları.
- Produces: — (yaprak görev)

- [ ] **Step 1: Toggle etiketi ve enum üyesini güncelle**

`boat-form.ts` içinde `rentalTypeOptions` şöyle olacak:

```ts
  rentalTypeOptions = [
    { value: RentalType.Hourly, label: 'Saatlik' },
    { value: RentalType.Nightly, label: 'Gecelik' },
  ];
```

- [ ] **Step 2: Birim etiketi computed'ını ekle**

`boat-form.ts` içinde `isUpdate` computed'ının altına:

```ts
  /** Minimum süre alanının etiketi — birim kiralama tipinden gelir. */
  minimumDurationLabel = computed(() => {
    switch (this.model().rentalType) {
      case RentalType.Hourly:
        return 'Minimum süre (saat)';
      case RentalType.Nightly:
        return 'Minimum süre (gece)';
      default:
        return 'Minimum süre';
    }
  });
```

- [ ] **Step 3: Doğrulama kurallarını ekle**

`boat-form.ts` içinde `boatForm = form(...)` bloğunda, `required(path.swimmingCapacity, ...)` / `min(path.swimmingCapacity, ...)` satırlarının hemen altına (kurallar backend `BoatInputModelValidator` ile birebir):

```ts
    required(path.minimumRentalDuration, { message: 'Minimum süre gerekli.' });
    min(path.minimumRentalDuration, 1, { message: 'Minimum süre en az 1 olmalı.' });
    validate(path.minimumRentalDuration, (ctx) => {
      const value = ctx.value();
      return value !== null &&
        value > 12 &&
        ctx.valueOf(path.rentalType) === RentalType.Hourly
        ? {
            kind: 'hourlyMax',
            message: 'Saatlik teknede minimum süre en fazla 12 saat olabilir.',
          }
        : undefined;
    });
```

Not: Gecelik→Saatlik geçişte 12'den büyük değer kalırsa bu kural tetiklenir; değer sıfırlanmaz (spec kararı: tip değişince sayı korunur), kayıt hata mesajıyla engellenir.

- [ ] **Step 4: `save()` gönderimine alanı ekle**

`boat-form.ts` `save()` içindeki `input: BoatInputModel` nesnesinde `swimmingCapacity: m.swimmingCapacity ?? 0,` satırının altına:

```ts
        minimumRentalDuration: m.minimumRentalDuration ?? 1,
```

(`?? 1` yalnızca tip daraltma — doğrulama boş bırakmayı zaten engeller; 1 backend'in de varsayılanı.)

- [ ] **Step 5: Şablona Çalışma kartını ekle, toggle'ı taşı**

`boat-form.html`:

**(a)** "Temel bilgiler" kartındaki iki sütunlu `div.grid`'i kaldırıp yerine yalnızca tekne tipi alanını bırak. Yani şu blok:

```html
        <div class="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div hlmField>
            <span hlmFieldLabel>Tekne tipi</span>
            ...
          </div>

          <div hlmField>
            <span hlmFieldLabel>Kiralama tipi</span>
            ...
          </div>
        </div>
```

şuna dönüşecek (kiralama tipi bloğu buradan çıkar, sarmalayıcı grid kalkar):

```html
        <div hlmField>
          <span hlmFieldLabel>Tekne tipi</span>
          <hlm-toggle-group type="single" [formField]="boatForm.boatType">
            @for (option of boatTypeOptions; track option.value) {
              <button hlmToggleGroupItem type="button" [value]="option.value">
                {{ option.label }}
              </button>
            }
          </hlm-toggle-group>
          @if (boatForm.boatType().touched()) {
            @for (error of boatForm.boatType().errors(); track error.kind) {
              <hlm-field-error forceShow>{{ error.message }}</hlm-field-error>
            }
          }
        </div>
```

**(b)** "Temel bilgiler" `</section>` kapanışının hemen ardından, "Boyut ve kapasite" kartından önce yeni kartı ekle:

```html
    <section hlmCard>
      <div hlmCardHeader>
        <h2 hlmCardTitle>Çalışma</h2>
        <p hlmCardDescription>Teknenin kiralama modeli ve kabul ettiği minimum süre.</p>
      </div>
      <div hlmCardContent class="grid grid-cols-1 items-start gap-5 sm:grid-cols-2">
        <div hlmField>
          <span hlmFieldLabel>Kiralama tipi</span>
          <hlm-toggle-group type="single" [formField]="boatForm.rentalType">
            @for (option of rentalTypeOptions; track option.value) {
              <button hlmToggleGroupItem type="button" [value]="option.value">
                {{ option.label }}
              </button>
            }
          </hlm-toggle-group>
          @if (boatForm.rentalType().touched()) {
            @for (error of boatForm.rentalType().errors(); track error.kind) {
              <hlm-field-error forceShow>{{ error.message }}</hlm-field-error>
            }
          }
        </div>

        <app-input
          class="sm:max-w-[12rem]"
          [label]="minimumDurationLabel()"
          type="number"
          [field]="boatForm.minimumRentalDuration"
        />
      </div>
    </section>
```

- [ ] **Step 6: Mevcut POST assertion'ını güncelle (yeni test yazma)**

`boat-form.spec.ts` — `'geçerli formu sayısal alanları çevirerek POST eder'` testindeki `expect(req.request.body).toEqual({...})` nesnesinde `swimmingCapacity: 8,` satırının altına:

```ts
      minimumRentalDuration: 1,
```

- [ ] **Step 7: Suite'i çalıştır, yeşil doğrula**

Run: `npm test -- --watch=false`
Expected: tüm testler PASS.

- [ ] **Step 8: Prod build doğrula**

Run: `npm run build`
Expected: hatasız tamamlanır (`dist/tekne-web` üretilir).

- [ ] **Step 9: Elle doğrulama (API lokalde koşuyorken)**

Run: `npm start` → `http://localhost:4200/partner` altında tekne formunu aç.
Kontrol listesi:
- Çalışma kartı Temel bilgiler'in yanında/altında görünür, toggle "Saatlik / Gecelik".
- Minimum süre alanı 1 ile dolu gelir; Saatlik seçiliyken etiket "(saat)", Gecelik'te "(gece)".
- Saatlik + 13 → "Saatlik teknede minimum süre en fazla 12 saat olabilir." hatası, kayıt engellenir.
- Gecelik + 30 → kayıt başarılı; düzenlemede alan 30 olarak geri gelir.
