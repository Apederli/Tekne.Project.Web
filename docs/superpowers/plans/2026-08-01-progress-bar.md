# Üst İlerleme Barı — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Uçan HTTP isteği varken ekranın üstünde 3px'lik, dokunmayı engellemeyen, site geneli bir indeterminate ilerleme barı.

**Architecture:** `PendingRequests` signal sayacı (core servis) + onu artırıp `finalize` ile düşüren functional interceptor (yalnızca tarayıcıda sayar → SSR HTML'inde bar yok) + `App` kökünde bir kez render edilen `ProgressBar` bileşeni (300ms gecikmeli görünürlük).

**Tech Stack:** Angular 22 signals/effect, functional HTTP interceptor, saf CSS keyframes animasyonu.

**Spec:** `docs/superpowers/specs/2026-08-01-progress-bar-design.md`

## Global Constraints

- **GIT COMMIT YASAK.** Hiçbir adımda `git commit` / `git add` çalıştırılmaz; değişiklikler kullanıcı incelemesi için working tree'de bırakılır.
- **Yeni test yazılmaz** (proje kararı).
- Angular 22: yeni singleton serviste `@Service()` (`@angular/core`'dan — `auth-store.ts` örneği), erişim belirteci yok, `inject()`.
- SSR güvenliği: template'te platform dallanması YOK; görünürlük sinyali server'da hiç true olmaz çünkü sayaç yalnızca tarayıcıda artar.
- Arayüz metni Türkçe: bar `aria-label="Yükleniyor"`.

---

### Task 1: Sayaç servisi + interceptor + bar bileşeni + kök yerleşim

**Files:**
- Create: `src/app/core/services/pending-requests.service.ts`
- Modify: `src/app/core/services/index.ts` (barrel'a export satırı)
- Create: `src/app/core/interceptors/pending-requests.interceptor.ts`
- Modify: `src/app/app.config.ts` (interceptor kaydı)
- Create: `src/app/shared/progress-bar/progress-bar.ts`
- Create: `src/app/shared/progress-bar/progress-bar.html`
- Modify: `src/app/app.ts` (imports'a `ProgressBar`)
- Modify: `src/app/app.html`

**Interfaces:**
- Produces: `PendingRequests` — `count: signal<number>`, `pending: computed<boolean>`, `increment(): void`, `decrement(): void`. Interceptor ve bar yalnızca bunları kullanır.

- [ ] **Step 1: `pending-requests.service.ts`'i oluştur**

```ts
import { Service, computed, signal } from '@angular/core';

/**
 * Uçan HTTP isteği sayacının tek sahibi. Artırma/azaltma yalnızca
 * `pendingRequestsInterceptor`'dan gelir; bileşenler sadece `pending` okur.
 */
@Service()
export class PendingRequests {
  count = signal(0);

  pending = computed(() => this.count() > 0);

  increment(): void {
    this.count.update((n) => n + 1);
  }

  decrement(): void {
    this.count.update((n) => n - 1);
  }
}
```

`index.ts` barrel'ına (alfabetik sıraya uyarak `photo-url.service`'ten önce) ekle:

```ts
export * from './pending-requests.service';
```

- [ ] **Step 2: `pending-requests.interceptor.ts`'i oluştur**

```ts
import { PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpInterceptorFn } from '@angular/common/http';
import { finalize } from 'rxjs';
import { PendingRequests } from '@services';

/**
 * Üstteki ilerleme barı için uçan istekleri sayar.
 *
 * Yalnızca tarayıcıda: server render sırasında sayaç hiç artmaz, bar SSR
 * HTML'ine hiç girmez — hydration uyuşmazlığı bu yüzden imkânsız.
 *
 * `finalize` başarıda, hatada ve iptalde de çalışır; sayaç asla asılı kalmaz.
 * Hata mesajıyla ilgilenmez — o iş errorInterceptor'da.
 */
export const pendingRequestsInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isPlatformBrowser(inject(PLATFORM_ID))) return next(req);

  const pending = inject(PendingRequests);
  pending.increment();
  return next(req).pipe(finalize(() => pending.decrement()));
};
```

- [ ] **Step 3: `app.config.ts`'e interceptor'ı kaydet**

Import ekle: `import { pendingRequestsInterceptor } from '@interceptors/pending-requests.interceptor';`

`provideHttpClient` satırı şu olur (sıra: sayaç en dışta — istek yola çıktığı anda saymaya başlar, mevcut error→auth sırası korunur):

```ts
    provideHttpClient(
      withInterceptors([pendingRequestsInterceptor, errorInterceptor, authInterceptor]),
    ),
```

Üstündeki mevcut yorum bloğuna tek satır eklenir: `// pendingRequestsInterceptor üstteki ilerleme barının sayacını tutar.`

- [ ] **Step 4: `progress-bar.ts` + `progress-bar.html`'i oluştur**

`src/app/shared/progress-bar/progress-bar.ts`:

```ts
import { Component, effect, inject, signal } from '@angular/core';
import { PendingRequests } from '@services';

/**
 * Üst kenarda akan indeterminate istek göstergesi.
 *
 * 300ms gecikme: kısa isteklerde bar hiç görünmez (titreme önleme). Sayaç
 * sıfırlanınca gizlenme gecikmesiz. Sayaç yalnızca tarayıcıda arttığı için
 * SSR çıktısında bar yoktur; template'te platform dallanması gerekmez.
 */
@Component({
  selector: 'app-progress-bar',
  templateUrl: './progress-bar.html',
  styles: `
    .indicator {
      animation: progress-slide 1.2s ease-in-out infinite;
    }
    @keyframes progress-slide {
      from {
        transform: translateX(-100%);
      }
      to {
        transform: translateX(400%);
      }
    }
  `,
})
export class ProgressBar {
  pendingRequests = inject(PendingRequests);

  visible = signal(false);
  showTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      if (this.pendingRequests.pending()) {
        if (this.showTimer === null && !this.visible()) {
          this.showTimer = setTimeout(() => {
            this.showTimer = null;
            this.visible.set(true);
          }, 300);
        }
      } else {
        if (this.showTimer !== null) {
          clearTimeout(this.showTimer);
          this.showTimer = null;
        }
        this.visible.set(false);
      }
    });
  }
}
```

`src/app/shared/progress-bar/progress-bar.html`:

```html
@if (visible()) {
  <div
    role="progressbar"
    aria-label="Yükleniyor"
    class="pointer-events-none fixed inset-x-0 top-0 z-50 h-[3px] overflow-hidden"
  >
    <!-- w-1/3 şerit -100% → 400% arası kayar: döngü tüm genişliği tarar. -->
    <div class="indicator h-full w-1/3 rounded-full bg-primary"></div>
  </div>
}
```

- [ ] **Step 5: Kök yerleşim**

`src/app/app.ts`: `ProgressBar`'ı import edip dekoratordeki `imports` dizisine ekle (mevcut yapıyı koru, başka bir şeye dokunma).

`src/app/app.html` tam yeni içeriği:

```html
<app-progress-bar />
<router-outlet />
```

- [ ] **Step 6: Doğrula**

Run: `npm test -- --watch=false`
Expected: suite yeşil — `App` spec'i varsa ve kırılırsa asgari uyarlama (ör. bileşen artık `PendingRequests` enjekte ediyor; `provideHttpClient` sağlayan TestBed'lerde sorun çıkmaz).

Run: `npx prettier --check src/app/core/services/pending-requests.service.ts src/app/core/interceptors/pending-requests.interceptor.ts src/app/shared/progress-bar/ src/app/app.html src/app/app.ts src/app/app.config.ts src/app/core/services/index.ts`
Expected: pass.

**Commit yok** — değişiklikler working tree'de kalır.
