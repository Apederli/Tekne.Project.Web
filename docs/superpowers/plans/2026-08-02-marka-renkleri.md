# Marka Renkleri Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Nötr gri spartan temasını marka renklerine bağlamak — yeşil `#6BC3A6` primary, mavi `#5FA9C9` secondary — ve dört ad-hoc renk kullanımını token'lara taşımak.

**Architecture:** Değişiklik token seviyesinde: `src/tailwind.css` içindeki spartan semantik CSS değişkenleri (`:root`) markaya çekilir; bileşenler otomatik renklenir. Dark tema kullanılmayacak (uygulama sırasında gelen ürün kararı) — `:root.dark` iskeleti silinir. Beyaz zemin üstü yazı/ikon için `@theme inline` ile iki türetilmiş utility (`text-primary-deep`, `text-secondary-deep`) eklenir. Bileşen restyle'ı yok.

**Tech Stack:** Angular 22, Tailwind CSS v4 (CSS-first, `tailwind.config.js` yok), spartan/ui helm token sistemi, oklch renk uzayı.

**Spec:** `docs/superpowers/specs/2026-08-02-marka-renkleri-design.md`

## Global Constraints

- **Commit atılmaz** — değişiklikler working tree'de bırakılır; kullanıcı diff'i onaylayınca kendisi ister (kullanıcı kuralı, plan şablonundaki commit adımlarının yerine geçer).
- **Yeni test yazılmaz** (proje kararı); mevcut suite yeşil kalmalı.
- Marka dolguları **birebir** verilen tonlar: `#6BC3A6` = `oklch(0.754 0.096 170)`, `#5FA9C9` = `oklch(0.699 0.088 228)`. Koyulaştırılmış dolgu yok; koyu adımlar yalnızca `*-deep` yazı/ikon utility'lerinde.
- `src/app/shared/ui/**` (spartan helm dosyaları) **dokunulmaz**.
- `--background`, `--card`, `--muted`, `--border`, `--destructive` nötr kalır — değiştirilmez.
- Doğrulama komutları: `npx ng build --configuration local` ve `npm test -- --watch=false`.

---

### Task 1: `src/tailwind.css` — token değerleri

**Files:**
- Modify: `src/tailwind.css:8-73` (`:root` ve `:root.dark` blokları) + dosya sonuna `@theme inline` bloğu

**Interfaces:**
- Produces: Tailwind utility'leri `bg-primary`, `text-primary-foreground`, `bg-secondary`, `text-secondary-foreground` (hlm preset üzerinden, zaten vardı — değerleri değişiyor) ve **yeni** `text-primary-deep`, `text-secondary-deep` (Task 2 bunları kullanacak).

- [ ] **Step 1: `:root` bloğundaki token'ları güncelle**

`src/tailwind.css` içinde `:root` bloğunda (8–42. satırlar) aşağıdaki değişiklikleri yap. Dokunulmayan satırlar (`--background`, `--card`, `--popover`, `--muted`, `--destructive`, `--border`, `--input`, `--sidebar`, `--sidebar-foreground`, `--sidebar-border`, `--font-sans`, `--radius`) aynen kalır.

Eski:

```css
  --primary: oklch(0.205 0 0);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0 0);
  --secondary-foreground: oklch(0.205 0 0);
```

Yeni (üstüne kısa gerekçe yorumu ile):

```css
  /* Marka: pastel dolgu + koyu yazı. Pasteller beyaz yazıyı taşımıyor
     (yeşil 2.1:1) — foreground bilinçli koyu, beyaz değil. */
  --primary: oklch(0.754 0.096 170); /* #6BC3A6 */
  --primary-foreground: oklch(0.22 0.05 170);
  --secondary: oklch(0.699 0.088 228); /* #5FA9C9 */
  --secondary-foreground: oklch(0.21 0.05 228);
```

Eski:

```css
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
```

Yeni:

```css
  --accent: oklch(0.965 0.025 170);
  --accent-foreground: oklch(0.25 0.06 170);
```

Eski:

```css
  --ring: oklch(0.708 0 0);
```

Yeni (pastel ring beyaz zeminde 2.1:1'de kalırdı; 3:1 üstü koyultulmuş ton):

```css
  --ring: oklch(0.65 0.1 170);
```

Eski:

```css
  --sidebar-primary: oklch(0.205 0 0);
  --sidebar-primary-foreground: oklch(0.985 0 0);
  --sidebar-accent: oklch(0.97 0 0);
  --sidebar-accent-foreground: oklch(0.205 0 0);
```

Yeni:

```css
  --sidebar-primary: oklch(0.754 0.096 170);
  --sidebar-primary-foreground: oklch(0.22 0.05 170);
  --sidebar-accent: oklch(0.965 0.025 170);
  --sidebar-accent-foreground: oklch(0.25 0.06 170);
```

Eski:

```css
  --sidebar-ring: oklch(0.708 0 0);
```

Yeni:

```css
  --sidebar-ring: oklch(0.65 0.1 170);
```

Son olarak `:root` bloğunun sonuna (sidebar token'larından sonra, kapanış `}` öncesine) deep adımları ekle:

```css
  /* Zemin üstü yazı/ikon için koyu marka adımları (beyazda 4.5:1 üstü).
     Dolgu her zaman pastel; yazı bunları kullanır. */
  --primary-deep: oklch(0.55 0.09 170);
  --secondary-deep: oklch(0.53 0.09 228);
```

- [ ] **Step 2: `:root.dark` bloğunu kaldır**

Dark tema kullanılmayacak (ürün kararı, uygulama sırasında netleşti). Spartan
iskeletinden gelen `:root.dark { ... }` bloğunu **komple sil** — hiçbir kod
`.dark` sınıfını toggle etmiyor (`rg "'dark'" src/app` boş). Yerine kararı
kayıtlayan yorum bırak:

```css
/* Dark tema kullanılmıyor (ürün kararı) — eski :root.dark iskeleti bilinçli
   kaldırıldı. Gerekirse spartan'ın shadcn şablonundan yeniden türetilir. */
```

- [ ] **Step 3: `@theme inline` bloğunu ekle**

Kaldırılan bloğun yerine (yukarıdaki yorumun altına), `@layer base` bloğundan **önce** ekle (hlm preset'in kendi eşlemeleriyle aynı kalıp — bkz. `node_modules/@spartan-ng/brain/hlm-tailwind-preset.css:82`):

```css
/* text-primary-deep / text-secondary-deep utility'lerini üretir. */
@theme inline {
  --color-primary-deep: var(--primary-deep);
  --color-secondary-deep: var(--secondary-deep);
}
```

- [ ] **Step 4: Build ile doğrula**

Run: `npx ng build --configuration local`
Expected: hatasız tamamlanır. (Bu aşamada görsel fark: tüm primary butonlar yeşil, secondary'ler mavi.)

---

### Task 2: Ad-hoc renklerin token'lara migrasyonu

**Files:**
- Modify: `src/app/layouts/market-layout/market-layout.html:62`
- Modify: `src/app/shared/progress-bar/progress-bar.html:7-10`
- Modify: `src/app/features/market/boat-search/boat-card.html:26`
- Modify: `src/app/layouts/dashboard-shell/dashboard-shell.html:110`

**Interfaces:**
- Consumes: Task 1'in ürettiği `text-primary-deep`, `bg-secondary`, `text-secondary-foreground` utility'leri.

- [ ] **Step 1: Market alt nav aktif sekmesi**

`market-layout.html:62` — pastel primary yazı rengi olarak beyaz zeminde okunmaz (2.1:1); deep adım kullanılır.

Eski:

```html
        routerLinkActive="text-sky-600"
```

Yeni:

```html
        routerLinkActive="text-primary-deep"
```

- [ ] **Step 2: Progress bar**

`progress-bar.html` — renk marka mavisine bağlanır, yorumdaki eskimiş "sky-600 / temanın primary'si koyu" gerekçesi güncellenir.

Eski:

```html
    <!-- w-1/3 şerit -100% → 300% arası kayar: şerit sağ kenardan çıktığı anda
         döngü başa sarar, boş kare kalmaz. Renk bilinçli sky-600 — temanın
         primary'si koyu, bar markanın mavisiyle akıyor (market rozetiyle aynı). -->
    <div class="indicator h-full w-1/3 rounded-full bg-sky-600"></div>
```

Yeni:

```html
    <!-- w-1/3 şerit -100% → 300% arası kayar: şerit sağ kenardan çıktığı anda
         döngü başa sarar, boş kare kalmaz. Renk bilinçli secondary — bar
         markanın mavisiyle akıyor (market rozetiyle aynı). -->
    <div class="indicator h-full w-1/3 rounded-full bg-secondary"></div>
```

- [ ] **Step 3: "Anında Rezerve" rozeti**

`boat-card.html:26` — dolgu marka mavisi, yazı kontrast kuralı gereği koyu (`text-white` pastel üstünde 2.6:1'de kalırdı).

Eski:

```html
    <span class="rounded-full bg-sky-600 px-3 py-1.5 text-xs text-white shadow-sm shadow-slate-500">
```

Yeni:

```html
    <span
      class="rounded-full bg-secondary px-3 py-1.5 text-xs text-secondary-foreground shadow-sm shadow-slate-500"
    >
```

- [ ] **Step 4: Dashboard alt sekme çubuğu aktif durumu**

`dashboard-shell.html:110` — `text-primary` pastel olunca yazı/ikon rengi olarak okunmaz kalacaktı; deep adıma geçer.

Eski:

```html
          class="flex h-16 flex-1 flex-col items-center justify-center gap-1 px-1 text-muted-foreground aria-[current=page]:text-primary"
```

Yeni:

```html
          class="flex h-16 flex-1 flex-col items-center justify-center gap-1 px-1 text-muted-foreground aria-[current=page]:text-primary-deep"
```

- [ ] **Step 5: `sky-600` kalmadığını doğrula**

Run: `rg "sky-600" src/`
Expected: eşleşme yok.

- [ ] **Step 6: Build + test**

Run: `npx ng build --configuration local`
Expected: hatasız.

Run: `npm test -- --watch=false`
Expected: mevcut suite yeşil (sınıf değişimleri `data-*` seçicili testlere dokunmuyor; başarısızlık varsa değişiklikten bağımsız mı diye `git stash` ile karşılaştır).

- [ ] **Step 7: Elle görsel tur**

`npm start` ile:

1. Market anasayfa + tekne listesi: ana butonlar yeşil dolgu + koyu yazı; "Anında Rezerve" rozeti mavi dolgu + koyu lacivert yazı; mobil genişlikte alt nav aktif sekmesi koyu yeşil.
2. Sayfa geçişinde üstteki progress bar marka mavisi.
3. Partner paneli (`/partner`): sidebar aktif öğe ve hover'lar yeşil tonlar; mobilde alt sekme çubuğu aktif öğesi koyu yeşil; bir input'a odaklanınca focus halkası yeşil.

Kusur görürsen düzelt, commit **atma** — diff kullanıcıya kalır.
