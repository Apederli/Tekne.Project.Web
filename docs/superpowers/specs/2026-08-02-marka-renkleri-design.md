# Marka renkleri: yeşil + mavi tema

**Tarih:** 2026-08-02

## Amaç

Tema bugüne kadar spartan'ın nötr grisiyle geldi; marka renkleri belirlendi:

- **#6BC3A6** (pastel deniz yeşili) → **primary**: CTA'lar, ana butonlar, aktif durumlar
- **#5FA9C9** (pastel deniz mavisi) → **secondary**: ikincil butonlar, rozetler, yükleme çubuğu

Renkler **birebir verilen tonlarda** kullanılır. İkisi de açık pastel olduğu
için üzerlerine beyaz yazı kontrast testinden geçmiyor (yeşil 2.1:1, mavi
2.6:1); karar: **dolgular pastel + koyu yazı** (kontrast 7:1 üstü). Kurumsal
"koyu dolgu + beyaz yazı" bilinçli reddedildi — aydınlık, yumuşak marka havası.

Değişiklik token seviyesinde: `src/tailwind.css` içindeki spartan semantik
token'ları markaya bağlanır; `hlmBtn`, badge, sidebar, calendar vb. her şey
otomatik renklenir. Bileşen restyle'ı yok.

**Dark tema kullanılmayacak** (ürün kararı, uygulama sırasında netleşti):
spartan iskeletinden gelen ve hiçbir yerden toggle edilmeyen `:root.dark`
bloğu ölü kod olarak kaldırılır.

## Kapsam dışı

- `src/app/shared/ui/**` spartan helm dosyaları. `hlm-button`'ın `link`
  varyantı `text-primary` kullanıyor ama uygulamada hiç kullanılmıyor;
  `hlm-field-description`'daki hover linki minör. Kullanılmaya başlanırsa
  `text-primary-deep`'e çekmek o günün işi — şimdilik upstream'e sadık.
- `slate-*` nötrlerinin token'lara devşirilmesi (layout'larda `text-slate-500`
  vb. yaşıyor; ayrı bir temizlik işi).
- Dark tema tasarımı — kullanılmayacak; `:root.dark` bloğu siliniyor, yerine
  yeni bir şey konmuyor.
- Test yazımı (proje kararı).

## Tasarım

### 1. Semantik token'lar — light (`:root`)

| Token | Değer | Not |
|---|---|---|
| `--primary` | `oklch(0.754 0.096 170)` | = #6BC3A6, birebir |
| `--primary-foreground` | `oklch(0.22 0.05 170)` | koyu deniz yeşili-siyah, pastel üstünde ~8:1 |
| `--secondary` | `oklch(0.699 0.088 228)` | = #5FA9C9, birebir |
| `--secondary-foreground` | `oklch(0.21 0.05 228)` | koyu lacivert, ~7:1 |
| `--accent` | `oklch(0.965 0.025 170)` | menü/dropdown hover'ı: fısıltı yeşil tint |
| `--accent-foreground` | `oklch(0.25 0.06 170)` | |
| `--ring` | `oklch(0.65 0.1 170)` | focus halkası; beyaz zemine 3:1 üstü (pastel 2.1 ile kalamazdı) |
| `--sidebar-primary` | `= --primary` | |
| `--sidebar-primary-foreground` | `= --primary-foreground` | |
| `--sidebar-accent` | `= --accent` | |
| `--sidebar-accent-foreground` | `= --accent-foreground` | |
| `--sidebar-ring` | `= --ring` | |

`--background`, `--card`, `--muted`, `--border`, `--destructive` **nötr
kalır** — zemin temiz, renkler vurguda.

### 2. Dark blok kaldırma

`:root.dark` bloğu (spartan iskeletinden gelen nötr gri dark tema) komple
silinir; hiçbir kod `.dark` sınıfını toggle etmiyordu. Yerine, kararı
kayıtlayan kısa bir yorum bırakılır.

### 3. Metin olarak marka rengi: `*-deep` utility'leri

Pastel, beyaz zeminde **yazı/ikon rengi olarak okunmuyor** (2.1:1). Dolgusuz
marka vurguları için iki türetilmiş adım tanımlanır — hlm preset'in kalıbıyla
`@theme inline` üzerinden:

```css
:root {
  --primary-deep: oklch(0.55 0.09 170);   /* beyazda 4.8:1 — küçük yazı geçer */
  --secondary-deep: oklch(0.53 0.09 228); /* 5.3:1 */
}
@theme inline {
  --color-primary-deep: var(--primary-deep);
  --color-secondary-deep: var(--secondary-deep);
}
```

Üretilen utility'ler: `text-primary-deep`, `text-secondary-deep` (ve diğer
renk utility'leri). Kural: **dolgu her zaman gerçek pastel; zemin üstü
yazı/ikon her zaman deep.**

### 4. Migrasyonlar (ad-hoc `sky-600` + etkilenen aktif durum)

| Dosya | Eski | Yeni |
|---|---|---|
| `layouts/market-layout/market-layout.html:62` | `routerLinkActive="text-sky-600"` | `routerLinkActive="text-primary-deep"` — aktif sekme markanın yeşili |
| `shared/progress-bar/progress-bar.html:10` | `bg-sky-600` | `bg-secondary` — marka mavisiyle akar; yorumdaki "sky-600" gerekçesi güncellenir |
| `features/market/boat-search/boat-card.html:26` | `bg-sky-600 … text-white` | `bg-amber-400 text-amber-950` — fırsat rozeti bilinçli tema dışı turuncu (uygulama sırasında gelen karar; önce `bg-secondary` yapılmış, kullanıcı turuncu istedi) |
| `layouts/dashboard-shell/dashboard-shell.html:110` | `aria-[current=page]:text-primary` | `aria-[current=page]:text-primary-deep` — pastel primary yazı rengi olarak okunmazdı |
| `features/provider/boats/photo-uploader/photo-uploader.html` | iki overlay düğme `variant="secondary"` (tema sonrası maviye döndü) | düğmeler `bg-white hover:bg-slate-100`'e sabitlendi; sil ikonu `text-destructive`, tutamaç `text-foreground` (uygulama sırasında gelen karar) |

### Dosya etkisi

| Dosya | Değişiklik |
|---|---|
| `src/tailwind.css` | token değerleri (light + dark) + `--*-deep` + `@theme inline` |
| `market-layout.html` | 1 sınıf |
| `progress-bar.html` | 1 sınıf + yorum |
| `boat-card.html` | 2 sınıf |
| `dashboard-shell.html` | 1 sınıf |

## Doğrulama

- `npx ng build --configuration local` temiz.
- `npm test -- --watch=false` → mevcut suite yeşil kalır (sınıf değişimleri
  `data-*` seçicili testlere dokunmuyor).
- Elle: market anasayfa + tekne listesi (buton/rozet/alt nav), partner paneli
  (sidebar aktif öğe, alt sekme çubuğu, focus halkası), progress bar.

## Uygulama notu

**Commit atılmaz** — değişiklikler working tree'de bırakılır, kullanıcı
diff'i görüp onay verdikten sonra commit edilir.
