# spartan sidebar geçişi — uygulama planı

> **Ajan işçiler için:** GEREKLİ ALT BECERİ: bu planı görev görev uygulamak
> için `superpowers:subagent-driven-development` (önerilen) ya da
> `superpowers:executing-plans` kullan. Adımlar `- [ ]` kutucuklarıyla
> izlenir.

**Hedef:** Panel sidebar'ı masaüstünde daraltılabilir olsun (ikon modu,
Ctrl/Cmd+B, tercihin cookie'de hatırlanması) ve admin paneli de aynı
iskeleti kullansın.

**Yaklaşım:** `DashboardShell`'in elde yazılmış `aside` + `hlm-sheet` drawer
markup'ı spartan/ui'ın `hlm-sidebar` bileşen setiyle değiştirilir. Bileşenin
dış API'si (`panelTitle`, `navItems`, `loginPath`, `ng-content`) aynen
korunur; `NavItem`'a zorunlu `icon` alanı eklenir. `admin-layout` kendi
markup'ını bırakıp shell'i sarar.

**Teknoloji:** Angular 22 (signals, `input()`), spartan/ui Helm sidebar
(`@ui/sidebar`), ng-icons lucide, Tailwind v4.

**Tasarım belgesi:** [2026-08-02-spartan-sidebar-design.md](../specs/2026-08-02-spartan-sidebar-design.md)

## Global kısıtlar

Her görevin gereksinimleri bunları da içerir:

- **Yeni test yazılmaz.** Proje kararı. Bu plan TDD döngüsü içermiyor; her
  görevin doğrulaması derleme + mevcut testlerin durumu + tarayıcıda elle
  kontrol.
- **Test baseline'ı (2026-08-02, bu iş başlamadan önce):**
  `Test Files 1 failed | 10 passed (11)` / `Tests 1 failed | 90 passed (91)`.
  Kırık olan tek test `dashboard-shell.spec.ts > başlığı ve nav linklerini
  render eder` (`expected 'Genel BakışTeknelerim' to contain 'Test Panel'`).
  **Task 2 bu testi düzeltir**; Task 2 sonrası hedef `Tests 90 passed (90)` —
  toplam 91'den 90'a düşer çünkü drawer'a özel iki test tek bir sidebar
  testine iner.
- **Angular 22 konvansiyonları:** `standalone`/`OnPush` yazma, erişim
  belirteci (`private`/`protected`/`readonly`) yazma, `inject()` kullan,
  `@if`/`@for` kullan.
- **Mobile-first:** taban sınıflar mobil düzeni tarif eder, `sm:`/`lg:`
  yalnızca büyütme yönünde.
- **Beklenen HTTP hataları için try/catch yazma** — mesajı
  `errorInterceptor` gösterir.
- **Interface/model tanımı bileşen dosyasında olmaz.** `NavItem` bu kuralın
  mevcut istisnası değil — kendi dosyasında (`layouts/dashboard-shell/nav-item.ts`)
  yaşıyor, orada kalır.
- Türkçe kullanıcı metni, Türkçe kod yorumu (mevcut dosyalarla tutarlı).

---

### Task 1: `sidebar` bileşenini kur

Yaprak değişiklik: yalnızca `@ui/sidebar` kullanılabilir hâle gelir, hiçbir
mevcut dosya davranış değiştirmez.

**Dosyalar:**
- Oluştur: `src/app/shared/ui/sidebar/**` (generator üretir)
- Oluştur: `src/app/shared/ui/tooltip/**`, `src/app/shared/ui/skeleton/**`
  (sidebar'ın bağımlılıkları; generator üretir)
- Değiştir: `tsconfig.json` (generator `paths` girdilerini ekler)

**Arayüzler:**
- Üretir: `@ui/sidebar` yolundan `HlmSidebarImports`, `HlmSidebarService`,
  `provideHlmSidebarConfig`, `HlmSidebarConfig`

- [ ] **Adım 1: Generator'ı çalıştır**

```bash
npx ng g @spartan-ng/cli:ui sidebar
```

Bağımlılık soruları çıkarsa **evet** de: `tooltip` ve `skeleton` sidebar
kaynağı tarafından import ediliyor (`BrnTooltip`, `HlmSkeletonImports`),
ikisi de projede kurulu değil. `button`, `input`, `separator`, `sheet` zaten
kurulu — tekrar üretilmelerine izin verme.

- [ ] **Adım 2: `tsconfig.json` yollarını doğrula**

`compilerOptions.paths` içinde bu üç satırın olduğunu doğrula (generator
eklemiş olmalı; eksikse elle ekle, mevcut girdilerin biçimine uyarak):

```json
      "@ui/sidebar": ["./src/app/shared/ui/sidebar/src/index.ts"],
      "@ui/tooltip": ["./src/app/shared/ui/tooltip/src/index.ts"],
      "@ui/skeleton": ["./src/app/shared/ui/skeleton/src/index.ts"]
```

Dosyadaki son girdinin sonuna virgül eklemeyi unutma — `paths` bloğunun son
satırında virgül olmamalı.

- [ ] **Adım 3: Export'ları doğrula**

`src/app/shared/ui/sidebar/src/index.ts` dosyasını oku. Şu üç ismin export
edildiğini doğrula:

- `HlmSidebarImports` (dizi barrel'ı)
- `HlmSidebarService` (`open`, `openMobile`, `isMobile`, `state`,
  `toggleSidebar()` üyeleri olan root servis)
- `provideHlmSidebarConfig`

Üçü de mevcut olmalı. Eksik varsa `src/app/shared/ui/sidebar/src/lib/`
altında hangi dosyada tanımlandığını bul ve `index.ts`'e o dosyanın
`export * from './lib/<dosya-adı>';` satırını ekle — kardeş barrel'ların
(`@ui/sheet`) biçimiyle aynı. Sonraki görevler bu üç ismi `@ui/sidebar`'dan
import ediyor, eksikse Task 2 derlenmez.

- [ ] **Adım 4: Derlemeyi doğrula**

Çalıştır: `npx ng build --configuration local`
Beklenen: hatasız tamamlanır. (Yeni bileşenler henüz hiçbir yerden import
edilmiyor — bu normal.)

- [ ] **Adım 5: Mevcut testleri doğrula**

Çalıştır: `npm test -- --watch=false`
Beklenen: baseline değişmedi — `Tests 1 failed | 90 passed (91)`, kırık olan
yalnızca bilinen `dashboard-shell.spec.ts` testi.

- [ ] **Adım 6: Commit**

```bash
git add src/app/shared/ui tsconfig.json
git commit -m "Install the spartan sidebar component"
```

---

### Task 2: `DashboardShell`'i sidebar'a çevir

Bu görevin parçaları ayrılamaz: `NavItem.icon` zorunlu olduğu an
`provider-layout` derlenmez, shell yeniden yazıldığı an `dashboard-shell.spec.ts`
eski DOM'u arar. Üçü birlikte gider.

**Dosyalar:**
- Değiştir: `src/app/layouts/dashboard-shell/nav-item.ts`
- Değiştir: `src/app/layouts/dashboard-shell/dashboard-shell.ts`
- Değiştir: `src/app/layouts/dashboard-shell/dashboard-shell.html`
- Değiştir: `src/app/layouts/dashboard-shell/dashboard-shell.spec.ts`
- Değiştir: `src/app/layouts/provider-layout/provider-layout.ts:17-22`

**Arayüzler:**
- Kullanır: `HlmSidebarImports`, `HlmSidebarService` (Task 1)
- Üretir: `NavItem` artık `icon: string` alanı taşır (zorunlu)
- Korur: `DashboardShell`'in `panelTitle` / `navItems` / `loginPath`
  girdileri, `displayName()`, `signOut()`, `completeSignOut()` — imzaları
  değişmez, `provider-layout.html` ve Task 3'teki `admin-layout.html`
  bunlara dayanıyor

- [ ] **Adım 1: `nav-item.ts` — `icon` alanını ekle**

Dosyanın tamamını şununla değiştir:

```ts
/** Panel shell'lerinin (provider, admin) sidebar linki. */
export interface NavItem {
  path: string;
  label: string;
  exact: boolean;
  /**
   * ng-icon adı — ikonlar `DashboardShell`'in `provideIcons` bloğunda
   * kayıtlı. Zorunlu: sidebar daraltıldığında (`collapsible="icon"`)
   * görünen tek şey ikondur.
   */
  icon: string;
}
```

- [ ] **Adım 2: `dashboard-shell.ts` — yeniden yaz**

Dosyanın tamamını şununla değiştir:

```ts
import { Component, computed, inject, input } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideCalendarDays,
  lucideClipboardList,
  lucideLayoutDashboard,
  lucideShip,
  lucideUserCog,
  lucideUsers,
} from '@ng-icons/lucide';
import { HlmButton } from '@ui/button';
import { HlmPopoverImports } from '@ui/popover';
import { HlmSidebarImports } from '@ui/sidebar';
import { UserService } from '@services';
import { AuthStore } from '../../core/auth/auth-store';
import { NavItem } from './nav-item';

/**
 * Panel alanlarının (provider, admin) ortak iskeleti: spartan sidebar +
 * topbar + kullanıcı menüsü. Routed içerik ng-content ile projekte edilir,
 * router-outlet kullanan layout'ta kalır.
 *
 * Mobil drawer, daraltma ve tercihin cookie'de saklanması `hlm-sidebar`'ın
 * kendi işi — bu bileşende responsive dallanma yok.
 *
 * İkonlar burada kayıtlı, `NavItem` yalnızca adı taşıyor: iki alanın da
 * ikon kümesi küçük ve bu bileşen zaten ikisinin ortak iskeleti.
 */
@Component({
  selector: 'app-dashboard-shell',
  imports: [
    RouterLink,
    RouterLinkActive,
    NgIcon,
    HlmButton,
    HlmPopoverImports,
    HlmSidebarImports,
  ],
  providers: [
    provideIcons({
      lucideCalendarDays,
      lucideClipboardList,
      lucideLayoutDashboard,
      lucideShip,
      lucideUserCog,
      lucideUsers,
    }),
  ],
  templateUrl: './dashboard-shell.html',
})
export class DashboardShell {
  panelTitle = input.required<string>();
  navItems = input.required<NavItem[]>();
  /** Çıkış sonrası yönlendirilecek adres (ör. `/partner/login`). */
  loginPath = input.required<string>();

  authStore = inject(AuthStore);
  userService = inject(UserService);
  router = inject(Router);

  /** Sayfa yenilenince store boşalır; o durumda nötr "Hesap" gösterilir. */
  displayName = computed(() => {
    const user = this.authStore.user();
    return user ? `${user.name} ${user.surname}` : 'Hesap';
  });

  /**
   * Çıkış: istek başarısız olsa bile lokal oturum düşürülür — cookie
   * silinememiş olabilir ama istemci tarafında oturum bitmiştir.
   */
  signOut(): void {
    this.userService.logout().subscribe({
      next: () => this.completeSignOut(),
      error: () => this.completeSignOut(),
    });
  }

  completeSignOut(): void {
    this.authStore.setUser(null);
    void this.router.navigateByUrl(this.loginPath());
  }
}
```

- [ ] **Adım 3: `dashboard-shell.html` — yeniden yaz**

Dosyanın tamamını şununla değiştir:

```html
<div hlmSidebarWrapper class="text-foreground">
  <hlm-sidebar collapsible="icon">
    <!--
      Daraltılmış modda header'da hiçbir şey kalmaz: logo da başlık da
      group-data ile gizlenir. `group` sınıfı hlm-sidebar host'unda,
      data-collapsible da orada — mobil (sheet) dalında host sınıfsız
      olduğu için bu seçiciler eşleşmez ve ikisi de görünür kalır.
    -->
    <div hlmSidebarHeader>
      <img
        src="/img/logo.png"
        alt="Logo"
        class="h-10 w-auto group-data-[collapsible=icon]:hidden"
        width="200"
        height="40"
      />
      <p
        class="text-xs font-semibold tracking-wide text-sidebar-foreground/70 uppercase group-data-[collapsible=icon]:hidden"
      >
        {{ panelTitle() }}
      </p>
    </div>

    <div hlmSidebarContent>
      <div hlmSidebarGroup>
        <ul hlmSidebarMenu>
          @for (item of navItems(); track item.path) {
            <li hlmSidebarMenuItem>
              <!--
                closeMobileSidebarOnClick bilinçli: girdinin varsayılanı
                false, bugünkü davranışta drawer linke basınca kapanıyordu.
                tooltip yalnızca daraltılmış masaüstü modunda görünür,
                bileşen kendi içinde kapatıyor.
              -->
              <a
                hlmSidebarMenuButton
                closeMobileSidebarOnClick
                [tooltip]="item.label"
                [routerLink]="item.path"
                routerLinkActive
                #rla="routerLinkActive"
                [routerLinkActiveOptions]="{ exact: item.exact }"
                [isActive]="rla.isActive"
                ariaCurrentWhenActive="page"
              >
                <ng-icon [name]="item.icon" />
                <span>{{ item.label }}</span>
              </a>
            </li>
          }
        </ul>
      </div>
    </div>

    <button hlmSidebarRail aria-label="Kenar çubuğunu aç/kapat"></button>
  </hlm-sidebar>

  <!-- hlmSidebarInset seçicisi main[...] — başka etikete takılamaz. -->
  <main hlmSidebarInset>
    <header class="flex h-14 items-center gap-2 border-b border-border px-4 lg:px-6">
      <button hlmSidebarTrigger srOnlyText="Menüyü aç/kapat"></button>

      <hlm-popover class="ml-auto" align="end" sideOffset="8">
        <button hlmPopoverTrigger hlmBtn variant="ghost">{{ displayName() }}</button>
        <hlm-popover-content *hlmPopoverPortal class="w-64">
          <div class="px-1.5 py-1">
            <p class="text-sm font-medium">{{ displayName() }}</p>
            @if (authStore.user(); as user) {
              <p class="text-sm text-muted-foreground">{{ user.email }}</p>
            }
          </div>
          <div class="border-t border-border"></div>
          <button hlmBtn variant="ghost" class="justify-start" (click)="signOut()">
            Çıkış yap
          </button>
        </hlm-popover-content>
      </hlm-popover>
    </header>

    <div class="flex-1 p-4 sm:p-6 lg:p-8">
      <ng-content />
    </div>
  </main>
</div>
```

- [ ] **Adım 4: `provider-layout.ts` — nav öğelerine ikon ekle**

`navItems` dizisini şununla değiştir (diğer satırlar aynı kalır):

```ts
  navItems: NavItem[] = [
    { path: ROOT, label: 'Genel Bakış', exact: true, icon: 'lucideLayoutDashboard' },
    {
      path: `${ROOT}/${ROUTE_PARTNER.boats}`,
      label: 'Teknelerim',
      exact: false,
      icon: 'lucideShip',
    },
    {
      path: `${ROOT}/${ROUTE_PARTNER.availability}`,
      label: 'Müsaitlik & Fiyat',
      exact: false,
      icon: 'lucideCalendarDays',
    },
    {
      path: `${ROOT}/${ROUTE_PARTNER.reservations}`,
      label: 'Rezervasyonlar',
      exact: false,
      icon: 'lucideClipboardList',
    },
  ];
```

- [ ] **Adım 5: `dashboard-shell.spec.ts` — yeni DOM'a taşı**

Dosyanın tamamını şununla değiştir. Değişenler: Host'un `navItems`'ına
`icon` eklendi; `aside` yerine `[data-sidebar="header"]` sorgulanıyor (bu
baseline'daki kırık testi düzeltir); `nav a` yerine
`[data-sidebar="menu"] a`; sheet tetikleyicisine dayanan iki test tek bir
sidebar tetikleyici testine indi. **Yeni davranış testi eklenmiyor.**

```ts
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { UserType } from '@enums';
import { UserService } from '@services';
import { HlmSidebarService } from '@ui/sidebar';
import { AuthStore } from '../../core/auth/auth-store';
import { DashboardShell } from './dashboard-shell';
import { NavItem } from './nav-item';

@Component({ template: '' })
class Blank {}

@Component({
  imports: [DashboardShell],
  template: `
    <app-dashboard-shell panelTitle="Test Panel" [navItems]="navItems" loginPath="/partner/login">
      <p data-testid="projected">İçerik</p>
    </app-dashboard-shell>
  `,
})
class Host {
  navItems: NavItem[] = [
    { path: '/partner', label: 'Genel Bakış', exact: true, icon: 'lucideLayoutDashboard' },
    { path: '/partner/teknelerim', label: 'Teknelerim', exact: false, icon: 'lucideShip' },
  ];
}

describe('DashboardShell', () => {
  let userService: { logout: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    // Sidebar açık/kapalı tercihi cookie'de tutuluyor ve jsdom cookie'si
    // testler arasında yaşıyor; her testin aynı durumdan başlaması için silinir.
    document.cookie = 'sidebar_state=; path=/; max-age=0';

    userService = { logout: vi.fn(() => of(true)) };

    await TestBed.configureTestingModule({
      imports: [Host],
      providers: [
        provideRouter([{ path: '**', component: Blank }]),
        { provide: UserService, useValue: userService },
      ],
    }).compileComponents();
  });

  it('başlığı ve nav linklerini render eder', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('[data-sidebar="header"]')?.textContent).toContain('Test Panel');

    const links = Array.from(
      el.querySelectorAll<HTMLAnchorElement>('[data-sidebar="menu"] a'),
    );
    expect(links.map((a) => a.textContent?.trim())).toEqual(['Genel Bakış', 'Teknelerim']);
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['/partner', '/partner/teknelerim']);
  });

  it('içeriği projekte eder', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('main [data-testid="projected"]')?.textContent).toBe('İçerik');
  });

  it('oturum yokken kullanıcı menüsü tetikleyicisi "Hesap" yazar', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const trigger = fixture.nativeElement.querySelector('[data-slot="popover-trigger"]');

    expect(trigger?.textContent?.trim()).toBe('Hesap');
  });

  it('oturum varken tetikleyici ad soyadı gösterir', async () => {
    TestBed.inject(AuthStore).setUser({
      id: 1,
      email: 'kaptan@tekne.dev',
      name: 'Deniz',
      surname: 'Kaptan',
      userType: UserType.Partner,
      isValid: true,
    });
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const trigger = fixture.nativeElement.querySelector('[data-slot="popover-trigger"]');

    expect(trigger?.textContent?.trim()).toBe('Deniz Kaptan');
  });

  it('çıkış: logout çağrılır, store temizlenir, loginPath\'e gidilir', async () => {
    const authStore = TestBed.inject(AuthStore);
    authStore.setUser({
      id: 1,
      email: 'kaptan@tekne.dev',
      name: 'Deniz',
      surname: 'Kaptan',
      userType: UserType.Partner,
      isValid: true,
    });
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigateByUrl');

    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const shell = fixture.debugElement.query(By.directive(DashboardShell)).componentInstance;

    shell.signOut();
    await fixture.whenStable();

    expect(userService.logout).toHaveBeenCalledOnce();
    expect(authStore.user()).toBeNull();
    expect(navigateSpy).toHaveBeenCalledWith('/partner/login');
  });

  it('çıkış isteği hata verse de store temizlenir ve yönlendirilir', async () => {
    userService.logout.mockReturnValue(throwError(() => new Error('ağ hatası')));
    const authStore = TestBed.inject(AuthStore);
    authStore.setUser({
      id: 1,
      email: 'kaptan@tekne.dev',
      name: 'Deniz',
      surname: 'Kaptan',
      userType: UserType.Partner,
      isValid: true,
    });
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigateByUrl');

    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const shell = fixture.debugElement.query(By.directive(DashboardShell)).componentInstance;

    shell.signOut();
    await fixture.whenStable();

    expect(authStore.user()).toBeNull();
    expect(navigateSpy).toHaveBeenCalledWith('/partner/login');
  });

  it('sidebar tetikleyicisi render edilir', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const trigger = fixture.nativeElement.querySelector('[data-slot="sidebar-trigger"]');

    // toContain: tetikleyicinin şablonu ng-icon + sr-only span, ikonun
    // metin katkısı boş olsa da eşitlik yerine içerme sınanıyor.
    expect(trigger).toBeTruthy();
    expect(trigger?.textContent).toContain('Menüyü aç/kapat');
  });

  it('tetikleyiciye tıklanınca sidebar daralır', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const sidebarService = TestBed.inject(HlmSidebarService);

    expect(sidebarService.state()).toBe('expanded');

    (
      fixture.nativeElement.querySelector('[data-slot="sidebar-trigger"]') as HTMLButtonElement
    ).click();
    await fixture.whenStable();

    expect(sidebarService.state()).toBe('collapsed');
  });
});
```

- [ ] **Adım 6: Derlemeyi doğrula**

Çalıştır: `npx ng build --configuration local`
Beklenen: hatasız. `NavItem.icon` zorunlu olduğu için `admin-layout.ts`
derlemeyi kırmaz — o dosya `NavItem` tipini kullanmıyor, kendi inline
dizisini tutuyor (Task 3'te değişecek).

- [ ] **Adım 7: Testleri doğrula**

Çalıştır: `npm test -- --watch=false`
Beklenen: `Test Files 11 passed (11)` / `Tests 90 passed (90)`. Baseline'daki
tek kırık test düzeldi, drawer'a özel iki test tek teste indiği için toplam
91'den 90'a düştü. Herhangi bir **failed** varsa devam etme.

- [ ] **Adım 8: Tarayıcıda kontrol**

Çalıştır: `npm start`, `http://localhost:4200/partner/dashboard`

1. Sidebar solda, logonun altında "TEKNE SAHİBİ" etiketi, dört nav öğesi
   ikonlarıyla görünüyor.
2. Topbar'daki panel ikonuna bas → sidebar 3rem'lik ikon şeridine daralıyor,
   logo ve başlık kayboluyor, etiketler gidiyor.
3. Daraltılmışken bir ikonun üzerine gel → sağında etiket balonu çıkıyor.
4. Ctrl+B (macOS'ta Cmd+B) → aynı daralma/genişleme.
5. Sayfayı yenile → sidebar bıraktığın durumda açılıyor (cookie).
6. Sidebar'ın sağ kenarına (rail) tıkla → aç/kapa çalışıyor.
7. Aktif nav öğesi vurgulu; başka sayfaya geçince vurgu taşınıyor.
8. Tarayıcıyı 768px altına daralt → sidebar kayboluyor, tetikleyici drawer
   açıyor; drawer'da bir linke bas → drawer kapanıyor ve gezinme oluyor.
9. Sağ üstteki kullanıcı menüsü ve "Çıkış yap" bugünkü gibi çalışıyor.

- [ ] **Adım 9: Commit**

```bash
git add src/app/layouts/dashboard-shell src/app/layouts/provider-layout
git commit -m "Rebuild the dashboard shell on the spartan sidebar"
```

---

### Task 3: `admin-layout`'u shell'e taşı

**Dosyalar:**
- Değiştir: `src/app/layouts/admin-layout/admin-layout.ts`
- Değiştir: `src/app/layouts/admin-layout/admin-layout.html`

**Arayüzler:**
- Kullanır: `DashboardShell`'in `panelTitle` / `navItems` / `loginPath`
  girdileri ve `NavItem.icon` alanı (Task 2)

- [ ] **Adım 1: `admin-layout.ts` — shell'i kullan**

Dosyanın tamamını şununla değiştir:

```ts
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ROUTE_ADMIN } from '../../core/routes.const';
import { DashboardShell } from '../dashboard-shell/dashboard-shell';
import { NavItem } from '../dashboard-shell/nav-item';

const ROOT = `/${ROUTE_ADMIN.main}`;

@Component({
  selector: 'app-admin-layout',
  imports: [RouterOutlet, DashboardShell],
  templateUrl: './admin-layout.html',
})
export class AdminLayout {
  /**
   * Admin'in ayrı login sayfası yok — `roleGuard('admin')` da başarısızlıkta
   * varsayılan `['/']`'e düşürüyor; çıkış aynı yere gitsin.
   */
  loginPath = '/';
  navItems: NavItem[] = [
    { path: ROOT, label: 'Genel Bakış', exact: true, icon: 'lucideLayoutDashboard' },
    {
      path: `${ROOT}/${ROUTE_ADMIN.customers}`,
      label: 'Müşteriler',
      exact: false,
      icon: 'lucideUsers',
    },
    {
      path: `${ROOT}/${ROUTE_ADMIN.partners}`,
      label: 'Tekne Sahipleri',
      exact: false,
      icon: 'lucideUserCog',
    },
    {
      path: `${ROOT}/${ROUTE_ADMIN.boats}`,
      label: 'Tekneler',
      exact: false,
      icon: 'lucideShip',
    },
    {
      path: `${ROOT}/${ROUTE_ADMIN.reservations}`,
      label: 'Rezervasyonlar',
      exact: false,
      icon: 'lucideClipboardList',
    },
  ];
}
```

- [ ] **Adım 2: `admin-layout.html` — shell'e sar**

Dosyanın tamamını şununla değiştir. Sabit `slate-*` renkleri gidiyor;
tema değişkenleri shell'den geliyor, admin de dark mode ve mobil drawer
kazanıyor:

```html
<app-dashboard-shell panelTitle="Yönetim" [navItems]="navItems" [loginPath]="loginPath">
  <router-outlet />
</app-dashboard-shell>
```

- [ ] **Adım 3: Derlemeyi doğrula**

Çalıştır: `npx ng build --configuration local`
Beklenen: hatasız. `RouterLink` / `RouterLinkActive` import'ları
`admin-layout.ts`'ten düştü; şablonda da kullanılmıyorlar, kalan referans
varsa derleme hata verir.

- [ ] **Adım 4: Testleri doğrula**

Çalıştır: `npm test -- --watch=false`
Beklenen: `Test Files 11 passed (11)` / `Tests 90 passed (90)` — Task 2 ile
aynı. `admin-layout` için test yok, sayı değişmemeli.

- [ ] **Adım 5: Tarayıcıda kontrol**

Çalıştır: `npm start`, `http://localhost:4200/admin`

Not: `/admin` `roleGuard('admin')` arkasında. Oturum yoksa `/`'e düşersin —
kontrol için admin rolüyle giriş yapmış olman gerekir.

1. Sidebar'da "YÖNETİM" etiketi ve beş nav öğesi ikonlarıyla görünüyor.
2. Daraltma, Ctrl/Cmd+B ve cookie hatırlaması provider panelindeki gibi
   çalışıyor.
3. 768px altına daralt → drawer açılıyor (bu davranış admin'de daha önce
   hiç yoktu).
4. Sağ üstte kullanıcı menüsü var; "Çıkış yap" `/`'e götürüyor.
5. Renkler tema değişkenlerinden geliyor — sayfa artık provider paneliyle
   aynı görünüyor, sabit gri tonlar kalmadı.

- [ ] **Adım 6: Commit**

```bash
git add src/app/layouts/admin-layout
git commit -m "Move the admin layout onto the dashboard shell"
```
