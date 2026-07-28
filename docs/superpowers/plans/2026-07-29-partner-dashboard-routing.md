# Partner Dashboard Routing + Noindex Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Partner panelini `/partner/dashboard` tabanına taşımak ve partner + admin alanlarını `X-Robots-Tag: noindex, nofollow` başlığıyla arama motorlarına kapatmak.

**Architecture:** `ROUTE_PARTNER.dashboard` sabiti `''` → `'dashboard'` olur; `ProviderLayout` + `roleGuard` bu route'a taşınır, panel sayfaları children olur, çıplak `/partner` redirect eder. Login sonrası yönlendirme ve nav linkleri sabitlerden türediği için tek kaynaktan güncellenir. `src/server.ts`'e path-prefix'li tek bir Express middleware'i noindex başlığını ekler.

**Tech Stack:** Angular 22 Router (`canMatch` + redirect), `RouterTestingHarness`, Express (SSR server), Vitest.

**Spec:** `docs/superpowers/specs/2026-07-29-partner-dashboard-routing-design.md`

## Global Constraints

- URL segmentleri `src/app/core/routes.const.ts` sabitlerinden gelir — route tanımlarında ve linklerde string literal YAZILMAZ.
- Erişim belirteci yok, `inject()`, `@if`/`@for` — proje Angular 22 konvansiyonları geçerli.
- `roleGuard` `canMatch` ile kullanılır, `canActivate` değil.
- `app.routes.server.ts`'e dokunulmaz: mevcut `partner` + `partner/**` → `RenderMode.Client` girdileri yeni yapıyı kapsıyor.
- Testler Vitest: `describe`/`it`/`expect`/`vi` global, import edilmez.
- Commit mesajları İngilizce, sonunda `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>` satırı.

### Doğrulanmış olgular

- `API_BASE_URL` token'ı root factory'li (`src/app/core/api/api.config.ts:13-16`) — testte provider gerekmez; `provideHttpClient()` yeterli.
- `roleGuard(role, redirectTo)` rol tutmayınca `router.createUrlTree([...redirectTo])` döner (`src/app/core/auth/role.guard.ts:14-21`) — login'e yönlendirme testte `Router.url` üzerinden gözlemlenebilir.
- `AuthStore` `@Service()` (root) — testte `TestBed.inject(AuthStore).setUser(...)` yeterli.
- Express 5 `app.use([path1, path2], handler)` path-prefix dizisini destekler.

---

### Task 1: Route yapısını /partner/dashboard tabanına taşı

**Files:**
- Modify: `src/app/core/routes.const.ts` (yalnız `ROUTE_PARTNER.dashboard` değeri)
- Modify: `src/app/features/provider/provider.routes.ts`
- Modify: `src/app/features/provider/login/partner-login.ts` (yalnız navigate satırı)
- Modify: `src/app/layouts/provider-layout/provider-layout.ts`
- Test (Create): `src/app/features/provider/provider.routes.spec.ts`

**Interfaces:**
- Consumes: `ROUTE_PARTNER` sabitleri, `roleGuard('provider', LOGIN_URL)`, `AuthStore.setUser`, `UserType.Partner` (`@enums/user-type`).
- Produces: Yeni URL sözleşmesi — `/partner/dashboard` (+ children `teknelerim`, `musaitlik`, `rezervasyonlar`), `/partner` → `/partner/dashboard` redirect. Task 2 bu sözleşmeye bağımlı değildir (yalnız `/partner` prefix'ini kullanır).

- [ ] **Step 1: Failing testi yaz**

`src/app/features/provider/provider.routes.spec.ts` (yeni dosya):

```ts
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { UserType } from '@enums/user-type';
import { AuthStore } from '../../core/auth/auth-store';
import { ROUTE_PARTNER } from '../../core/routes.const';
import { providerRoutes } from './provider.routes';

describe('providerRoutes', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideRouter([{ path: ROUTE_PARTNER.main, children: providerRoutes }]),
      ],
    });
  });

  it('provider rolündeki kullanıcıyı /partner → /partner/dashboard yönlendirir', async () => {
    TestBed.inject(AuthStore).setUser({
      id: 1,
      email: 'kaptan@tekne.dev',
      name: 'Deniz',
      surname: 'Kaptan',
      userType: UserType.Partner,
      isValid: true,
    });

    await RouterTestingHarness.create();
    await TestBed.inject(Router).navigateByUrl('/partner');

    expect(TestBed.inject(Router).url).toBe('/partner/dashboard');
  });

  it('oturumsuz kullanıcıyı /partner/dashboard → /partner/login yönlendirir', async () => {
    await RouterTestingHarness.create();
    await TestBed.inject(Router).navigateByUrl('/partner/dashboard');

    expect(TestBed.inject(Router).url).toBe('/partner/login');
  });
});
```

- [ ] **Step 2: Testin FAIL ettiğini doğrula**

Çalıştır: `npx ng test --include src/app/features/provider --watch=false`
Beklenen: İlk test FAIL — `/partner` navigasyonu bugünkü yapıda `/partner`'da kalır (dashboard `path: ''`), redirect yok; beklenen `/partner/dashboard` gelmez. İkinci test de FAIL — `/partner/dashboard` bugün eşleşmeyen URL'dir.

- [ ] **Step 3: Implementasyonu yaz**

`src/app/core/routes.const.ts` — `ROUTE_PARTNER` bloğu şu hâle gelir (diğer bloklara dokunma):

```ts
/**
 * Tekne sahibi paneli. URL'de `partner` görünür (backend terminolojisi),
 * kod tarafında alan hâlâ `provider` olarak adlandırılmış durumda.
 *
 * `dashboard` panelin taban segmentidir: tüm panel sayfaları
 * `/partner/dashboard` altında yaşar, `login` guard dışında kalır.
 */
export const ROUTE_PARTNER = {
  main: 'partner',
  login: 'login',
  dashboard: 'dashboard',
  boats: 'teknelerim',
  availability: 'musaitlik',
  reservations: 'rezervasyonlar',
} as const;
```

`src/app/features/provider/provider.routes.ts` dosyasının tamamı:

```ts
import { Routes } from '@angular/router';
import { ProviderLayout } from '../../layouts/provider-layout/provider-layout';
import { roleGuard } from '../../core/auth/role.guard';
import { ROUTE_PARTNER } from '../../core/routes.const';

const LOGIN_URL = ['/', ROUTE_PARTNER.main, ROUTE_PARTNER.login];

export const providerRoutes: Routes = [
  /** Giriş sayfası guard'ın DIŞINDA — aksi hâlde giriş yapmamış kullanıcı buraya ulaşamaz. */
  {
    path: ROUTE_PARTNER.login,
    loadComponent: () => import('./login/partner-login').then((m) => m.PartnerLogin),
  },
  {
    path: ROUTE_PARTNER.dashboard,
    component: ProviderLayout,
    canMatch: [roleGuard('provider', LOGIN_URL)],
    children: [
      {
        path: '',
        loadComponent: () => import('./dashboard/dashboard').then((m) => m.ProviderDashboard),
      },
      {
        path: ROUTE_PARTNER.boats,
        loadComponent: () => import('./boats/my-boats').then((m) => m.MyBoats),
      },
      {
        path: ROUTE_PARTNER.availability,
        loadComponent: () => import('./availability/availability').then((m) => m.Availability),
      },
      {
        path: ROUTE_PARTNER.reservations,
        loadComponent: () =>
          import('./reservations/provider-reservations').then((m) => m.ProviderReservations),
      },
    ],
  },
  /** Çıplak /partner → panel tabanı. Oturum yoksa dashboard guard'ı login'e atar. */
  { path: '', pathMatch: 'full', redirectTo: ROUTE_PARTNER.dashboard },
];
```

`src/app/features/provider/login/partner-login.ts` — yalnız navigate satırı değişir:

```ts
        await this.router.navigate(['/', ROUTE_PARTNER.main, ROUTE_PARTNER.dashboard]);
```

`src/app/layouts/provider-layout/provider-layout.ts` dosyasının tamamı:

```ts
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ROUTE_PARTNER } from '../../core/routes.const';
import { DashboardShell } from '../dashboard-shell/dashboard-shell';
import { NavItem } from '../dashboard-shell/nav-item';

const ROOT = `/${ROUTE_PARTNER.main}/${ROUTE_PARTNER.dashboard}`;

@Component({
  selector: 'app-provider-layout',
  imports: [RouterOutlet, DashboardShell],
  templateUrl: './provider-layout.html',
})
export class ProviderLayout {
  /** Login, dashboard tabanının DIŞINDA — ROOT'tan değil, alan kökünden kurulur. */
  loginPath = `/${ROUTE_PARTNER.main}/${ROUTE_PARTNER.login}`;
  navItems: NavItem[] = [
    { path: ROOT, label: 'Genel Bakış', exact: true },
    { path: `${ROOT}/${ROUTE_PARTNER.boats}`, label: 'Teknelerim', exact: false },
    { path: `${ROOT}/${ROUTE_PARTNER.availability}`, label: 'Müsaitlik & Fiyat', exact: false },
    { path: `${ROOT}/${ROUTE_PARTNER.reservations}`, label: 'Rezervasyonlar', exact: false },
  ];
}
```

- [ ] **Step 4: Testlerin PASS ettiğini doğrula**

Çalıştır: `npx ng test --include src/app/features/provider --watch=false`
Beklenen: 2 test PASS.

- [ ] **Step 5: Tam suite**

Çalıştır: `npm test -- --watch=false`
Beklenen: 13 test PASS (11 mevcut + 2 yeni). Shell testleri kendi fixture path'lerini kullandığı için etkilenmez.

- [ ] **Step 6: Commit**

```bash
git add src/app/core/routes.const.ts src/app/features/provider/ src/app/layouts/provider-layout/
git commit -m "Move partner panel routes under /partner/dashboard

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: Panel alanlarına noindex başlığı

**Files:**
- Modify: `src/server.ts`

**Interfaces:**
- Consumes: `ROUTE_ADMIN`, `ROUTE_PARTNER` (`src/app/core/routes.const.ts`), Express `app.use`.
- Produces: `/partner*` ve `/admin*` yanıtlarında `X-Robots-Tag: noindex, nofollow` başlığı. Başka hiçbir davranış değişmez.

- [ ] **Step 1: Middleware'i ekle**

`src/server.ts` — import bloğuna ekle:

```ts
import { ROUTE_ADMIN, ROUTE_PARTNER } from './app/core/routes.const';
```

`const angularApp = new AngularNodeAppEngine();` satırından sonra, `express.static` middleware'inden ÖNCE ekle:

```ts
/**
 * Panel alanları (partner + admin) arama motorlarına kapalı — login dahil.
 *
 * robots.txt'te Disallow bilinçli olarak yok: crawler sayfayı çekebilmeli ki
 * bu noindex sinyalini görebilsin; robots.txt engeli dış link alan URL'in
 * "içeriği bilinmeyen sayfa" olarak indekslenmesini önlemez.
 */
app.use([`/${ROUTE_PARTNER.main}`, `/${ROUTE_ADMIN.main}`], (req, res, next) => {
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  next();
});
```

- [ ] **Step 2: Build**

Çalıştır: `npm run build`
Beklenen: hatasız tamamlanır (server bundle `routes.const` import'unu sorunsuz alır).

- [ ] **Step 3: Başlığı gerçek sunucuda doğrula**

Build sonrası SSR sunucusunu arka planda başlat, başlıkları kontrol et, sunucuyu kapat:

```bash
node dist/tekne-web/server/server.mjs &
SERVER_PID=$!
sleep 3
curl -sI http://localhost:4000/partner/login | grep -i x-robots-tag
curl -sI http://localhost:4000/admin | grep -i x-robots-tag
curl -sI http://localhost:4000/ | grep -i x-robots-tag || echo "OK: kökte başlık yok"
kill $SERVER_PID
```

Beklenen: ilk iki komut `X-Robots-Tag: noindex, nofollow` basar; üçüncüsü `OK: kökte başlık yok` basar.

- [ ] **Step 4: Commit**

```bash
git add src/server.ts
git commit -m "Send noindex header for partner and admin areas

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```
