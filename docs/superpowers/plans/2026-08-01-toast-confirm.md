# Toast + Onay Diyaloğu Servisleri — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** HTTP hataları toast ile gösterilsin (`alert()` ölsün) ve fotoğraf silme bir onay diyaloğunun arkasına geçsin.

**Architecture:** `ToastService` brain sonner'ın `toast`'unu sarar, `<hlm-toaster>` App kökünde bir kez durur; `errorInterceptor` alert yerine bu servisi çağırır. `ConfirmService`, kurulu dialog helm'inin `HlmDialogService.open()`'ı ile `ConfirmDialog` bileşenini açıp `Promise<boolean>` döner; uploader'da onay kapısı yeni `confirmRemove()` metodudur — `remove()` ham silme olarak değişmeden kalır (mevcut testler kırılmasın diye bilinçli ayrım).

**Tech Stack:** `@spartan-ng/brain` (kurulu — `toast`, `BrnDialogRef`, `injectBrnDialogContext`), kopyalanmış `sonner` + `dialog` helm'leri. **Yeni npm bağımlılığı yok; `alert`/`alert-dialog` helm'leri kurulmaz.**

**Spec:** `docs/superpowers/specs/2026-08-01-toast-confirm-design.md`

## Global Constraints

- **GIT COMMIT YASAK.** `git commit` / `git add` çalıştırılmaz; her şey kullanıcı incelemesi için working tree'de kalır.
- **Yeni test yazılmaz** (proje kararı). `photo-uploader.spec.ts` yalnızca Task 2'de tarif edilen asgari uyarlamayı alır.
- Angular 22: yeni singleton'larda `@Service()` (`@angular/core`), erişim belirteci yok, `inject()`.
- Metinler Türkçe, birebir: onay varsayılanları **"Onayla"** / **"Vazgeç"**; silme onayı **"{N}. fotoğraf silinsin mi?"**, mesaj **"Bu işlem geri alınamaz."**, buton **"Sil"**.
- Dokunma hedefleri: diyalog butonları `h-10`, mobilde tam genişlik (`w-full sm:w-auto`).
- Interface'ler bileşen dosyasına yazılmaz → `ConfirmOptions` `core/models/confirm.ts`.

---

### Task 1: ToastService + toaster + interceptor geçişi

**Files:**
- Create: `src/app/core/services/toast.service.ts`
- Modify: `src/app/core/services/index.ts`
- Modify: `src/app/core/interceptors/error.interceptor.ts:22-39`
- Modify: `src/app/app.ts` (imports dizisi)
- Modify: `src/app/app.html`

**Interfaces:**
- Consumes: `toast` (`@spartan-ng/brain/sonner`), `HlmToaster` (`@ui/sonner`).
- Produces: `ToastService` — `error(message: string): void`, `success(message: string): void`, `info(message: string): void`. Task 2 bunu KULLANMAZ (bağımsız görevler).

- [ ] **Step 1: `toast.service.ts`'i oluştur**

```ts
import { PLATFORM_ID, Service, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { toast } from '@spartan-ng/brain/sonner';

/**
 * Kısa ömürlü ekran bildirimi (toast) sarmalayıcısı.
 *
 * Ad bilinçli olarak "Toast": `Notification*` isim alanı ileride push
 * bildirimi / bildirim merkezi için saklanıyor (2026-08-01 kararı).
 *
 * SSR'da üç metot da sessiz no-op — sunucuda gösterilecek ekran yok,
 * çağıran taraf platform düşünmek zorunda kalmasın.
 */
@Service()
export class ToastService {
  isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  error(message: string): void {
    if (this.isBrowser) toast.error(message);
  }

  success(message: string): void {
    if (this.isBrowser) toast.success(message);
  }

  info(message: string): void {
    if (this.isBrowser) toast.info(message);
  }
}
```

`src/app/core/services/index.ts` barrel'ına alfabetik konumuna ekle:

```ts
export * from './toast.service';
```

(`photo-url.service` ile `user.service` arasına, mevcut sıraya göre.)

- [ ] **Step 2: `app.html` + `app.ts` — toaster kök yerleşimi**

`src/app/app.html` tam yeni içeriği:

```html
<app-progress-bar />
<!-- top-center bilinçli: market mobilde alt navigasyon var, alta konan toast onu örterdi. -->
<hlm-toaster richColors position="top-center" />
<router-outlet />
```

`src/app/app.ts`: `import { HlmToaster } from '@ui/sonner';` ekle ve dekoratördeki `imports` dizisine `HlmToaster` yaz (mevcut üyeler aynen kalır).

- [ ] **Step 3: `error.interceptor.ts` geçişi**

1. Import ekle: `import { ToastService } from '@services';`
2. Sınıf üstü yorumdaki `TODO: alert geçici...` paragrafını (satır 22-24) şu tek cümleyle değiştir: `Mesajlar toast ile gösterilir (ToastService); SSR'da yalnızca loglanır.`
3. Gövdede `const isBrowser = ...` satırının yanına: `const toastService = inject(ToastService);`
4. `alert(toMessage(error));` satırı şu olur: `toastService.error(toMessage(error));`

`SILENT_ERRORS`, SSR dalındaki `console.error` ve `toMessage` fonksiyonu **değişmez**.

- [ ] **Step 4: Doğrula**

Run: `npm test -- --watch=false`
Expected: 90/91 — tek hata bilinen, bu işten önce de var olan `dashboard-shell.spec.ts` hatası. (`app.spec.ts` toaster'la kırılırsa: TestBed'e provider gerekmiyor, `HlmToaster` kendi başına render olur; kırılma template hatasıysa import eksiktir.)

Run: `npx prettier --check src/app/core/services/toast.service.ts src/app/core/services/index.ts src/app/core/interceptors/error.interceptor.ts src/app/app.ts src/app/app.html`
Expected: pass (gerekirse `--write` + tekrar `--check`).

**Commit yok.**

---

### Task 2: ConfirmService + ConfirmDialog + fotoğraf silme onayı

**Files:**
- Create: `src/app/core/models/confirm.ts`
- Modify: `src/app/core/models/index.ts`
- Create: `src/app/shared/confirm-dialog/confirm-dialog.ts`
- Create: `src/app/shared/confirm-dialog/confirm-dialog.html`
- Create: `src/app/shared/confirm-dialog/confirm.service.ts`
- Modify: `src/app/features/provider/boats/photo-uploader/photo-uploader.ts`
- Modify: `src/app/features/provider/boats/photo-uploader/photo-uploader.html` (çöp butonunun `(click)`'i)
- Modify: `src/app/features/provider/boats/photo-uploader/photo-uploader.spec.ts` (asgari uyarlama)

**Interfaces:**
- Consumes: `HlmDialogService.open<TResult, TContext>(component, options)` → `BrnDialogRef<TResult>` (kopyalı helm: `src/app/shared/ui/dialog/src/lib/hlm-dialog.service.ts`), `injectBrnDialogContext<T>()` ve `BrnDialogRef` (`@spartan-ng/brain/dialog`).
- Produces: `ConfirmService.confirm(options: ConfirmOptions): Promise<boolean>`; `PhotoUploader.confirmRemove(photo: BoatPhotoOutputModel, index: number): Promise<void>`.

**Neden `ConfirmService` `shared/confirm-dialog/` içinde:** servis `ConfirmDialog` bileşenine referans verir; `@services` barrel'ına konursa barrel'ı import eden her dosyaya bileşen + dialog helm bağımlılığı bulaşır (barrel'ın kendi başlık yorumu bunu yasaklıyor). Birlikte değişen dosyalar birlikte yaşar; tüketici doğrudan `.../shared/confirm-dialog/confirm.service` import eder.

- [ ] **Step 1: `core/models/confirm.ts` + barrel**

```ts
/** `ConfirmService.confirm` seçenekleri. */
export interface ConfirmOptions {
  title: string;
  message?: string;
  /** Varsayılan: "Onayla" */
  confirmText?: string;
  /** Varsayılan: "Vazgeç" */
  cancelText?: string;
  /** true ise onay butonu destructive görünür. */
  destructive?: boolean;
}
```

`src/app/core/models/index.ts`'e alfabetik konumuna `export * from './confirm';` ekle.

- [ ] **Step 2: `confirm-dialog.ts` + `confirm-dialog.html`**

`src/app/shared/confirm-dialog/confirm-dialog.ts`:

```ts
import { Component, inject } from '@angular/core';
import { BrnDialogRef, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { HlmButton } from '@ui/button';
import {
  HlmDialogDescription,
  HlmDialogFooter,
  HlmDialogHeader,
  HlmDialogTitle,
} from '@ui/dialog';
import { ConfirmOptions } from '@models';

/**
 * `ConfirmService`in açtığı onay içeriği. Tek başına kullanılmaz: context'i
 * servis verir, sonuç `ref.close(boolean)` ile döner. Yalnızca Onay butonu
 * `true` üretir — Vazgeç/backdrop/Escape `false` sayılır (serviste normalize).
 */
@Component({
  selector: 'app-confirm-dialog',
  imports: [HlmButton, HlmDialogDescription, HlmDialogFooter, HlmDialogHeader, HlmDialogTitle],
  templateUrl: './confirm-dialog.html',
})
export class ConfirmDialog {
  ref = inject<BrnDialogRef<boolean>>(BrnDialogRef);
  options = injectBrnDialogContext<ConfirmOptions>();
}
```

`src/app/shared/confirm-dialog/confirm-dialog.html`:

```html
<hlm-dialog-header>
  <h3 hlmDialogTitle>{{ options.title }}</h3>
  @if (options.message) {
    <p hlmDialogDescription>{{ options.message }}</p>
  }
</hlm-dialog-header>

<!-- Mobile-first: butonlar tabanda alt alta tam genişlik; sm üstünde yan yana. -->
<hlm-dialog-footer class="mt-4">
  <button hlmBtn variant="outline" class="h-10 w-full sm:w-auto" (click)="ref.close(false)">
    {{ options.cancelText ?? 'Vazgeç' }}
  </button>
  <button
    hlmBtn
    [variant]="options.destructive ? 'destructive' : 'default'"
    class="h-10 w-full sm:w-auto"
    (click)="ref.close(true)"
  >
    {{ options.confirmText ?? 'Onayla' }}
  </button>
</hlm-dialog-footer>
```

Not: `hlm-dialog-header` / `hlmDialogTitle` / `hlmDialogDescription` /
`hlm-dialog-footer` seçicilerini `src/app/shared/ui/dialog/src/` altındaki
dosyalardan birebir doğrula — sapma varsa oradaki gerçek seçiciyi kullan.

- [ ] **Step 3: `confirm.service.ts`**

```ts
import { Service, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { HlmDialogService } from '@ui/dialog';
import { ConfirmOptions } from '@models';
import { ConfirmDialog } from './confirm-dialog';

/**
 * Yıkıcı işlemler için onay: `await confirm(...)` yalnızca kullanıcı Onay
 * butonuna bastıysa `true` döner. Vazgeç, backdrop ve Escape `false` —
 * "kazayla evet" imkânsız, "kazayla hayır" zararsız.
 *
 * `@services` barrel'ında DEĞİL: bileşene referans veren servis barrel'a
 * girerse dialog helm'i barrel'ı import eden herkese bulaşır.
 */
@Service()
export class ConfirmService {
  dialogService = inject(HlmDialogService);

  async confirm(options: ConfirmOptions): Promise<boolean> {
    const ref = this.dialogService.open<boolean, ConfirmOptions>(ConfirmDialog, {
      context: options,
      showCloseButton: false,
      contentClass: 'max-w-sm',
    });
    const result = await firstValueFrom(ref.closed$);
    return result === true;
  }
}
```

Not: `BrnDialogRef`'in kapanış observable'ının adı (`closed$`) derlemede
tutmazsa `node_modules/@spartan-ng/brain/types/spartan-ng-brain-dialog.d.ts`
içinden gerçek adını al; sözleşme "kapanış değerini bekle, `true` değilse
`false` say" olarak sabittir.

- [ ] **Step 4: Uploader'a onay kapısı**

`photo-uploader.ts`:

1. Import: `import { ConfirmService } from '../../../../shared/confirm-dialog/confirm.service';`
2. Üye: `confirmService = inject(ConfirmService);` (`photoService`'in yanına).
3. `remove()`'un ÜSTÜNE yeni metot (remove'un kendisi değişmez):

```ts
  /**
   * Çöp butonunun yolu: önce onay, sonra ham silme. `remove()` ayrı kalır —
   * silme mekaniği (karşılıklı dışlama, emit) onaydan bağımsız.
   */
  async confirmRemove(photo: BoatPhotoOutputModel, index: number): Promise<void> {
    if (this.busy()) return;

    const confirmed = await this.confirmService.confirm({
      title: `${index + 1}. fotoğraf silinsin mi?`,
      message: 'Bu işlem geri alınamaz.',
      confirmText: 'Sil',
      destructive: true,
    });
    // Diyalog açıkken başka bir işlem başlamış olabilir — kapı yeniden kontrol edilir.
    if (!confirmed || this.busy()) return;

    this.remove(photo);
  }
```

`photo-uploader.html`: çöp butonundaki `(click)="remove(photo)"` →
`(click)="confirmRemove(photo, i)"`. Başka hiçbir şey değişmez.

- [ ] **Step 5: `photo-uploader.spec.ts` asgari uyarlaması**

Yalnızca iki dokunuş; yeni test/assertion YOK:

1. TestBed'e stub provider (import satırıyla birlikte):

```ts
import { ConfirmService } from '../../../../shared/confirm-dialog/confirm.service';
// providers dizisine:
{ provide: ConfirmService, useValue: { confirm: () => Promise.resolve(true) } },
```

2. `'sil düğmesi fotoğrafı doğru uca gönderir'` testi (yaklaşık satır 229)
   DOM'dan tıkladığı için artık onaydan geçiyor; async yapılır:

```ts
  it('sil düğmesi fotoğrafı doğru uca gönderir', async () => {
    setPhotos([photo(1, 0), photo(2, 1)]);

    fixture.nativeElement.querySelectorAll('button')[0].click();
    await fixture.whenStable();

    const request = http.expectOne(
      (r) => r.method === 'DELETE' && r.url.endsWith('/Boats/7/photos/1'),
    );
    expect(request.request.method).toBe('DELETE');
    request.flush(true);
  });
```

`component.remove(...)`'u doğrudan çağıran diğer testler onay yolundan
geçmediği için DEĞİŞMEZ.

- [ ] **Step 6: Doğrula**

Run: `npx ng test --include src/app/features/provider/boats --watch=false`
Expected: tamamı PASS.

Run: `npm test -- --watch=false`
Expected: 90/91 (bilinen dashboard-shell hatası hariç tamamı yeşil).

Run: `npx prettier --check src/app/core/models/confirm.ts src/app/core/models/index.ts src/app/shared/confirm-dialog/ src/app/features/provider/boats/photo-uploader/photo-uploader.ts src/app/features/provider/boats/photo-uploader/photo-uploader.html src/app/features/provider/boats/photo-uploader/photo-uploader.spec.ts`
Expected: pass (gerekirse `--write` + tekrar `--check`).

**Commit yok.**

## Self-check

- Spec kapsaması: §1 ToastService → Task 1/1; §2 toaster → Task 1/2; §3
  interceptor → Task 1/3; §4 ConfirmOptions → Task 2/1; §5 ConfirmService →
  Task 2/3; §6 ConfirmDialog → Task 2/2; §7 silme onayı → Task 2/4-5.
- Tip tutarlılığı: `confirm(options: ConfirmOptions): Promise<boolean>` her
  yerde aynı; `confirmRemove(photo, index)` şablondaki `(photo, i)` ile eş;
  `open<boolean, ConfirmOptions>` dönüş `BrnDialogRef<boolean>` → `closed$`
  değeri `boolean | undefined` → `=== true` normalizasyonu.
- Spec'ten bilinçli sapmalar (spec de güncellendi): onay kapısı `remove()`
  yerine `confirmRemove()`'da; `ConfirmService` `core/services` yerine
  `shared/confirm-dialog/` içinde.
