# AppAmountInput Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tutar (TL) girişi için paylaşılan `app-amount-input` bileşeni: binlik ayraç maskesi, TL soneki, sayısal klavye, eksi yazılamaz; Fiyatlandırma sekmesinin 7 alanı buna geçer ve alan bazlı `greaterThanZero` mesajları kaldırılır.

**Architecture:** Tek dosyalık inline-template bileşen (`shared/forms` deseni). ngx-mask `separator.0` + Signal Forms `[formField]` kompozisyonu app-phone-input'ta kanıtlı; sayı ↔ metin dönüşümünü ngx-mask'ın `inputTransformFn`/`outputTransformFn` çifti yapar (OutputTransformFn `unknown` döner — `number | null` çıkışı tip-yasal; node_modules/ngx-mask/types/ngx-mask.d.ts:7-8'den doğrulandı). TL soneki `hlm-input-group-addon align="inline-end"` (API `src/app/shared/ui/input-group/src/lib/hlm-input-group-addon.ts:35`).

**Tech Stack:** Angular 22 Signal Forms, ngx-mask ^22.1.0 (kurulu), spartan/ui input-group.

**Spec:** `docs/superpowers/specs/2026-08-11-amount-input-design.md`

## Global Constraints

- **Test yazılmaz** (proje kuralı). Doğrulama `npx ng build` + mevcut süit (`npm test -- --watch=false`, 91 test) yeşil.
- **Commit atılmaz** — kullanıcı istemedikçe (HARD RULE); subagent dispatch'lerine commit talimatı yazılmaz.
- Angular 22: erişim belirteci yazma; `inject()`; `input()`; `@if`/`@for`; `booleanAttribute` transform deseni.
- Model **`number | null` kalır**; boş giriş `null` üretir, `0` değil.
- Eksi değer maskede yazılamaz (`allowNegativeNumbers` ngx-mask varsayılanı `false` — ayrıca set edilmez).
- UI metinleri Türkçe; `dark:` yok; mobile-first.
- Vitest ilk koşuda "N failed (no tests)" verebilir — bir kez daha koş.

---

### Task 1: AppAmountInput bileşeni + barrel

**Files:**
- Create: `src/app/shared/forms/app-amount-input.ts`
- Modify: `src/app/shared/forms/index.ts` (1. satıra export)

**Interfaces:**
- Consumes: `FieldTree`/`FormField` (`@angular/forms/signals`), `NgxMaskDirective`/`provideNgxMask` (`ngx-mask`), `HlmFieldImports` (`@ui/field`), `HlmInputGroupImports` (`@ui/input-group`), `ErrorMessagePipe` (`./error-message-pipe`).
- Produces: `AppAmountInput` (selector `app-amount-input`; girdiler `label: string` (required), `field: FieldTree<number | null>` (required), `optional`, `hideLabel` (boolean attr), `placeholder?: string`) — `@forms`'tan export edilir; Task 2 kullanır.

- [ ] **Step 1: Bileşeni yaz**

`src/app/shared/forms/app-amount-input.ts`:

```ts
import { booleanAttribute, Component, computed, input } from '@angular/core';
import { FieldTree, FormField } from '@angular/forms/signals';
import { NgxMaskDirective, provideNgxMask } from 'ngx-mask';
import { HlmFieldImports } from '@ui/field';
import { HlmInputGroupImports } from '@ui/input-group';
import { ErrorMessagePipe } from './error-message-pipe';

/**
 * Signal Forms'a bağlı tutar (TL) girişi: binlik ayraçlı maske (1500 → 1.500),
 * sağda "TL" soneki, mobilde sayısal klavye. Kuruş yok — tam TL.
 *
 * Model `number | null` tutar: boş giriş `null` olur (`0` değil), böylece
 * "boş dilim temel ücrete düşer" gibi kurallar sıfırla karışmaz. Maske eksi
 * işaretini hiç kabul etmez (`allowNegativeNumbers` varsayılanı kapalı) —
 * formların ayrıca "0'dan büyük" mesajı üretmesi gerekmez.
 *
 * `[formField]` + `mask` kompozisyonu app-phone-input'taki desenin aynısı;
 * sayı ↔ maskeli metin dönüşümünü `inputTransformFn`/`outputTransformFn`
 * çifti yapar (maske ayraçları `dropSpecialCharacters` ile zaten düşürür).
 */
@Component({
  selector: 'app-amount-input',
  imports: [ErrorMessagePipe, FormField, HlmFieldImports, HlmInputGroupImports, NgxMaskDirective],
  providers: [provideNgxMask()],
  template: `
    <div hlmField>
      <label hlmFieldLabel [class.sr-only]="hideLabel()">
        {{ label() }}
        @if (optional()) {
          <span class="font-normal text-muted-foreground">(isteğe bağlı)</span>
        }
      </label>
      <div hlmInputGroup>
        <input
          hlmInputGroupInput
          type="text"
          inputmode="numeric"
          [attr.placeholder]="placeholder()"
          [formField]="field()"
          mask="separator.0"
          thousandSeparator="."
          [validation]="false"
          [inputTransformFn]="fromModel"
          [outputTransformFn]="toModel"
        />
        <hlm-input-group-addon align="inline-end">TL</hlm-input-group-addon>
      </div>
      @if (state().touched()) {
        @for (error of state().errors(); track error.kind) {
          <hlm-field-error forceShow>{{ error | errorMessage }}</hlm-field-error>
        }
      }
    </div>
  `,
})
export class AppAmountInput {
  label = input.required<string>();

  field = input.required<FieldTree<number | null>>();

  optional = input(false, { transform: booleanAttribute });

  placeholder = input<string>();

  hideLabel = input(false, { transform: booleanAttribute });

  state = computed(() => this.field()());

  /** Model → input: sayı ngx-mask'a olduğu gibi verilir (maskeyi o basar); boş model boş metin. */
  fromModel = (value: unknown): string | number => (value == null ? '' : (value as number));

  /** Input → model: ayraçları düşmüş rakam dizisi gelir; boşsa `null`. */
  toModel = (value: string | number | undefined | null): number | null => {
    const s = String(value ?? '').trim();
    return s === '' ? null : Number(s);
  };
}
```

- [ ] **Step 2: Barrel'a ekle**

`src/app/shared/forms/index.ts` — 1. satırdan önce (dosya `app-input` ile başlıyor; alfabetik olarak `app-amount-input` ondan önce gelir):

```ts
export * from './app-amount-input';
```

- [ ] **Step 3: Build ile doğrula**

Run: `npx ng build`
Expected: hatasız tamamlanır.

---

### Task 2: Fiyatlandırma sekmesini geçir

**Files:**
- Modify: `src/app/features/provider/boats/boat-pricing/boat-pricing.ts` (import + form şeması)
- Modify: `src/app/features/provider/boats/boat-pricing/boat-pricing.html` (7 alan)

**Interfaces:**
- Consumes: `AppAmountInput` (`@forms`, Task 1).
- Produces: — (yaprak değişiklik).

- [ ] **Step 1: boat-pricing.ts — import değişikliği**

- `import { form, required, submit, validate } from '@angular/forms/signals';` → `validate` kaldır: `import { form, required, submit } from '@angular/forms/signals';`
- `import { AppInput } from '@forms';` → `import { AppAmountInput } from '@forms';`
- `@Component.imports` dizisinde `AppInput` → `AppAmountInput`.

- [ ] **Step 2: boat-pricing.ts — form şemasını sadeleştir**

Mevcut `pricingForm = form(...)` bloğunu (rateFields dizisi ve `validate` döngüsü dahil) şununla değiştir:

```ts
  /**
   * Yalnız zorunluluk kuralı: eksi değer app-amount-input maskesinde zaten
   * yazılamıyor; sıfır ucu backend validator'ına bırakıldı (nadir durum,
   * mesajını interceptor toast'la gösterir).
   */
  pricingForm = form(this.model, (path) => {
    required(path.baseRate);
  });
```

- [ ] **Step 3: boat-pricing.html — temel ücret alanı**

```html
    <app-input
      class="sm:max-w-[12rem]"
      label="Temel saat ücreti (TL)"
      type="number"
      [field]="pricingForm.baseRate"
    />
```

→

```html
    <app-amount-input
      class="sm:max-w-[12rem]"
      label="Temel saat ücreti"
      [field]="pricingForm.baseRate"
    />
```

- [ ] **Step 4: boat-pricing.html — 6 matris hücresi**

Altı `app-input` bloğunun tamamı aynı kalıpla değişir: etiket "(TL)"siz, `type="number"` yok, `hideLabel` ve `[placeholder]` kalır. Sırayla:

```html
      <app-amount-input
        hideLabel
        label="Hafta içi sabah ücreti"
        [placeholder]="basePlaceholder()"
        [field]="pricingForm.weekdayMorningRate"
      />
      <app-amount-input
        hideLabel
        label="Hafta sonu sabah ücreti"
        [placeholder]="basePlaceholder()"
        [field]="pricingForm.weekendMorningRate"
      />
```

```html
      <app-amount-input
        hideLabel
        label="Hafta içi akşam ücreti"
        [placeholder]="basePlaceholder()"
        [field]="pricingForm.weekdayEveningRate"
      />
      <app-amount-input
        hideLabel
        label="Hafta sonu akşam ücreti"
        [placeholder]="basePlaceholder()"
        [field]="pricingForm.weekendEveningRate"
      />
```

```html
      <app-amount-input
        hideLabel
        label="Hafta içi gece ücreti"
        [placeholder]="basePlaceholder()"
        [field]="pricingForm.weekdayNightRate"
      />
      <app-amount-input
        hideLabel
        label="Hafta sonu gece ücreti"
        [placeholder]="basePlaceholder()"
        [field]="pricingForm.weekendNightRate"
      />
```

(Satır etiketli `<div>` blokları — "Sabah/Akşam/Gece" + saat aralığı — ve grid sarmalayıcı aynen kalır.)

- [ ] **Step 5: Build + süit ile doğrula**

Run: `npx ng build`
Expected: hatasız.

Run: `npm test -- --watch=false`
Expected: mevcut süit yeşil (91 test). İlk koşu "N failed (no tests)" derse bir kez daha koş.

---

### Task 3: Elle doğrulama (kullanıcı tarayıcıda)

**Files:** yok.

**Interfaces:** —

- [ ] **Step 1: Kontrol listesi kullanıcıya raporlanır**

Dev server zaten ayakta (HMR değişiklikleri alır). Kullanıcının bakacakları:
- Alanlara yazarken binlik ayraç: `1500` → `1.500`; `-`, harf, virgül yazılamıyor.
- Sağda "TL" soneki görünüyor; etiketlerde "(TL)" artık yok.
- Boş hücre placeholder'ı temel ücreti ayraçlı gösteriyor (`1.500`).
- Kaydet → başarı toast'ı; yenileyince değerler maskeli geliyor.
- Temel ücret boş bırakılıp Kaydet → yalnız required mesajı; başka alan mesajı yok.
- Mobil genişlikte (~390px) matris taşmıyor.
