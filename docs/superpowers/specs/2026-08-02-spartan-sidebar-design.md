# DashboardShell'in spartan sidebar'a geçişi

**Tarih:** 2026-08-02

## Amaç

Panel sidebar'ı masaüstünde daraltılabilir olsun. Bugün `DashboardShell` sabit
240px'lik bir `aside` çiziyor; daraltma yok, klavye kısayolu yok, tercih
hatırlanmıyor. spartan/ui'ın `sidebar` bileşeni bunların üçünü de hazır getiriyor
(`collapsible="icon"`, Ctrl/Cmd+B, `sidebar_state` cookie'si).

Aynı geçişte `admin-layout` da bu shell'in altına alınır — bugün kendi markup'ını
taşıyor, sabit `slate-*` renkleri kullanıyor ve mobil davranışı hiç yok.

## Kapsam dışı

- Yeni nav öğesi, gruplama veya alt menü eklemek.
- Market layout'una dokunmak.
- Kullanıcı menüsünün içeriğini değiştirmek.

## Mevcut durum

| Dosya | Durum |
|---|---|
| `layouts/dashboard-shell/` | Elde yazılmış `aside` (lg altında gizli) + `hlm-sheet` drawer + topbar + kullanıcı popover'ı. Nav markup'ı `#navContent` template'inde, iki yerde `ngTemplateOutlet` ile basılıyor. |
| `layouts/provider-layout/` | Shell'i sarıyor: `panelTitle="Tekne Sahibi"`, 4 nav öğesi, `loginPath=/partner/login`. |
| `layouts/admin-layout/` | Shell'i **kullanmıyor**. Kendi `aside`'ı, sabit slate renkleri, mobil desteği yok. |
| `src/tailwind.css` | `--sidebar-*` tema değişkenleri (satır 34-41, 65-72) zaten mevcut. |
| `shared/ui/` | `sidebar` **kurulu değil**. |

## Tasarım

### Kurulum

```
ng g @spartan-ng/cli:ui sidebar
```

`src/app/shared/ui/sidebar/` oluşur, `tsconfig.json`'ın `paths` bloğuna
`@ui/sidebar` eklenir. `tailwind.css`'e dokunulmaz — değişkenler hazır.

sidebar kaynağı `tooltip` (daraltılmış moddaki etiket balonu) ve `skeleton`
(`hlmSidebarMenuSkeleton`) bileşenlerini import ediyor; ikisi de projede
kurulu değil, generator bağımlılık olarak ekleyecek. `button`, `input`,
`separator`, `sheet` zaten var.

### DashboardShell'in yeni yapısı

Dış API korunur; `provider-layout.html` ve yeni `admin-layout.html` aynı üç
input'u verir.

```
hlmSidebarWrapper
├── hlm-sidebar collapsible="icon"
│   ├── hlm-sidebar-header   → logo + panelTitle (icon modunda gizli)
│   ├── hlm-sidebar-content  → hlmSidebarMenu
│   │                          @for navItems → hlmSidebarMenuItem
│   │                            > a hlmSidebarMenuButton
│   │                              [routerLink] routerLinkActive
│   │                              ng-icon + label
│   └── hlmSidebarRail       → kenardan sürükleyerek aç/kapa
└── hlmSidebarInset
    ├── header → hlmSidebarTrigger (sol) + kullanıcı popover'ı (sağ)
    └── main   → <ng-content />
```

**Korunanlar:** `panelTitle` / `navItems` / `loginPath` input'ları, `displayName()`
computed'ı, `signOut()` + `completeSignOut()` mantığı, kullanıcı popover'ının
topbar'daki yeri ve içeriği.

**Silinenler:** `mobileNavState` signal'i, `closeMobileNav()`, `HlmSheetImports`,
`NgTemplateOutlet`, `lucideMenu` ikonu ve `#navContent` template'i. Mobil drawer'ı
ve nav'ın iki yerde render edilmesini spartan sidebar kendi içinde hallediyor;
hamburger'ın yerini `hlmSidebarTrigger` alıyor.

### NavItem

```ts
export interface NavItem {
  path: string;
  label: string;
  exact: boolean;
  /** ng-icon adı; daraltılmış modda görünen tek şey olduğu için zorunlu. */
  icon: string;
}
```

İkonlar `DashboardShell`'in `providers: [provideIcons({...})]` bloğunda kayıtlı
olur — projedeki diğer tüm bileşenlerle aynı kalıp. Shell iki alanın da ikon
listesini bilir; bu bilinçli, çünkü shell zaten "provider + admin ortak iskeleti"
olarak tanımlı.

| Alan | Öğe | İkon |
|---|---|---|
| provider | Genel Bakış | `lucideLayoutDashboard` |
| provider | Teknelerim | `lucideShip` |
| provider | Müsaitlik & Fiyat | `lucideCalendarDays` |
| provider | Rezervasyonlar | `lucideClipboardList` |
| admin | Genel Bakış | `lucideLayoutDashboard` |
| admin | Müşteriler | `lucideUsers` |
| admin | Tekne Sahipleri | `lucideUserCog` |
| admin | Tekneler | `lucideShip` |
| admin | Rezervasyonlar | `lucideClipboardList` |

### admin-layout geçişi

`admin-layout.html` tamamen `provider-layout.html`'in muadili olur:

```html
<app-dashboard-shell panelTitle="Yönetim" [navItems]="navItems" [loginPath]="loginPath">
  <router-outlet />
</app-dashboard-shell>
```

`admin-layout.ts` içinde `loginPath = '/'`. `ROUTE_ADMIN`'de login segmenti yok ve
`roleGuard('admin')` varsayılan `['/']` redirect'iyle çalışıyor
(`core/auth/role.guard.ts:14`); çıkış da aynı yere gitsin diye `/` seçildi.
`RouterLink` / `RouterLinkActive` import'ları layout'tan düşer, `navItems`
dizisine `icon` alanları eklenir.

## Mobile-first

Geçişin kazancı masaüstü tarafında. Mobilde spartan sidebar zaten kendi
içinde sheet'e düşüyor, yani drawer davranışı korunur. Dokunmatik hedefler
`hlmSidebarMenuButton`'ın varsayılan yüksekliğinden geliyor.

**Kırılma noktası değişiyor:** bugünkü shell sidebar'ı `lg` (1024px) altında
gizliyor, spartan sidebar ise `md` (768px) altında sheet'e düşüyor
(`HlmSidebarConfig.mobileBreakpoint` varsayılanı `'768px'`). Yani 768–1024px
arasında davranış değişir: bugün drawer olan aralık, geçişten sonra sabit
sidebar gösterir — açık başlar, kullanıcı daraltırsa tercih cookie'de kalır.

Bu kabul ediliyor. `provideHlmSidebarConfig({ mobileBreakpoint: '1023.98px' })`
ile bugünkü sınır birebir korunabilirdi, ama `HlmSidebar`'ın masaüstü dalı
CSS'te sabit `md:` sınıfları kullanıyor (`hidden md:block`); JS eşiğini
1024'e çekmek 768–1024 arasında ilk render'da sidebar'ın görünüp
`afterNextRender` sonrası kaybolmasına yol açardı. Varsayılanda JS ve CSS
aynı eşikte olduğu için bu titreme yok.

**Drawer'da link tıklaması:** `HlmSidebarMenuButton`'ın
`closeMobileSidebarOnClick` girdisi varsayılan olarak **kapalı**. Bugünkü
davranış (linke basınca drawer kapanır) korunsun diye her menü butonunda
açık verilir.

## SSR

`sidebar_state` cookie'si tarayıcıda okunuyor. Panel alanlarının ikisi de
`RenderMode.Client` (`app.routes.server.ts:11-12` ve partner karşılığı), o yüzden
hydration uyuşmazlığı riski yok. Market layout'u bu değişikliğin dışında.

## Doğrulama

- `npm run build` temiz geçmeli.
- **Test baseline'ı (2026-08-02):** `Tests 1 failed | 90 passed (91)`. Kırık
  olan `dashboard-shell.spec.ts > başlığı ve nav linklerini render eder`
  (`aside` içinde `panelTitle` aranıyor, orada değil). Bu geçiş o testi de
  düzeltir: `panelTitle` artık sidebar header'ında render edilir.
- `dashboard-shell.spec.ts` yeni yapıya göre güncellenir — sheet ve
  `mobileNavState`'e dayanan üç assertion sidebar karşılıklarıyla değişir.
  **Yeni test yazılmaz**, mevcutlar taşınır.
- Elle: `/partner/dashboard` ve `/admin` — daraltma, Ctrl/Cmd+B, sayfa
  yenilendiğinde tercihin korunması, mobil genişlikte drawer, aktif link durumu,
  çıkış yönlendirmesi (`/partner/login` ve `/`).
