# Responsive DashboardShell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `DashboardShell`'i lg (1024px) altında hamburger + soldan açılan Spartan sheet drawer'ıyla mobil/tablet uyumlu hale getirmek.

**Architecture:** Spartan sheet bileşeni CLI ile `shared/ui/sheet`'e eklenir. Shell template'inde nav markup'ı bir `ng-template`'e alınır ve hem statik sidebar'da (lg+) hem sheet içeriğinde `ngTemplateOutlet` ile basılır. Sheet durumu shell'de bir signal ile kontrol edilir; drawer'daki nav linki tıklanınca signal 'closed' yapılır.

**Tech Stack:** Angular 22 (signals, `@if`/`@for`, `NgTemplateOutlet`), Spartan UI sheet (`@ui/sheet`, BrnDialog tabanlı), `@ng-icons/lucide` (hamburger ikonu), Tailwind v4 responsive utility'leri, Vitest (jsdom).

**Spec:** `docs/superpowers/specs/2026-07-29-responsive-shell-design.md`

## Global Constraints

- `standalone: true` ve `changeDetection: OnPush` YAZILMAZ (v22 varsayılanı) — **istisna:** Spartan CLI'nin ürettiği `shared/ui/sheet` dosyalarına dokunulmaz, üretildiği gibi bırakılır (mevcut `shared/ui/*` bileşenleri de OnPush/erişim belirteci içerir; onlar vendored kod sayılır).
- Kendi yazdığımız kodda erişim belirteci yok (`private`/`readonly` vb. yazılmaz), `input()` fonksiyonu, `@if`/`@for`, `inject()`.
- Renkler Spartan tema token'ları; `slate-*` kullanılmaz. UI metinleri Türkçe.
- Kırılım: **lg (1024px)**. Sidebar `hidden lg:block`; hamburger `lg:hidden`; `main` dolgusu `p-4 sm:p-6 lg:p-8`.
- Nav markup'ı tek yerde yaşar (`ng-template` + `ngTemplateOutlet`) — kopyalanması kabul edilmez.
- Testler Vitest: `npx ng test --include src/app/layouts/dashboard-shell --watch=false`. `describe`/`it`/`expect`/`vi` global, import edilmez.
- Commit mesajları İngilizce, sonunda `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>` satırı.

### Doğrulanmış Spartan sheet olguları (bu repoda kontrol edildi)

- `components.json` mevcut: `{"componentsPath": "src/app/shared/ui", "importAlias": "@ui", "style": "nova"}` — CLI sheet'i doğru yere, `@ui/*` import'larıyla üretir.
- Üreteç komutu: `npx ng g @spartan-ng/cli:ui sheet` (`@spartan-ng/cli` ^1.1.2 devDependency olarak kurulu; `ui` generator'ının şeması `name` argümanını alır).
- Üretilen index `HlmSheetImports` dizisini export eder (HlmSheet, HlmSheetContent, HlmSheetPortal, HlmSheetTrigger, HlmSheetClose, Header/Footer/Title/Description, Overlay).
- Kullanım kalıbı (repodaki popover/dialog kalıbının aynısı):
  ```html
  <hlm-sheet side="left" [state]="..." (stateChanged)="...">
    <button hlmSheetTrigger>...</button>
    <hlm-sheet-content *hlmSheetPortal>...</hlm-sheet-content>
  </hlm-sheet>
  ```
- `HlmSheet` → `BrnSheet` → `BrnDialog`: `state` input'u (`'closed' | 'open' | null`), `stateChanged` output'u (`'closed' | 'open'`), `side` input'u (`'left'` vb.).
- `hlm-sheet-content` host'una `data-slot="sheet-content"`, trigger'a `data-slot="sheet-trigger"` attribute'u gelir (testlerde seçici). İçerik CDK overlay ile `document.body`'ye portallanır — testte body üzerinden aranır.
- `hlm-sheet-content` kendi kapatma butonunu (lucideX ikonlu) içerir; Escape ve backdrop tıklamasıyla kapanma BrnDialog'dan hazır gelir.
- `@ng-icons/core` ve `@ng-icons/lucide` zaten package.json'da kurulu (hamburger için `lucideMenu` kullanılacak).

---

### Task 1: Spartan sheet bileşenini kur

**Files:**
- Create (CLI üretir): `src/app/shared/ui/sheet/src/index.ts` + `src/app/shared/ui/sheet/src/lib/hlm-sheet*.ts` (11 dosya)
- Modify (CLI eklemezse elle): `tsconfig.json` — `paths`'e `"@ui/sheet": ["./src/app/shared/ui/sheet/src/index.ts"]`

**Interfaces:**
- Consumes: `components.json` (CLI konfigürasyonu, repoda mevcut).
- Produces: `@ui/sheet` modülü ve `HlmSheetImports` dizisi — Task 2 bunu `DashboardShell.imports`'a ekler ve `hlm-sheet` / `hlmSheetTrigger` / `*hlmSheetPortal` / `hlm-sheet-content` selector'larını kullanır.

- [ ] **Step 1: Sheet'i üret**

Çalıştır:

```bash
npx ng g @spartan-ng/cli:ui sheet
```

Komut interaktif soru sorarsa (hangi primitive): `sheet` zaten argüman olarak verildi, soru beklenmez. Üretim sonrası kontrol et:

```bash
ls src/app/shared/ui/sheet/src/lib
```

Beklenen: `hlm-sheet.ts`, `hlm-sheet-content.ts`, `hlm-sheet-portal.ts`, `hlm-sheet-trigger.ts`, `hlm-sheet-close.ts`, `hlm-sheet-header.ts`, `hlm-sheet-footer.ts`, `hlm-sheet-title.ts`, `hlm-sheet-description.ts`, `hlm-sheet-overlay.ts` dosyaları.

- [ ] **Step 2: tsconfig alias'ını doğrula**

`tsconfig.json` içindeki `paths`'te `"@ui/sheet"` girdisini ara. CLI eklemediyse elle ekle (diğer `@ui/*` girdileriyle aynı biçimde):

```json
"@ui/sheet": ["./src/app/shared/ui/sheet/src/index.ts"],
```

- [ ] **Step 3: Derlemenin kırılmadığını doğrula**

Çalıştır: `npx ng test --include src/app/layouts/dashboard-shell --watch=false`
Beklenen: mevcut 6 test PASS (sheet henüz kullanılmıyor; bu koşu üretilen dosyaların derlemeyi bozmadığını gösterir).

- [ ] **Step 4: Commit**

```bash
git add src/app/shared/ui/sheet/ tsconfig.json components.json
git commit -m "Add Spartan sheet component

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

(`components.json`'ı CLI değiştirmediyse commit'ten çıkar.)

---

### Task 2: Shell'i responsive yap (hamburger + drawer)

**Files:**
- Modify: `src/app/layouts/dashboard-shell/dashboard-shell.ts`
- Modify: `src/app/layouts/dashboard-shell/dashboard-shell.html`
- Test: `src/app/layouts/dashboard-shell/dashboard-shell.spec.ts`

**Interfaces:**
- Consumes: `HlmSheetImports` (`@ui/sheet`, Task 1), `NgTemplateOutlet` (`@angular/common`), `NgIcon`/`provideIcons` (`@ng-icons/core`), `lucideMenu` (`@ng-icons/lucide`).
- Produces: `DashboardShell.mobileNavState: WritableSignal<'open' | 'closed'>` ve `DashboardShell.closeMobileNav(): void`. Dış API (input'lar) değişmez; provider-layout'a dokunulmaz.

- [ ] **Step 1: Failing testleri yaz**

`dashboard-shell.spec.ts` — dosyanın en üstüne (import'ların altına) test için boş bir bileşen ekle ve `beforeEach`'teki router provider'ını genişlet. Drawer'daki linke tıklamak gerçek bir navigasyon tetikler; `provideRouter([])` URL'i eşleyemeyip hata üretir, bu yüzden her şeyi yutan bir wildcard route gerekir.

`Host` sınıfının üstüne ekle:

```ts
@Component({ template: '' })
class Blank {}
```

`beforeEach` içindeki `provideRouter([])` satırını şununla değiştir:

```ts
providers: [
  provideRouter([{ path: '**', component: Blank }]),
  { provide: UserService, useValue: userService },
],
```

`describe` bloğunun sonuna yeni testler:

```ts
  it('hamburger tetikleyicisi render edilir', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const trigger = fixture.nativeElement.querySelector('[data-slot="sheet-trigger"]');

    expect(trigger).toBeTruthy();
    expect(trigger?.getAttribute('aria-label')).toBe('Menüyü aç');
  });

  it('hamburger tıklanınca drawer nav linklerini gösterir', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();

    (
      fixture.nativeElement.querySelector('[data-slot="sheet-trigger"]') as HTMLButtonElement
    ).click();
    await fixture.whenStable();

    const content = document.body.querySelector('[data-slot="sheet-content"]');
    expect(content).toBeTruthy();
    const links = Array.from(content!.querySelectorAll<HTMLAnchorElement>('nav a'));
    expect(links.map((a) => a.textContent?.trim())).toEqual(['Genel Bakış', 'Teknelerim']);
  });

  it('drawer içindeki nav linkine tıklanınca drawer kapanır', async () => {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    const shell = fixture.debugElement.query(By.directive(DashboardShell)).componentInstance;

    (
      fixture.nativeElement.querySelector('[data-slot="sheet-trigger"]') as HTMLButtonElement
    ).click();
    await fixture.whenStable();
    expect(shell.mobileNavState()).toBe('open');

    const link = document.body.querySelector(
      '[data-slot="sheet-content"] nav a',
    ) as HTMLAnchorElement;
    link.click();
    await fixture.whenStable();

    expect(shell.mobileNavState()).toBe('closed');
  });
```

- [ ] **Step 2: Testlerin FAIL ettiğini doğrula**

Çalıştır: `npx ng test --include src/app/layouts/dashboard-shell --watch=false`
Beklenen: eski 6 test PASS; yeni 3 test FAIL — `[data-slot="sheet-trigger"]` null (henüz template'te sheet yok), `shell.mobileNavState` fonksiyon değil.

- [ ] **Step 3: Implementasyonu yaz**

`dashboard-shell.ts` dosyasının tamamı şu hâle gelir:

```ts
import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideMenu } from '@ng-icons/lucide';
import { HlmButton } from '@ui/button';
import { HlmPopoverImports } from '@ui/popover';
import { HlmSheetImports } from '@ui/sheet';
import { UserService } from '@services/user.service';
import { AuthStore } from '../../core/auth/auth-store';
import { NavItem } from './nav-item';

/**
 * Panel alanlarının (provider, ileride admin) ortak iskeleti:
 * sidebar + topbar + kullanıcı menüsü. Routed içerik ng-content ile
 * projekte edilir, router-outlet kullanan layout'ta kalır.
 *
 * lg altında sidebar gizlenir; nav, hamburger ile soldan açılan sheet
 * drawer'ında gösterilir. Nav markup'ı tek ng-template'te yaşar, iki
 * yerde (statik sidebar + drawer) outlet ile basılır.
 */
@Component({
  selector: 'app-dashboard-shell',
  imports: [
    NgTemplateOutlet,
    RouterLink,
    RouterLinkActive,
    NgIcon,
    HlmButton,
    HlmPopoverImports,
    HlmSheetImports,
  ],
  providers: [provideIcons({ lucideMenu })],
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

  /** lg altındaki drawer'ın durumu; sheet'in state input'una bağlanır. */
  mobileNavState = signal<'open' | 'closed'>('closed');

  /** Sayfa yenilenince store boşalır; o durumda nötr "Hesap" gösterilir. */
  displayName = computed(() => {
    const user = this.authStore.user();
    return user ? `${user.name} ${user.surname}` : 'Hesap';
  });

  /**
   * Nav linki tıklanınca drawer kapatılır. Statik sidebar'daki linkler de
   * aynı template'i kullandığı için burayı çağırır — drawer zaten kapalıyken
   * no-op'tur.
   */
  closeMobileNav(): void {
    this.mobileNavState.set('closed');
  }

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

`dashboard-shell.html` dosyasının tamamı şu hâle gelir:

```html
<div class="flex min-h-screen bg-background text-foreground">
  <ng-template #navContent>
    <nav class="flex flex-col gap-1 px-3">
      @for (item of navItems(); track item.path) {
        <a
          hlmBtn
          variant="ghost"
          class="justify-start"
          [routerLink]="item.path"
          routerLinkActive="bg-accent text-accent-foreground"
          ariaCurrentWhenActive="page"
          [routerLinkActiveOptions]="{ exact: item.exact }"
          (click)="closeMobileNav()"
          >{{ item.label }}</a
        >
      }
    </nav>
  </ng-template>

  <aside class="hidden w-60 shrink-0 border-r border-border bg-muted/40 lg:block">
    <div class="px-5 py-5 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
      {{ panelTitle() }}
    </div>
    <ng-container [ngTemplateOutlet]="navContent" />
  </aside>

  <div class="flex min-w-0 flex-1 flex-col">
    <header class="flex h-14 items-center gap-2 border-b border-border px-4 lg:px-6">
      <hlm-sheet side="left" [state]="mobileNavState()" (stateChanged)="mobileNavState.set($event)">
        <button
          hlmSheetTrigger
          hlmBtn
          variant="ghost"
          size="icon"
          class="lg:hidden"
          aria-label="Menüyü aç"
        >
          <ng-icon name="lucideMenu" />
        </button>
        <hlm-sheet-content *hlmSheetPortal>
          <div class="px-2 py-4 text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            {{ panelTitle() }}
          </div>
          <ng-container [ngTemplateOutlet]="navContent" />
        </hlm-sheet-content>
      </hlm-sheet>

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

    <main class="flex-1 p-4 sm:p-6 lg:p-8">
      <ng-content />
    </main>
  </div>
</div>
```

Değişikliklerin özü (eski template'e göre): nav `ng-template`'e taşındı; `aside`'a `hidden lg:block` eklendi; header'a hamburger + sheet geldi, popover `ml-auto` ile sağa itildi (eski `justify-end` kaldırıldı çünkü hamburger solda duracak); `main` dolgusu responsive oldu. Popover ve çıkış bloğu aynen korundu.

- [ ] **Step 4: Testlerin PASS ettiğini doğrula**

Çalıştır: `npx ng test --include src/app/layouts/dashboard-shell --watch=false`
Beklenen: 9 test PASS (6 eski + 3 yeni).

- [ ] **Step 5: Tam suite + build**

Çalıştır: `npm test -- --watch=false`
Beklenen: tümü PASS.

Çalıştır: `npm run build`
Beklenen: hatasız tamamlanır.

- [ ] **Step 6: Commit**

```bash
git add src/app/layouts/dashboard-shell/
git commit -m "Make DashboardShell responsive with sheet drawer below lg

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```
