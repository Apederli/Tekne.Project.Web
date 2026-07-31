# Fotoğraf yükleme component'i — uygulama planı

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Partner'ın bir tekneye fotoğraf yükleyip silebildiği, `boatId` ve `photos` girdileriyle çalışan bağımsız bir component.

**Architecture:** Component veri çekmez ve kalıcı liste tutmaz; gösterdiği şey `photos()` girdisidir, her başarılı işlemden sonra tam listeyi `photosChanged` ile emit eder. Dosya elemesi (tip, boyut, 20 sınırı) saf fonksiyonlara ayrılıp ayrı test edilir — backend doğrulaması toplu olduğu için tek geçersiz dosya isteğin tamamını düşürür, eleme istemcide yapılmak zorunda.

**Tech Stack:** Angular 22 (signals, `input()`/`output()`, `@if`/`@for`), Tailwind v4, spartan/helm (`@ui/button`), `@ng-icons/lucide`, Vitest + `HttpTestingController`.

**Kaynak spec:** [docs/superpowers/specs/2026-07-31-photo-uploader-design.md](../specs/2026-07-31-photo-uploader-design.md)

## Global Constraints

- Angular 22 konvansiyonları: `standalone`/`changeDetection` yazma, `inject()` kullan, üyelerde `private`/`readonly` **yok**, `@if`/`@for`, `class` binding (`ngClass` değil).
- **Mobile-first:** taban sınıflar mobil düzeni tarif eder, `sm:`/`md:`/`lg:` yalnızca büyütür. Dokunmatikte hover yok — sil düğmesi daima görünür.
- `try/catch` yok; hata mesajını `errorInterceptor` gösterir. `subscribe`'ın error dalı yalnızca geçici UI durumunu temizler.
- Interface/tip tanımı bileşen dosyasında olmaz; API modelleri `core/models/` altındadır. Bu component'in kendi yardımcı tipleri (`RejectedFile`) API modeli değildir, kural gereği `core/models/`'e taşınmaz — kendi kural dosyasında yaşar.
- Backend sınırları: dosya başına **10MB**, tekne başına **20** fotoğraf, izinli tipler `image/jpeg`, `image/jpg`, `image/png`, `image/webp`, `image/avif`, `image/heic`, `image/heif`.
- Commit mesajları İngilizce, gövde Türkçe olabilir; her task sonunda commit.

## File Structure

| Dosya | Sorumluluk |
|---|---|
| `src/app/features/provider/boats/photo-uploader/photo-upload-rules.ts` | Saf fonksiyonlar: content-type çözümü, dosya eleme, atlandı mesajı, sabitler |
| `src/app/features/provider/boats/photo-uploader/photo-upload-rules.spec.ts` | Yukarıdakinin testleri |
| `src/app/features/provider/boats/photo-uploader/photo-uploader.ts` | Component sınıfı: girdiler, durum sinyalleri, yükleme/silme akışı |
| `src/app/features/provider/boats/photo-uploader/photo-uploader.html` | Izgara, ekle alanı, kutucuklar, iskeletler |
| `src/app/features/provider/boats/photo-uploader/photo-uploader.spec.ts` | Component testleri |

Kural dosyasının ayrılma sebebi: eleme mantığı DOM'suz test edilebilir ve component dosyası yalnızca akışa odaklanır.

---

### Task 1: Dosya eleme kuralları

**Files:**
- Create: `src/app/features/provider/boats/photo-uploader/photo-upload-rules.ts`
- Test: `src/app/features/provider/boats/photo-uploader/photo-upload-rules.spec.ts`

**Interfaces:**
- Consumes: yok.
- Produces:
  - `MAX_PHOTOS = 20`, `MAX_FILE_BYTES = 10 * 1024 * 1024`
  - `interface RejectedFile { name: string; reason: 'type' | 'size' | 'limit' }`
  - `interface FileSelection { accepted: File[]; rejected: RejectedFile[] }`
  - `resolveContentType(file: File): string`
  - `selectUploadableFiles(files: File[], existingCount: number): FileSelection`
  - `rejectionMessage(rejected: RejectedFile[]): string`

- [ ] **Step 1: Write the failing test**

`photo-upload-rules.spec.ts`:

```ts
import {
  MAX_FILE_BYTES,
  rejectionMessage,
  resolveContentType,
  selectUploadableFiles,
} from './photo-upload-rules';

function file(name: string, type: string, size = 1024): File {
  const f = new File(['x'], name, { type });
  // File.size içerikten geliyor; 10MB'lık gerçek içerik üretmemek için sabitliyoruz.
  Object.defineProperty(f, 'size', { value: size });
  return f;
}

describe('photo-upload-rules', () => {
  it('geçerli dosyaları kabul eder', () => {
    const { accepted, rejected } = selectUploadableFiles(
      [file('a.jpg', 'image/jpeg'), file('b.png', 'image/png')],
      0,
    );

    expect(accepted.map((f) => f.name)).toEqual(['a.jpg', 'b.png']);
    expect(rejected).toEqual([]);
  });

  it('desteklenmeyen tipi eler', () => {
    const { accepted, rejected } = selectUploadableFiles([file('a.pdf', 'application/pdf')], 0);

    expect(accepted).toEqual([]);
    expect(rejected).toEqual([{ name: 'a.pdf', reason: 'type' }]);
  });

  it('10MB üstünü eler', () => {
    const big = file('big.jpg', 'image/jpeg', MAX_FILE_BYTES + 1);

    const { accepted, rejected } = selectUploadableFiles([big], 0);

    expect(accepted).toEqual([]);
    expect(rejected).toEqual([{ name: 'big.jpg', reason: 'size' }]);
  });

  it('boş dosyayı eler', () => {
    const { rejected } = selectUploadableFiles([file('empty.jpg', 'image/jpeg', 0)], 0);

    expect(rejected).toEqual([{ name: 'empty.jpg', reason: 'size' }]);
  });

  it('20 sınırını aşan seçimi kırpar', () => {
    const files = Array.from({ length: 5 }, (_, i) => file(`p${i}.jpg`, 'image/jpeg'));

    const { accepted, rejected } = selectUploadableFiles(files, 18);

    expect(accepted.map((f) => f.name)).toEqual(['p0.jpg', 'p1.jpg']);
    expect(rejected).toEqual([
      { name: 'p2.jpg', reason: 'limit' },
      { name: 'p3.jpg', reason: 'limit' },
      { name: 'p4.jpg', reason: 'limit' },
    ]);
  });

  it('tarayıcı tip vermediğinde uzantıdan çözer', () => {
    expect(resolveContentType(file('foto.heic', ''))).toBe('image/heic');
    expect(resolveContentType(file('foto.HEIC', 'application/octet-stream'))).toBe('image/heic');
    expect(resolveContentType(file('foto.jpg', 'image/jpeg'))).toBe('image/jpeg');
    expect(resolveContentType(file('belge.pdf', ''))).toBe('');
  });

  it('uzantıdan çözülen heic dosyasını kabul eder', () => {
    const { accepted } = selectUploadableFiles([file('foto.heic', '')], 0);

    expect(accepted.map((f) => f.name)).toEqual(['foto.heic']);
  });

  it('atlanan dosyaları sebebiyle birlikte özetler', () => {
    const message = rejectionMessage([
      { name: 'a.pdf', reason: 'type' },
      { name: 'b.gif', reason: 'type' },
      { name: 'c.jpg', reason: 'size' },
      { name: 'd.jpg', reason: 'limit' },
    ]);

    expect(message).toBe(
      '2 dosya desteklenmeyen türde, 1 dosya 10MB üzeri, 1 dosya 20 fotoğraf sınırını aştığı için atlandı.',
    );
  });

  it('atlanan yoksa mesaj boştur', () => {
    expect(rejectionMessage([])).toBe('');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx ng test --include src/app/features/provider/boats/photo-uploader --watch=false`
Expected: FAIL — `photo-upload-rules` modülü bulunamıyor.

- [ ] **Step 3: Write minimal implementation**

`photo-upload-rules.ts`:

```ts
/**
 * Yükleme öncesi dosya elemesi.
 *
 * Backend doğrulaması toplu çalışıyor: tek geçersiz dosya isteğin tamamını
 * 400'e düşürüyor (`UploadBoatPhotosCommandValidator`). Bu yüzden eleme
 * gönderimden önce burada yapılır — sınırlar backend'dekilerle birebir.
 */

export const MAX_PHOTOS = 20;
export const MAX_FILE_BYTES = 10 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/heic',
  'image/heif',
]);

/** Uzantı → tip. Backend `ImageContentTypes.ByExtension` ile aynı liste. */
const TYPE_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  avif: 'image/avif',
  heic: 'image/heic',
  heif: 'image/heif',
};

export interface RejectedFile {
  name: string;
  reason: 'type' | 'size' | 'limit';
}

export interface FileSelection {
  accepted: File[];
  rejected: RejectedFile[];
}

/**
 * Dosyanın gerçek tipi. Tarayıcı HEIC/HEIF için boş veya genel bir tip
 * gönderebiliyor; o durumda uzantıdan çözülür. Çözülemezse boş string.
 */
export function resolveContentType(file: File): string {
  const type = file.type.toLowerCase();
  if (type && type !== 'application/octet-stream') return type;

  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  return TYPE_BY_EXTENSION[extension] ?? '';
}

/**
 * Gönderilecek dosyaları ayıklar. `existingCount` mevcut fotoğraf sayısı
 * (uçmakta olan yüklemeler dahil) — kalan kontenjan buradan hesaplanır.
 * Sıra korunur: kontenjan dolduğunda geri kalanlar `limit` ile elenir.
 */
export function selectUploadableFiles(files: File[], existingCount: number): FileSelection {
  const accepted: File[] = [];
  const rejected: RejectedFile[] = [];
  let remaining = Math.max(0, MAX_PHOTOS - existingCount);

  for (const file of files) {
    if (!ALLOWED_TYPES.has(resolveContentType(file))) {
      rejected.push({ name: file.name, reason: 'type' });
      continue;
    }
    if (file.size <= 0 || file.size > MAX_FILE_BYTES) {
      rejected.push({ name: file.name, reason: 'size' });
      continue;
    }
    if (remaining === 0) {
      rejected.push({ name: file.name, reason: 'limit' });
      continue;
    }
    accepted.push(file);
    remaining--;
  }

  return { accepted, rejected };
}

/** Kullanıcıya gösterilen özet; atlanan yoksa boş string. */
export function rejectionMessage(rejected: RejectedFile[]): string {
  if (rejected.length === 0) return '';

  const parts: string[] = [];
  const count = (reason: RejectedFile['reason']) =>
    rejected.filter((r) => r.reason === reason).length;

  if (count('type')) parts.push(`${count('type')} dosya desteklenmeyen türde`);
  if (count('size')) parts.push(`${count('size')} dosya 10MB üzeri`);
  if (count('limit')) parts.push(`${count('limit')} dosya ${MAX_PHOTOS} fotoğraf sınırını aştığı`);

  return `${parts.join(', ')} için atlandı.`;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx ng test --include src/app/features/provider/boats/photo-uploader --watch=false`
Expected: PASS (9 test).

- [ ] **Step 5: Commit**

```bash
git add src/app/features/provider/boats/photo-uploader
git commit -F - <<'EOF'
Add client-side file rules for boat photo upload

Backend doğrulaması toplu: tek geçersiz dosya isteğin tamamını düşürüyor.
Tip, boyut ve 20 sınırı bu yüzden gönderimden önce eleniyor; tarayıcı HEIC
için tip vermediğinde uzantıdan çözülüyor.
EOF
```

---

### Task 2: Component iskeleti ve ızgara

**Files:**
- Create: `src/app/features/provider/boats/photo-uploader/photo-uploader.ts`
- Create: `src/app/features/provider/boats/photo-uploader/photo-uploader.html`
- Test: `src/app/features/provider/boats/photo-uploader/photo-uploader.spec.ts`

**Interfaces:**
- Consumes: `MAX_PHOTOS` (Task 1); `BoatPhotoOutputModel` (`@models`); `PhotoUrlService`, `BoatPhotoService` (`@services`).
- Produces:
  - `class PhotoUploader` — `boatId = input.required<number>()`, `photos = input.required<BoatPhotoOutputModel[]>()`, `photosChanged = output<BoatPhotoOutputModel[]>()`
  - `visible = computed<BoatPhotoOutputModel[]>()` — önce `isMain`, sonra `sortOrder`
  - `full = computed<boolean>()` — kontenjan doldu mu

- [ ] **Step 1: Write the failing test**

`photo-uploader.spec.ts`:

```ts
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BoatPhotoOutputModel } from '@models';
import { MAX_PHOTOS } from './photo-upload-rules';
import { PhotoUploader } from './photo-uploader';

function photo(id: number, sortOrder: number, isMain = false): BoatPhotoOutputModel {
  return { id, objectKey: `boat-image/${id}.jpg`, isMain, sortOrder };
}

describe('PhotoUploader', () => {
  let fixture: ComponentFixture<PhotoUploader>;
  let component: PhotoUploader;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);

    fixture = TestBed.createComponent(PhotoUploader);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('boatId', 7);
    fixture.componentRef.setInput('photos', []);
    fixture.detectChanges();
  });

  afterEach(() => http.verify());

  function setPhotos(photos: BoatPhotoOutputModel[]): void {
    fixture.componentRef.setInput('photos', photos);
    fixture.detectChanges();
  }

  it('fotoğrafları ana fotoğraf başta olacak şekilde sıralar', () => {
    setPhotos([photo(1, 1), photo(2, 2, true), photo(3, 0)]);

    expect(component.visible().map((p) => p.id)).toEqual([2, 3, 1]);
  });

  it('her fotoğraf için bir kutucuk çizer', () => {
    setPhotos([photo(1, 0, true), photo(2, 1)]);

    expect(fixture.nativeElement.querySelectorAll('img').length).toBe(2);
  });

  it('kapak rozetini yalnızca ilk kutucukta gösterir', () => {
    setPhotos([photo(1, 0, true), photo(2, 1)]);

    const badges = fixture.nativeElement.querySelectorAll('[data-testid="cover-badge"]');
    expect(badges.length).toBe(1);
  });

  it('fotoğraf yokken yalnızca ekle alanı görünür', () => {
    expect(fixture.nativeElement.querySelectorAll('img').length).toBe(0);
    expect(fixture.nativeElement.querySelector('input[type="file"]')).not.toBeNull();
  });

  it('sınıra ulaşınca dosya seçiciyi gizler', () => {
    setPhotos(Array.from({ length: MAX_PHOTOS }, (_, i) => photo(i + 1, i)));

    expect(component.full()).toBe(true);
    expect(fixture.nativeElement.querySelector('input[type="file"]')).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx ng test --include src/app/features/provider/boats/photo-uploader --watch=false`
Expected: FAIL — `./photo-uploader` bulunamıyor.

- [ ] **Step 3: Write minimal implementation**

`photo-uploader.ts` (yükleme/silme Task 3–4'te dolacak):

```ts
import { Component, computed, inject, input, output, signal } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideImagePlus, lucideTrash2 } from '@ng-icons/lucide';
import { HlmButton } from '@ui/button';
import { BoatPhotoOutputModel } from '@models';
import { BoatPhotoService, PhotoUrlService } from '@services';
import { MAX_PHOTOS } from './photo-upload-rules';

/**
 * Tekne fotoğrafı yükleme ve silme.
 *
 * Veri çekmez, kalıcı liste tutmaz: gösterdiği şey `photos()` girdisidir ve
 * her başarılı işlemden sonra tam listeyi `photosChanged` ile bildirir —
 * listeyi tazelemek host'un işidir. Böylece gerçek listenin sahibi tektir.
 */
@Component({
  selector: 'app-photo-uploader',
  imports: [NgIcon, HlmButton],
  providers: [provideIcons({ lucideImagePlus, lucideTrash2 })],
  templateUrl: './photo-uploader.html',
})
export class PhotoUploader {
  photoService = inject(BoatPhotoService);
  photoUrl = inject(PhotoUrlService);

  boatId = input.required<number>();
  photos = input.required<BoatPhotoOutputModel[]>();

  /** Her başarılı yükleme/silme sonrası fotoğrafların tam listesi. */
  photosChanged = output<BoatPhotoOutputModel[]>();

  /** Uçmakta olan yüklemenin dosya sayısı — iskelet kutucuklar bundan çizilir. */
  uploadingCount = signal(0);
  deletingId = signal<number | null>(null);
  skippedMessage = signal('');

  /** Sıra `PhotoGallery` ile aynı ölçütte: iki ekran aynı fotoğrafı kapak saysın. */
  visible = computed(() =>
    [...this.photos()].sort((a, b) => {
      if (a.isMain !== b.isMain) return a.isMain ? -1 : 1;
      return a.sortOrder - b.sortOrder;
    }),
  );

  full = computed(() => this.photos().length + this.uploadingCount() >= MAX_PHOTOS);

  /** İskelet kutucukları `@for` ile çizebilmek için sayıyı diziye açar. */
  skeletons = computed(() => Array.from({ length: this.uploadingCount() }, (_, i) => i));
}
```

`photo-uploader.html`:

```html
<div>
  <!-- Mobile-first: telefonda iki sütun, ekranla birlikte genişliyor. -->
  <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
    @if (!full()) {
      <!-- Gizli input bir label ile sarılı: telefonda tek dokunuşla galeri açılır. -->
      <label
        class="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-input text-muted-foreground hover:bg-muted/50"
      >
        <ng-icon name="lucideImagePlus" size="24" />
        <span class="text-sm">Fotoğraf ekle</span>
        <input type="file" accept="image/*" multiple class="sr-only" />
      </label>
    }

    @for (photo of visible(); track photo.id; let i = $index) {
      <div class="relative aspect-square overflow-hidden rounded-lg bg-muted">
        <img
          [src]="photoUrl.url(photo.objectKey)"
          alt=""
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
        >
          <ng-icon name="lucideTrash2" size="16" />
          <span class="sr-only">Fotoğrafı sil</span>
        </button>
      </div>
    }

    @for (skeleton of skeletons(); track skeleton) {
      <div class="aspect-square animate-pulse rounded-lg bg-muted"></div>
    }
  </div>

  @if (skippedMessage()) {
    <p class="mt-3 text-sm text-muted-foreground">{{ skippedMessage() }}</p>
  }
</div>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx ng test --include src/app/features/provider/boats/photo-uploader --watch=false`
Expected: PASS (14 test — Task 1'in 9'u dahil).

- [ ] **Step 5: Commit**

```bash
git add src/app/features/provider/boats/photo-uploader
git commit -F - <<'EOF'
Add the photo uploader grid

Component veri çekmiyor: gösterdiği liste photos() girdisi. Izgara
mobile-first, sil düğmesi hover'a bağlı değil.
EOF
```

---

### Task 3: Yükleme akışı

**Files:**
- Modify: `src/app/features/provider/boats/photo-uploader/photo-uploader.ts`
- Modify: `src/app/features/provider/boats/photo-uploader/photo-uploader.html`
- Test: `src/app/features/provider/boats/photo-uploader/photo-uploader.spec.ts`

**Interfaces:**
- Consumes: `selectUploadableFiles`, `rejectionMessage` (Task 1); `BoatPhotoService.upload(boatId, files)` — `Observable<BoatPhotoOutputModel[]>`.
- Produces: `upload(files: File[]): void`, `onFileInput(input: HTMLInputElement): void`, `onDrop(event: DragEvent): void`, `dragging = signal<boolean>(false)`.

- [ ] **Step 1: Write the failing test**

`photo-uploader.spec.ts` içine ekle (mevcut `photo` yardımcısının altına `imageFile`, `describe` içine testler):

```ts
function imageFile(name = 'a.jpg', type = 'image/jpeg', size = 1024): File {
  const f = new File(['x'], name, { type });
  Object.defineProperty(f, 'size', { value: size });
  return f;
}
```

```ts
  it('seçilen dosyaları files alanıyla multipart olarak gönderir', () => {
    component.upload([imageFile('a.jpg'), imageFile('b.png', 'image/png')]);

    const request = http.expectOne('/api/Boats/7/photos');
    expect(request.request.method).toBe('POST');
    const body = request.request.body as FormData;
    expect(body).toBeInstanceOf(FormData);
    expect(body.getAll('files').length).toBe(2);
    // Content-Type elle yazılmamalı: boundary'yi tarayıcı üretir.
    expect(request.request.headers.has('Content-Type')).toBe(false);

    request.flush([]);
  });

  it('yükleme sürerken dosya sayısı kadar iskelet gösterir', () => {
    component.upload([imageFile('a.jpg'), imageFile('b.jpg')]);
    fixture.detectChanges();

    expect(component.uploadingCount()).toBe(2);
    expect(fixture.nativeElement.querySelectorAll('.animate-pulse').length).toBe(2);

    http.expectOne('/api/Boats/7/photos').flush([]);
  });

  it('yanıt gelince mevcut ve yeni fotoğrafları birlikte emit eder', () => {
    setPhotos([photo(1, 0, true)]);
    const emitted: BoatPhotoOutputModel[][] = [];
    component.photosChanged.subscribe((list) => emitted.push(list));

    component.upload([imageFile()]);
    http.expectOne('/api/Boats/7/photos').flush([photo(2, 1)]);
    fixture.detectChanges();

    expect(emitted).toEqual([[photo(1, 0, true), photo(2, 1)]]);
    expect(component.uploadingCount()).toBe(0);
  });

  it('geçersiz dosyayı göndermez, geçerliyi gönderir ve atlananı yazar', () => {
    component.upload([imageFile('belge.pdf', 'application/pdf'), imageFile('a.jpg')]);
    fixture.detectChanges();

    const body = http.expectOne('/api/Boats/7/photos').request.body as FormData;
    expect((body.getAll('files')[0] as File).name).toBe('a.jpg');
    expect(body.getAll('files').length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain('1 dosya desteklenmeyen türde');

    http.expectOne('/api/Boats/7/photos').flush([]);
  });

  it('geçerli dosya kalmazsa istek açmaz', () => {
    component.upload([imageFile('belge.pdf', 'application/pdf')]);
    fixture.detectChanges();

    http.expectNone('/api/Boats/7/photos');
    expect(component.uploadingCount()).toBe(0);
    expect(fixture.nativeElement.textContent).toContain('1 dosya desteklenmeyen türde');
  });

  it('sınırı aşan seçimi kırparak gönderir', () => {
    setPhotos(Array.from({ length: MAX_PHOTOS - 1 }, (_, i) => photo(i + 1, i)));

    component.upload([imageFile('a.jpg'), imageFile('b.jpg'), imageFile('c.jpg')]);
    fixture.detectChanges();

    const body = http.expectOne('/api/Boats/7/photos').request.body as FormData;
    expect(body.getAll('files').length).toBe(1);
    expect(fixture.nativeElement.textContent).toContain(`2 dosya ${MAX_PHOTOS} fotoğraf sınırını`);

    http.expectOne('/api/Boats/7/photos').flush([]);
  });
```

> Not: `http.expectOne(...)` isteği kuyruktan düşürür; testlerde `flush` edilmemiş istek kalırsa `afterEach`'teki `http.verify()` patlar.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx ng test --include src/app/features/provider/boats/photo-uploader --watch=false`
Expected: FAIL — `component.upload is not a function`.

- [ ] **Step 3: Write minimal implementation**

`photo-uploader.ts` — importlara ekle:

```ts
import { MAX_PHOTOS, rejectionMessage, selectUploadableFiles } from './photo-upload-rules';
```

Sınıfa ekle:

```ts
  /** Sürükle-bırak vurgusu — masaüstünde ek yetenek, mobilde hiç tetiklenmez. */
  dragging = signal(false);

  /**
   * Dosya seçilir seçilmez yükler; ayrı bir "Yükle" düğmesi yok. Girdi
   * sıfırlanıyor ki aynı dosya art arda seçildiğinde `change` yine tetiklensin.
   */
  onFileInput(input: HTMLInputElement): void {
    const files = Array.from(input.files ?? []);
    input.value = '';
    this.upload(files);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragging.set(false);
    if (this.full()) return;
    this.upload(Array.from(event.dataTransfer?.files ?? []));
  }

  upload(files: File[]): void {
    if (files.length === 0) return;

    const pending = this.photos().length + this.uploadingCount();
    const { accepted, rejected } = selectUploadableFiles(files, pending);
    this.skippedMessage.set(rejectionMessage(rejected));
    if (accepted.length === 0) return;

    this.uploadingCount.update((n) => n + accepted.length);
    this.photoService.upload(this.boatId(), accepted).subscribe({
      next: (created) => {
        this.uploadingCount.update((n) => n - accepted.length);
        this.photosChanged.emit([...this.photos(), ...created]);
      },
      // Hata mesajını errorInterceptor gösteriyor; buradaki tek iş iskeletleri
      // kaldırmak, aksi hâlde ızgarada takılı kalırlar.
      error: () => this.uploadingCount.update((n) => n - accepted.length),
    });
  }
```

`photo-uploader.html` — label'ı sürükle-bırak ve `change` ile bağla:

```html
      <label
        class="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-muted-foreground hover:bg-muted/50"
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
          #fileInput
          (change)="onFileInput(fileInput)"
        />
      </label>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx ng test --include src/app/features/provider/boats/photo-uploader --watch=false`
Expected: PASS (20 test).

- [ ] **Step 5: Commit**

```bash
git add src/app/features/provider/boats/photo-uploader
git commit -F - <<'EOF'
Upload boat photos as soon as they are picked

Ayrı bir Yükle düğmesi yok: mobilde fazladan dokunuş istenmiyor, yanlış
seçilen fotoğraf zaten silinebiliyor. Elenen dosyalar ızgaranın altında
özetleniyor.
EOF
```

---

### Task 4: Silme akışı

**Files:**
- Modify: `src/app/features/provider/boats/photo-uploader/photo-uploader.ts`
- Modify: `src/app/features/provider/boats/photo-uploader/photo-uploader.html`
- Test: `src/app/features/provider/boats/photo-uploader/photo-uploader.spec.ts`

**Interfaces:**
- Consumes: `BoatPhotoService.delete(boatId, photoId)` — `Observable<boolean>`.
- Produces: `remove(photo: BoatPhotoOutputModel): void`.

- [ ] **Step 1: Write the failing test**

```ts
  it('sil düğmesi fotoğrafı doğru uca gönderir', () => {
    setPhotos([photo(1, 0, true), photo(2, 1)]);

    fixture.nativeElement.querySelectorAll('button')[0].click();

    const request = http.expectOne('/api/Boats/7/photos/1');
    expect(request.request.method).toBe('DELETE');
    request.flush(true);
  });

  it('silme başarılıysa o fotoğrafsız listeyi emit eder', () => {
    setPhotos([photo(1, 0, true), photo(2, 1)]);
    const emitted: BoatPhotoOutputModel[][] = [];
    component.photosChanged.subscribe((list) => emitted.push(list));

    component.remove(photo(1, 0, true));
    http.expectOne('/api/Boats/7/photos/1').flush(true);

    expect(emitted).toEqual([[photo(2, 1)]]);
    expect(component.deletingId()).toBeNull();
  });

  it('silme sürerken ikinci silme isteği açmaz', () => {
    setPhotos([photo(1, 0, true), photo(2, 1)]);

    component.remove(photo(1, 0, true));
    component.remove(photo(2, 1));

    http.expectOne('/api/Boats/7/photos/1').flush(true);
    http.expectNone('/api/Boats/7/photos/2');
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx ng test --include src/app/features/provider/boats/photo-uploader --watch=false`
Expected: FAIL — `component.remove is not a function`.

- [ ] **Step 3: Write minimal implementation**

`photo-uploader.ts` sınıfına ekle:

```ts
  /**
   * Tek seferde tek silme: art arda dokunuşta ikinci istek açılmaz, aksi
   * hâlde iki yanıt birbirinin listesini ezerdi (`photos()` ikisi için de eski).
   */
  remove(photo: BoatPhotoOutputModel): void {
    if (this.deletingId() !== null) return;

    this.deletingId.set(photo.id);
    this.photoService.delete(this.boatId(), photo.id).subscribe({
      next: () => {
        this.deletingId.set(null);
        this.photosChanged.emit(this.photos().filter((p) => p.id !== photo.id));
      },
      error: () => this.deletingId.set(null),
    });
  }
```

`photo-uploader.html` — sil düğmesini bağla ve meşgul hâlini göster:

```html
        <button
          hlmBtn
          variant="secondary"
          size="icon-sm"
          type="button"
          class="absolute end-2 top-2 rounded-full"
          [disabled]="deletingId() !== null"
          (click)="remove(photo)"
        >
          <ng-icon name="lucideTrash2" size="16" />
          <span class="sr-only">Fotoğrafı sil</span>
        </button>
```

Kutucuğun kapsayıcısına meşgul sönükleşmesi:

```html
      <div
        class="relative aspect-square overflow-hidden rounded-lg bg-muted"
        [class]="deletingId() === photo.id ? 'opacity-50' : ''"
      >
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx ng test --include src/app/features/provider/boats/photo-uploader --watch=false`
Expected: PASS (23 test).

- [ ] **Step 5: Commit**

```bash
git add src/app/features/provider/boats/photo-uploader
git commit -F - <<'EOF'
Delete boat photos from the uploader grid

Tek seferde tek silme: art arda dokunuşta ikinci istek açılmıyor, iki
yanıtın birbirinin listesini ezmesi engelleniyor.
EOF
```

---

### Task 5: Hata dallarının doğrulanması

**Files:**
- Test: `src/app/features/provider/boats/photo-uploader/photo-uploader.spec.ts`
- Modify (gerekirse): `src/app/features/provider/boats/photo-uploader/photo-uploader.ts`

**Interfaces:**
- Consumes: Task 3 ve 4'ün `error` dalları.
- Produces: yok — davranışı kilitleyen testler.

- [ ] **Step 1: Write the failing test**

```ts
  it('yükleme hatasında iskeletleri temizler ve emit etmez', () => {
    const emitted: BoatPhotoOutputModel[][] = [];
    component.photosChanged.subscribe((list) => emitted.push(list));

    component.upload([imageFile()]);
    http
      .expectOne('/api/Boats/7/photos')
      .flush({ message: 'Geçersiz görsel tipi.' }, { status: 400, statusText: 'Bad Request' });
    fixture.detectChanges();

    expect(component.uploadingCount()).toBe(0);
    expect(fixture.nativeElement.querySelectorAll('.animate-pulse').length).toBe(0);
    expect(emitted).toEqual([]);
  });

  it('silme hatasında kutucuğu serbest bırakır ve emit etmez', () => {
    setPhotos([photo(1, 0, true)]);
    const emitted: BoatPhotoOutputModel[][] = [];
    component.photosChanged.subscribe((list) => emitted.push(list));

    component.remove(photo(1, 0, true));
    http
      .expectOne('/api/Boats/7/photos/1')
      .flush({ message: 'Fotoğraf bulunamadı.' }, { status: 404, statusText: 'Not Found' });

    expect(component.deletingId()).toBeNull();
    expect(emitted).toEqual([]);
  });

  it('hata sonrası yeniden yüklemeye izin verir', () => {
    component.upload([imageFile()]);
    http.expectOne('/api/Boats/7/photos').flush(null, { status: 500, statusText: 'Server Error' });

    component.upload([imageFile('b.jpg')]);
    http.expectOne('/api/Boats/7/photos').flush([photo(9, 0)]);

    expect(component.uploadingCount()).toBe(0);
  });
```

- [ ] **Step 2: Run test to verify it fails or passes**

Run: `npx ng test --include src/app/features/provider/boats/photo-uploader --watch=false`
Beklenen: Task 3–4'teki `error` dalları doğru yazıldıysa **PASS**. FAIL alırsan `error` dalı durum temizliğini yapmıyordur — düzelt, mesajı yakalayıp yutma (`errorInterceptor` gösteriyor).

- [ ] **Step 3: Tüm projeyi doğrula**

Run: `npx ng test --watch=false` → tüm suite geçmeli.
Run: `npx tsc -p tsconfig.json --noEmit` → çıktı boş olmalı.

- [ ] **Step 4: Commit**

```bash
git add src/app/features/provider/boats/photo-uploader
git commit -F - <<'EOF'
Cover the uploader error paths with tests

Hata mesajını errorInterceptor gösteriyor; component yalnızca geçici
durumu temizliyor ve photosChanged emit etmiyor.
EOF
```

---

## Plan dışı (bilinçli)

- Sürükle-bırak ile **sıralama** (`reorder`) — ayrı tur.
- Component'in bir sayfaya **bağlanması** — kararı verilmedi.
- `BoatService.getById` — component veri çekmediği için gerekmiyor.
- Backend'de `IsMain` kolonunun kaldırılması — ayrı tartışma.
