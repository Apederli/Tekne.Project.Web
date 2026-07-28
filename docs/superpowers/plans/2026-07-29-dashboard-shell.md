# DashboardShell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Provider (partner) paneli için Spartan UI tabanlı, yeniden kullanılabilir bir layout shell'i (sidebar + topbar + kullanıcı menüsü + çıkış) inşa etmek ve provider-layout'u ona bağlamak.

**Architecture:** `src/app/layouts/dashboard-shell/` altında input'larla (`title`, `navItems`, `loginPath`) parametrelenen tek bir `DashboardShell` bileşeni. Routed içerik `<ng-content />` ile projekte edilir; `<router-outlet />` layout bileşenlerinde kalır. Bu işte yalnızca `provider-layout` shell'e bağlanır — admin-layout kapsam dışı.

**Tech Stack:** Angular 22 (signals, `input()`, `inject()`, `@if`/`@for`), Spartan UI (`@ui/button`, `@ui/popover`), Tailwind v4 tema token'ları, Vitest (jsdom).

**Spec:** `docs/superpowers/specs/2026-07-29-dashboard-shell-design.md`

## Global Constraints

- `standalone: true` ve `changeDetection: OnPush` YAZILMAZ — v22 varsayılanı.
- Erişim belirteci yok: `private`/`protected`/`public`/`readonly` kullanılmaz; `router = inject(Router)` düz yazılır.
- `input()` fonksiyonu kullanılır, `@Input()` dekoratörü değil.
- Kontrol akışı `@if`/`@for`; `*ngIf`/`*ngFor` yok.
- Renkler Spartan tema token'ları (`bg-background`, `border-border`, `text-muted-foreground`, `bg-accent`…) — `slate-*` kullanılmaz.
- UI metinleri Türkçe.
- Interface'ler bileşen dosyasının içinde tanımlanmaz. `NavItem` saf UI tipi olduğu için `core/models/` yerine (orası Swagger kaynaklı API modellerine ayrılmıştır) shell'in yanındaki `nav-item.ts` dosyasında yaşar.
- Testler Vitest ile koşar: `npx ng test --include src/app/layouts/dashboard-shell` (dosya yoluna göre daraltır). Karma/Jasmine değil; ama `describe`/`it`/`expect`/`vi` global olarak açık, import edilmez.
- Commit mesajları İngilizce, sonunda `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>` satırı bulunur.

### Spartan popover kullanım kalıbı (bu repoda doğrulandı)

`src/app/shared/ui/date-picker/src/lib/hlm-date-picker.ts:47-64` içindeki gerçek kullanım:

```html
<hlm-popover align="end" sideOffset="8">
  <button hlmPopoverTrigger hlmBtn variant="ghost">Tetikleyici</button>
  <hlm-popover-content *hlmPopoverPortal>İçerik</hlm-popover-content>
</hlm-popover>
```

`HlmPopoverImports` dizisi `@ui/popover`'dan gelir ve gereken tüm direktifleri içerir. Trigger butonu `data-slot="popover-trigger"` attribute'u alır (testte seçici olarak kullanılabilir). Popover içeriği CDK overlay ile body'ye portallanır — testte içerik `document.body` üzerinden aranır, `fixture.nativeElement` üzerinden değil.

---

### Task 1: NavItem tipi ve DashboardShell iskeleti (sidebar + içerik projeksiyonu)

**Files:**
- Create: `src/app/layouts/dashboard-shell/nav-item.ts`
- Create: `src/app/layouts/dashboard-shell/dashboard-shell.ts`
- Create: `src/app/layouts/dashboard-shell/dashboard-shell.html`
- Test: `src/app/layouts/dashboard-shell/dashboard-shell.spec.ts`

**Interfaces:**
- Consumes: `AuthStore` (`src/app/core/auth/auth-store.ts` — `user` readonly signal), `HlmButton` (`@ui/button`).
- Produces: `NavItem { path: string; label: string; exact: boolean }` ve `DashboardShell` bileşeni — input'lar: `title: string`, `navItems: NavItem[]`, `loginPath: string`. Task 2 aynı bileşene kullanıcı menüsünü ekler; Task 3 `provider-layout`'tan `<app-dashboard-shell [title]="..." [navItems]="..." [loginPath]="...">` olarak kullanır.

- [ ] **Step 1: Failing testi yaz**

`src/app/layouts/dashboard-shell/dashboard-shell.spec.ts`:

```ts
import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { UserService } from '@services/user.service';
import { DashboardShell } from './dashboard-shell';
import { NavItem } from './nav-item';

@Component({
  imports: [DashboardShell],
  template: `
    <app-dashboard-shell title="Test Panel" [navItems]="navItems" loginPath="/partner/login">
      <p data-testid="projected">İçerik</p>
    </app-dashboard-shell>
  `,
})
class Host {
  navItems: NavItem[] = [
    { path: '/partner', label: 'Genel Bakış', exact: true },
    { path: '/partner/teknelerim', label: 'Teknelerim', exact: false },
  ];
}

describe('DashboardShell', () => {
  let userService: { logout: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    userService = { logout: vi.fn(() => of(true)) };

    await TestBed.configureTestingModule({
      imports: [Host],
      providers: [provideRouter([]), { provide: UserService, useValue: userService }],
    }).compileComponents();
  });

  it('başlığı ve nav linklerini render eder', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('aside')?.textContent).toContain('Test Panel');

    const links = Array.from(el.querySelectorAll<HTMLAnchorElement>('nav a'));
    expect(links.map((a) => a.textContent?.trim())).toEqual(['Genel Bakış', 'Teknelerim']);
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['/partner', '/partner/teknelerim']);
  });

  it('içeriği projekte eder', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;

    expect(el.querySelector('main [data-testid="projected"]')?.textContent).toBe('İçerik');
  });
});
```

- [ ] **Step 2: Testin FAIL ettiğini doğrula**

Çalıştır: `npx ng test --include src/app/layouts/dashboard-shell --watch=false`
Beklenen: FAIL — `./dashboard-shell` modülü bulunamadı (henüz yok).

- [ ] **Step 3: Minimal implementasyonu yaz**

`src/app/layouts/dashboard-shell/nav-item.ts`:

```ts
/** Panel shell'lerinin (provider, ileride admin) sidebar linki. */
export interface NavItem {
  path: string;
  label: string;
  exact: boolean;
}
```

`src/app/layouts/dashboard-shell/dashboard-shell.ts`:

```ts
import { Component, inject, input } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { HlmButton } from '@ui/button';
import { UserService } from '@services/user.service';
import { AuthStore } from '../../core/auth/auth-store';
import { NavItem } from './nav-item';

/**
 * Panel alanlarının (provider, ileride admin) ortak iskeleti:
 * sidebar + topbar. Routed içerik ng-content ile projekte edilir,
 * router-outlet kullanan layout'ta kalır.
 */
@Component({
  selector: 'app-dashboard-shell',
  imports: [RouterLink, RouterLinkActive, HlmButton],
  templateUrl: './dashboard-shell.html',
})
export class DashboardShell {
  title = input.required<string>();
  navItems = input.required<NavItem[]>();
  /** Çıkış sonrası yönlendirilecek adres (ör. `/partner/login`). */
  loginPath = input.required<string>();

  authStore = inject(AuthStore);
  userService = inject(UserService);
  router = inject(Router);
}
```

`src/app/layouts/dashboard-shell/dashboard-shell.html`:

```html
<div class="flex min-h-screen bg-background text-foreground">
  <aside class="w-60 shrink-0 border-r border-border bg-muted/40">
    <div class="px-5 py-5 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
      {{ title() }}
    </div>
    <nav class="flex flex-col gap-1 px-3">
      @for (item of navItems(); track item.path) {
        <a
          hlmBtn
          variant="ghost"
          class="justify-start text-muted-foreground"
          [routerLink]="item.path"
          routerLinkActive="bg-accent text-accent-foreground"
          [routerLinkActiveOptions]="{ exact: item.exact }"
          >{{ item.label }}</a
        >
      }
    </nav>
  </aside>

  <div class="flex min-w-0 flex-1 flex-col">
    <header class="flex h-14 items-center justify-end border-b border-border px-6"></header>

    <main class="flex-1 p-8">
      <ng-content />
    </main>
  </div>
</div>
```

Not: `authStore`, `userService`, `router` bu task'ta henüz kullanılmıyor; Task 2'nin kullanıcı menüsü için duruyorlar. `header` şimdilik boş — Task 2 dolduracak.

- [ ] **Step 4: Testin PASS ettiğini doğrula**

Çalıştır: `npx ng test --include src/app/layouts/dashboard-shell --watch=false`
Beklenen: 2 test PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/layouts/dashboard-shell/
git commit -m "Add DashboardShell skeleton with sidebar and content projection

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: Kullanıcı menüsü ve çıkış akışı

**Files:**
- Modify: `src/app/layouts/dashboard-shell/dashboard-shell.ts`
- Modify: `src/app/layouts/dashboard-shell/dashboard-shell.html`
- Test: `src/app/layouts/dashboard-shell/dashboard-shell.spec.ts`

**Interfaces:**
- Consumes: `AuthStore.user()` (`UserOutputModel | null` — `name`, `surname`, `email` alanları), `AuthStore.setUser(null)`, `UserService.logout(): Observable<boolean>`, `HlmPopoverImports` (`@ui/popover`), `Router.navigateByUrl`.
- Produces: `DashboardShell.displayName: Signal<string>` ve `DashboardShell.signOut(): void` — Task 3'ün ek bir şey bilmesi gerekmez, shell'in public API'si değişmez.

- [ ] **Step 1: Failing testleri yaz**

`dashboard-shell.spec.ts` dosyasına ekle — import satırlarına şunlar katılır:

```ts
import { By } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';
import { UserType } from '@enums/user-type';
import { AuthStore } from '../../core/auth/auth-store';
```

`describe('DashboardShell', ...)` bloğunun içine yeni testler:

```ts
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
```

- [ ] **Step 2: Testlerin FAIL ettiğini doğrula**

Çalıştır: `npx ng test --include src/app/layouts/dashboard-shell --watch=false`
Beklenen: İlk iki test (Task 1) PASS; yeni 4 test FAIL — `[data-slot="popover-trigger"]` bulunamaz (null), `shell.signOut` fonksiyon değil.

- [ ] **Step 3: Implementasyonu yaz**

`dashboard-shell.ts` — `computed`'ı import et, `HlmPopoverImports`'u ekle, sınıfa `displayName` ve `signOut` kat:

```ts
import { Component, computed, inject, input } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { HlmButton } from '@ui/button';
import { HlmPopoverImports } from '@ui/popover';
import { UserService } from '@services/user.service';
import { AuthStore } from '../../core/auth/auth-store';
import { NavItem } from './nav-item';

/**
 * Panel alanlarının (provider, ileride admin) ortak iskeleti:
 * sidebar + topbar + kullanıcı menüsü. Routed içerik ng-content ile
 * projekte edilir, router-outlet kullanan layout'ta kalır.
 */
@Component({
  selector: 'app-dashboard-shell',
  imports: [RouterLink, RouterLinkActive, HlmButton, HlmPopoverImports],
  templateUrl: './dashboard-shell.html',
})
export class DashboardShell {
  title = input.required<string>();
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
    this.router.navigateByUrl(this.loginPath());
  }
}
```

`dashboard-shell.html` — boş `header`'ı kullanıcı menüsüyle doldur:

```html
    <header class="flex h-14 items-center justify-end border-b border-border px-6">
      <hlm-popover align="end" sideOffset="8">
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
```

- [ ] **Step 4: Testlerin PASS ettiğini doğrula**

Çalıştır: `npx ng test --include src/app/layouts/dashboard-shell --watch=false`
Beklenen: 6 test PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/layouts/dashboard-shell/
git commit -m "Add user menu with sign-out to DashboardShell

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: provider-layout'u shell'e bağla

**Files:**
- Modify: `src/app/layouts/provider-layout/provider-layout.ts`
- Modify: `src/app/layouts/provider-layout/provider-layout.html`

**Interfaces:**
- Consumes: `DashboardShell` (`title`, `navItems`, `loginPath` input'ları, ng-content projeksiyonu), `NavItem`, `ROUTE_PARTNER` (`src/app/core/routes.const.ts` — `main: 'partner'`, `login: 'login'`, `boats: 'teknelerim'`, `availability: 'musaitlik'`, `reservations: 'rezervasyonlar'`).
- Produces: Görsel değişiklik dışında dış dünyaya yeni bir API üretmez; route yapısı ve URL'ler aynı kalır.

- [ ] **Step 1: provider-layout.ts'i güncelle**

Dosyanın tamamı şu hâle gelir:

```ts
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ROUTE_PARTNER } from '../../core/routes.const';
import { DashboardShell } from '../dashboard-shell/dashboard-shell';
import { NavItem } from '../dashboard-shell/nav-item';

const ROOT = `/${ROUTE_PARTNER.main}`;

@Component({
  selector: 'app-provider-layout',
  imports: [RouterOutlet, DashboardShell],
  templateUrl: './provider-layout.html',
})
export class ProviderLayout {
  loginPath = `${ROOT}/${ROUTE_PARTNER.login}`;
  navItems: NavItem[] = [
    { path: ROOT, label: 'Genel Bakış', exact: true },
    { path: `${ROOT}/${ROUTE_PARTNER.boats}`, label: 'Teknelerim', exact: false },
    { path: `${ROOT}/${ROUTE_PARTNER.availability}`, label: 'Müsaitlik & Fiyat', exact: false },
    { path: `${ROOT}/${ROUTE_PARTNER.reservations}`, label: 'Rezervasyonlar', exact: false },
  ];
}
```

- [ ] **Step 2: provider-layout.html'i güncelle**

Dosyanın tamamı şu hâle gelir:

```html
<app-dashboard-shell title="Tekne Sahibi" [navItems]="navItems" [loginPath]="loginPath">
  <router-outlet />
</app-dashboard-shell>
```

- [ ] **Step 3: Tüm test paketini koş**

Çalıştır: `npm test -- --watch=false`
Beklenen: Tümü PASS (App testleri + 6 DashboardShell testi).

- [ ] **Step 4: Build'in kırılmadığını doğrula**

Çalıştır: `npm run build`
Beklenen: `dist/tekne-web` üretilir, hata yok. (SSR uyarısı: shell yalnızca CSR route'larında kullanılıyor; popover/`document` erişimi CDK üzerinden ve render'da tetiklenmiyor, prerender sırasında sorun beklenmez.)

- [ ] **Step 5: Commit**

```bash
git add src/app/layouts/provider-layout/
git commit -m "Wire provider layout to DashboardShell

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```
