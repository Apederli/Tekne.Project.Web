# Mobilde alt sekme çubuğu (bottom tab bar)

**Tarih:** 2026-08-02

## Amaç

Panel alanlarında mobil navigasyon drawer'dan alt sekme çubuğuna geçsin.
Drawer "web küçültmesi" kalıbı: iki dokunuş, sol üst köşeye uzanma, nav
gizli. Ürün Capacitor'la paketlenecek ve partner panelinin 4 hedefi var —
native uygulamaların standart kalıbı olan alt sekme çubuğu için ideal durum.

Bar `DashboardShell`'e girer; **iki panel de** (partner + admin) otomatik
kazanır. Masaüstü davranışı değişmez: sidebar, daraltma, Ctrl/Cmd+B aynen
kalır.

## Kapsam dışı

- spartan sidebar'ın kendisine dokunmak (mobil sheet kodu içinde kalır,
  sadece erişilmez olur).
- Nav öğelerini değiştirmek, yeni hedef eklemek.
- Market layout'u.
- Yeni test (proje kararı).

## Tasarım

### Görünürlük kuralı

| Genişlik | Navigasyon |
|---|---|
| `< md` (768px) | Alt sekme çubuğu; sidebar trigger'ı **gizli**, drawer erişilmez |
| `≥ md` | Bugünkü sidebar (daraltılabilir); sekme çubuğu gizli (`md:hidden`) |

Trigger'a `class="hidden md:inline-flex"` verilir (taban sınıf mobil durumu
tarif eder — mobile-first). `hlmSidebarTrigger`'ın host sınıfları `classes()`
ile birleştiği için host'taki `hidden` kazanır.

Drawer mobilde erişilmez kalınca daha önce park edilen "640–767px bandında
rail drawer'ın içinde tıklama yutuyor" bulgusu da pratikte ortadan kalkar.

### Markup — `dashboard-shell.html`

Bar, `main[hlmSidebarInset]`'in **son çocuğu** olarak eklenir, `fixed` değil
`sticky` konumlanır — akış içinde yer kapladığı için içeriğin altına binme /
`padding-bottom` telafisi sorunu doğmaz:

```html
<nav
  class="sticky bottom-0 z-10 flex border-t border-border bg-background
         pb-[env(safe-area-inset-bottom)] md:hidden"
  aria-label="Alt menü"
>
  @for (item of navItems(); track item.path) {
    <a
      class="flex h-16 flex-1 flex-col items-center justify-center gap-1 px-1
             text-muted-foreground aria-[current=page]:text-primary"
      [routerLink]="item.path"
      routerLinkActive=""
      ariaCurrentWhenActive="page"
      [routerLinkActiveOptions]="{ exact: item.exact }"
    >
      <ng-icon [name]="item.icon" size="22" />
      <span class="w-full truncate text-center text-[11px] leading-none">
        {{ item.shortLabel ?? item.label }}
      </span>
    </a>
  }
</nav>
```

- `h-16` (64px) dokunma hedefi; `flex-1` ile eşit bölüşüm.
- `pb-[env(safe-area-inset-bottom)]`: iOS çentik/home-bar güvenli alanı —
  Capacitor paketlendiğinde devreye girer, tarayıcıda 0'dır.
- `truncate` emniyet kemeri: etiket sığmazsa üç nokta, taşma yok.
- Aktif durum `aria-[current=page]:text-primary` ile: `routerLinkActive`'in
  sınıf eklemesi yerine `ariaCurrentWhenActive`'in bastığı attribute'a
  bağlanıyor. Sebep: `text-primary` ve taban `text-muted-foreground` aynı
  özgüllükte, hangisi kazanır stylesheet sırasına kalırdı; `aria-[...]`
  varyantı bileşik seçici üretir (sınıf + attribute) ve deterministik kazanır.
  `routerLinkActive=""` yine gerekli — `ariaCurrentWhenActive` o direktifin
  input'u.

### Topbar'da panel başlığı (mobil)

Drawer gidince `panelTitle` mobilde hiçbir yerde görünmüyordu. Topbar'a,
trigger'ın yerine mobilde başlık gelir:

```html
<p class="text-sm font-semibold md:hidden">{{ panelTitle() }}</p>
```

(`md+`'da trigger görünür, başlık gizli — ikisi aynı sol slotu paylaşır.)

### `NavItem.shortLabel`

```ts
export interface NavItem {
  path: string;
  label: string;
  exact: boolean;
  icon: NavIcon;
  /** Alt sekme çubuğundaki kısa etiket; yoksa `label` kullanılır. */
  shortLabel?: string;
}
```

Atamalar (yalnızca sığmayanlara):

| Alan | label | shortLabel |
|---|---|---|
| partner | Müsaitlik & Fiyat | Müsaitlik |
| admin | Tekne Sahipleri | Sahipler |

Diğer etiketler (`Genel Bakış`, `Teknelerim`, `Rezervasyonlar`,
`Müşteriler`, `Tekneler`) 11px'te beş sekmeye sığıyor; `truncate` güvence.
"Sahipler" bir metin kararı — beğenilmezse spec review'da değiştirilir.

### Dosya etkisi

| Dosya | Değişiklik |
|---|---|
| `layouts/dashboard-shell/nav-item.ts` | `shortLabel?: string` |
| `layouts/dashboard-shell/dashboard-shell.html` | bar + topbar başlığı + trigger'a `hidden md:inline-flex` |
| `layouts/provider-layout/provider-layout.ts` | Müsaitlik öğesine `shortLabel` |
| `layouts/admin-layout/admin-layout.ts` | Tekne Sahipleri öğesine `shortLabel` |

`dashboard-shell.ts` değişmez (ikonlar zaten kayıtlı, yeni import yok —
`NgIcon` ve router direktifleri zaten imports listesinde).

## SSR / test

- İki panel de `RenderMode.Client`; `sticky` + `env()` saf CSS — SSR riski yok.
- Mevcut testler `data-sidebar` / `data-slot` seçicilerine dayanıyor;
  bar onlara dokunmuyor. Trigger testi varlık kontrolü yapıyor, trigger
  render edilmeye devam ediyor (yalnızca mobilde CSS ile gizli) — geçer.
  Yeni test yazılmaz. Hedef: `90 passed (90)` korunur.

## Doğrulama

- `npx ng build --configuration local` temiz.
- `npm test -- --watch=false` → `90 passed (90)`.
- Elle, telefon genişliğinde: bar altta sabit, 4 sekme (admin'de 5), aktif
  sekme vurgulu, trigger görünmüyor, başlık topbar'da; `md+`'da bar yok,
  sidebar aynen çalışıyor.

## Uygulama notu

**Commit atılmaz** — değişiklikler working tree'de bırakılır, kullanıcı
diff'i görüp onay verdikten sonra commit edilir.
