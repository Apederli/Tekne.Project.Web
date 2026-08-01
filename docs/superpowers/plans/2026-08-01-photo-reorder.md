# Fotoğraf Sıralama (Drag & Drop) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Partner, fotoğraf ızgarasında karoları tutamaç butonundan sürükleyerek sırayı (ve dolayısıyla kapağı) değiştirsin.

**Architecture:** Her şey `PhotoUploader` içinde: ekle-karosu ızgaradan çıkıp üstte tam genişlik bara dönüşür, ızgara `cdkDropList` (mixed) olur, drop'ta optimistic emit + tek `reorder` PUT'u atılır. `BoatPhotos` host'u ve `photosChanged` sözleşmesi değişmez.

**Tech Stack:** `@angular/cdk/drag-drop` (CDK 22.0.0 kurulu, yeni paket yok), mevcut `BoatPhotoService.reorder`, `lucideGripVertical` ikonu.

**Spec:** `docs/superpowers/specs/2026-08-01-photo-reorder-design.md`

## Global Constraints

- **GIT COMMIT YASAK.** Hiçbir adımda `git commit` / `git add` çalıştırılmaz; değişiklikler kullanıcı incelemesi için working tree'de bırakılır.
- **Yeni test yazılmaz** (proje kararı). `photo-uploader.spec.ts` yalnızca kırılırsa asgari uyarlanır.
- Mobile-first: taban sınıflar mobil; `sm:`/`lg:` yalnızca büyütür. Dokunma hedefleri ≥40px (`h-10 w-10`).
- Angular 22: erişim belirteci yok, `inject()`, `@if`/`@for`, signal.
- Arayüz metinleri Türkçe; tutamaç sr-only etiketi birebir: `{{ i + 1 }}. fotoğrafı taşı`.

---

### Task 1: PhotoUploader'a sürükle-bırak sıralama

**Files:**
- Modify: `src/app/features/provider/boats/photo-uploader/photo-uploader.ts`
- Modify: `src/app/features/provider/boats/photo-uploader/photo-uploader.html`
- Modify: `src/styles.scss`

**Interfaces:**
- Consumes: `BoatPhotoService.reorder(boatId: number, photoIdsInOrder: number[]): Observable<boolean>` (mevcut), `sortBoatPhotos`, CDK `CdkDropList`/`CdkDrag`/`CdkDragHandle`/`CdkDragDrop`/`moveItemInArray`.
- Produces: `photosChanged` emit'leri — drop sonrası alanlar yeniden yazılmış liste (index 0 `isMain: true`, `sortOrder = index`). Dış sözleşme değişmez.

- [ ] **Step 1: `photo-uploader.ts`'i güncelle**

Değişiklikler (dosyanın geri kalanı aynen korunur):

1. Import'lara ekle:

```ts
import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDropList,
  moveItemInArray,
} from '@angular/cdk/drag-drop';
```

`lucide` satırı şu olur: `import { lucideGripVertical, lucideImagePlus, lucideTrash2 } from '@ng-icons/lucide';`

2. Dekorator: `imports: [CdkDrag, CdkDragHandle, CdkDropList, NgIcon, HlmButton]`, `providers: [provideIcons({ lucideGripVertical, lucideImagePlus, lucideTrash2 })]`.

3. `dragging` signal'inin altına yeni üyeler:

```ts
  /** Sıralama isteği uçuyor — karşılıklı dışlamanın üçüncü ortağı. */
  reordering = signal(false);

  /** Yükleme/silme/sıralamadan biri uçarken diğer ikisi başlayamaz. */
  busy = computed(
    () => this.uploadingCount() > 0 || this.deletingId() !== null || this.reordering(),
  );
```

4. Mevcut koruma satırları `busy()` kullanacak şekilde değişir (davranış genişler, daralmaz):
   - `onDrop`: `if (this.full() || this.deletingId() !== null) return;` → `if (this.full() || this.busy()) return;`
   - `upload`: `if (this.uploadingCount() > 0 || this.deletingId() !== null) return;` → `if (this.busy()) return;` (üstündeki uzun yorum kalır)
   - `remove`: `if (this.deletingId() !== null || this.uploadingCount() > 0) return;` → `if (this.busy()) return;`

5. `remove()`'un altına yeni metot:

```ts
  /**
   * Sıra değişikliği: yeni sıra anında yayınlanır (optimistic), tek PUT atılır.
   * Backend sözleşmesi: dizinin ilk elemanı kapaktır — `isMain`/`sortOrder`
   * alanları da yeni sıraya göre yazılır ki `sortBoatPhotos` görsel sırayla
   * aynı sonucu üretsin ve "Kapak" rozeti doğru karoya geçsin.
   */
  onPhotoDrop(event: CdkDragDrop<BoatPhotoOutputModel[]>): void {
    if (event.previousIndex === event.currentIndex) return;
    if (this.busy()) return;

    const previous = this.photos();
    const next = [...this.visible()];
    moveItemInArray(next, event.previousIndex, event.currentIndex);
    const renumbered = next.map((p, i) => ({ ...p, isMain: i === 0, sortOrder: i }));

    this.reordering.set(true);
    this.photosChanged.emit(renumbered);
    this.photoService.reorder(this.boatId(), renumbered.map((p) => p.id)).subscribe({
      next: () => this.reordering.set(false),
      // Mesajı errorInterceptor gösterdi; buradaki iş sırayı geri almak.
      error: () => {
        this.reordering.set(false);
        this.photosChanged.emit(previous);
      },
    });
  }
```

- [ ] **Step 2: `photo-uploader.html`'i güncelle**

Dosyanın tam yeni içeriği:

```html
<div>
  @if (!full()) {
    <!--
      Ekle-barı ızgaranın DIŞINDA: cdkDropList içindeki sürüklenemeyen hücre
      CDK'nın karışık yön sıralama hesabını bozar. Gizli input bir label ile
      sarılı: telefonda tek dokunuşla galeri açılır; masaüstü dosya bırakma
      vurgusu (dragging) barda devam eder.
    -->
    <label
      class="mb-3 flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed p-3 text-muted-foreground hover:bg-muted/50 focus-within:ring-2 focus-within:ring-ring has-disabled:cursor-not-allowed has-disabled:opacity-50 has-disabled:hover:bg-transparent"
      [class]="dragging() ? 'border-primary bg-muted/50' : 'border-input'"
      (dragover)="$event.preventDefault(); dragging.set(true)"
      (dragleave)="dragging.set(false)"
      (drop)="onDrop($event)"
    >
      <ng-icon name="lucideImagePlus" size="24" />
      <span class="text-sm">Fotoğraf ekle</span>
      <input
        type="file"
        accept="image/*"
        multiple
        class="sr-only"
        [disabled]="deletingId() !== null || reordering()"
        #fileInput
        (change)="onFileInput(fileInput)"
      />
    </label>
  }

  <!-- Mobile-first: telefonda iki sütun, ekranla birlikte genişliyor. -->
  <div
    class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
    cdkDropList
    cdkDropListOrientation="mixed"
    (cdkDropListDropped)="onPhotoDrop($event)"
  >
    @for (photo of visible(); track photo.id; let i = $index) {
      <div
        cdkDrag
        [cdkDragDisabled]="busy()"
        class="relative aspect-square overflow-hidden rounded-lg bg-muted"
        [class]="deletingId() === photo.id ? 'opacity-50' : ''"
      >
        <img
          [src]="photoUrl.url(photo.objectKey)"
          [alt]="photoAlt(i)"
          loading="lazy"
          decoding="async"
          class="h-full w-full object-cover"
        />

        @if (i === 0) {
          <span
            data-testid="cover-badge"
            class="absolute start-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white"
          >
            Kapak
          </span>
        }

        <!-- Dokunmatikte hover yok: düğme daima görünür. -->
        <button
          hlmBtn
          variant="secondary"
          size="icon-sm"
          type="button"
          class="absolute end-2 top-2 rounded-full"
          [disabled]="busy()"
          (click)="remove(photo)"
        >
          <ng-icon name="lucideTrash2" size="16" />
          <span class="sr-only">{{ i + 1 }}. fotoğrafı sil</span>
        </button>

        <!--
          Sürükleme YALNIZCA tutamaçtan başlar; karonun kendisi kaydırmayı
          bozmaz. touch-none: parmak tutamaçtayken tarayıcı kaydırmayı değil
          CDK sürüklemesini alsın. 40px hedef (h-10 w-10) — dokunma kuralı.
        -->
        <button
          hlmBtn
          variant="secondary"
          type="button"
          cdkDragHandle
          class="absolute end-2 bottom-2 h-10 w-10 cursor-grab touch-none rounded-full p-0"
          [disabled]="busy()"
        >
          <ng-icon name="lucideGripVertical" size="18" />
          <span class="sr-only">{{ i + 1 }}. fotoğrafı taşı</span>
        </button>
      </div>
    }

    @for (skeleton of skeletons(); track skeleton) {
      <div class="aspect-square animate-pulse rounded-lg bg-muted"></div>
    }
  </div>

  @if (skippedMessage()) {
    <p class="mt-3 text-sm text-muted-foreground" role="status">{{ skippedMessage() }}</p>
  }
</div>
```

Not: iskelet kutucuklar drop list içinde kalıyor — yalnızca yükleme uçarken
varlar ve o sırada `cdkDragDisabled` olduğu için CDK sıralamasıyla hiç
çakışmazlar (spec'te gerekçesi var).

- [ ] **Step 3: `src/styles.scss`'e CDK sürükleme stillerini ekle**

Dosya bugün tek yorum satırı; altına eklenir:

```scss
/* CDK drag-drop görsel durumları — fotoğraf sıralama (photo-uploader).
   Preview ve placeholder body altına ışınlandığı için bileşen stiline
   yazılamaz, global olmak zorundalar. */
.cdk-drag-preview {
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.3);
}

.cdk-drag-placeholder {
  opacity: 0.3;
}

.cdk-drag-animating,
.cdk-drop-list-dragging .cdk-drag:not(.cdk-drag-placeholder) {
  transition: transform 200ms cubic-bezier(0, 0, 0.2, 1);
}
```

- [ ] **Step 4: Doğrula**

Run: `npx ng test --include src/app/features/provider/boats --watch=false`
Expected: mevcut testlerin tamamı PASS (spec dosyası bileşen API'sine ve `img`/rozet seçicilerine bakıyor; yerleşim değişikliği onları kırmamalı). Kırılan olursa yalnızca seçici düzeyinde asgari uyarlama yapılır — yeni test/assertion eklenmez.

Run: `npx prettier --check src/app/features/provider/boats/photo-uploader/ src/styles.scss`
Expected: pass (gerekiyorsa `--write` ile düzelt, yeniden `--check`).

**Commit yok** — değişiklikler working tree'de kalır.
