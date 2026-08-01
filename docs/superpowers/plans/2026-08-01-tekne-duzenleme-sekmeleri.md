# Tekne düzenleme sekmeleri — uygulama planı

> **Ajan işçiler için:** GEREKLİ ALT BECERİ: bu planı görev görev uygulamak
> için `superpowers:subagent-driven-development` (önerilen) ya da
> `superpowers:executing-plans` kullan. Adımlar `- [ ]` kutucuklarıyla
> izlenir.

**Hedef:** Partner'ın kayıtlı bir teknesini tek sayfadan yönettiği, dört
sekmeli düzenleme ekranı: Genel · Fotoğraflar · Şartlar · İmkanlar.

**Yaklaşım:** `teknelerim/:boatId/duzenle` adresinde `BoatEdit` kapsayıcısı
tekneyi başlık için yükler ve spartan `hlm-tabs` şeridini çizer; aktif sekme
`?sekme=` query param'ında tutulur. Her sekme kendi verisini kendi çeker.
Mevcut `BoatForm` bir `screenOpenType` girdisiyle hem oluşturma hem
güncelleme yapar hâle gelir; bugünkü ayrı fotoğraf sayfası bir sekmeye iner.

**Teknoloji:** Angular 22 (signals, Signal Forms, `rxResource`,
`linkedSignal`), spartan/ui Helm tabs (`@ui/tabs`), Tailwind v4.

**Tasarım belgesi:** [2026-08-01-tekne-duzenleme-sekmeleri-design.md](../specs/2026-08-01-tekne-duzenleme-sekmeleri-design.md)

## Global kısıtlar

Her görevin gereksinimleri bunları da içerir:

- **Yeni test yazılmaz.** Proje kararı (bkz. spec "Kapsam"). Bu plan bu
  yüzden TDD döngüsü içermiyor; her görevin doğrulaması derleme + mevcut
  testlerin yeşil kalması + tarayıcıda elle kontrol.
- **Mevcut test paketi yeşil kalmalı.** `npm test -- --watch=false`.
  **Bilinen kırık test:** `dashboard-shell.spec.ts` bu iş başlamadan önce de
  kırıktı (`expected 'Genel BakışTeknelerim' to contain 'Test Panel'`). Bu
  plan onu düzeltmez; "yeşil" derken kastedilen **90 geçen + o 1 kırık**.
  Sayı artarsa senin değişikliğin kırmıştır.
- **Angular 22 konvansiyonları:** `standalone`/`OnPush` yazma, erişim
  belirteci (`private`/`readonly`) yazma, `inject()` kullan, `@if`/`@for`
  kullan, servislerde `@Service()`.
- **Mobile-first:** taban sınıflar mobil düzeni tarif eder, `sm:`/`lg:`
  yalnızca büyütme yönünde. Dokunma hedefleri en az 40px (`h-10`).
- **Beklenen HTTP hataları için try/catch yazma** — mesajı
  `errorInterceptor` gösterir.
- **Interface/model tanımı bileşen dosyasında olmaz** — `core/models/`.
- **URL parçaları string literal olmaz** — `core/routes.const.ts`.
- Türkçe kullanıcı metni, Türkçe kod yorumu (mevcut dosyalarla tutarlı).

---

### Task 1: `FormMode` enum'u ve `BoatService.update`

Yaprak değişiklikler; sonraki her görev bunlara dayanıyor.

**Dosyalar:**
- Oluştur: `src/app/core/enums/form-mode.ts`
- Değiştir: `src/app/core/enums/index.ts`
- Değiştir: `src/app/core/services/boat.service.ts`

**Arayüzler:**
- Üretir: `FormMode.Create` / `FormMode.Update` (`@enums` üzerinden),
  `BoatService.update(id: number, model: BoatInputModel): Observable<void>`

- [ ] **Adım 1: Enum dosyasını oluştur**

`src/app/core/enums/form-mode.ts`:

```ts
/**
 * Bir formun hangi amaçla açıldığı.
 *
 * Klasördeki diğer enum'lardan farklı olarak **backend karşılığı yok** —
 * yalnızca arayüz davranışını seçer (`BoatForm` hem oluşturma hem
 * güncelleme yapıyor).
 */
export enum FormMode {
  Create = 'Create',
  Update = 'Update',
}
```

- [ ] **Adım 2: Barrel'a ekle**

`src/app/core/enums/index.ts` içindeki export listesine, alfabetik sırayı
bozmadan (`boat-type`'tan sonra) ekle:

```ts
export * from './form-mode';
```

- [ ] **Adım 3: Servise `update` ekle**

`src/app/core/services/boat.service.ts` içinde `create`'in hemen altına:

```ts
  /**
   * Partner kendi teknesini günceller — yalnızca `Partner` rolü.
   *
   * Uç henüz backend'de yok (2026-08-01); eklendiğinde çalışacak şekilde
   * `create` ile aynı gövde şeması varsayılıyor.
   */
  update(id: number, model: BoatInputModel): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, model);
  }
```

- [ ] **Adım 4: Derlemeyi doğrula**

Çalıştır: `npx ng build --configuration development`
Beklenen: hatasız tamamlanır.

- [ ] **Adım 5: Commit**

```bash
git add src/app/core/enums/form-mode.ts src/app/core/enums/index.ts src/app/core/services/boat.service.ts
git commit -m "Add a FormMode enum and the boat update endpoint call"
```

---

### Task 2: Placeholder sekmeler — Şartlar ve İmkanlar

Veri çekmeyen iki bileşen. Backend uçları geldiğinde içleri dolacak.

**Dosyalar:**
- Oluştur: `src/app/features/provider/boats/boat-terms/boat-terms.ts`
- Oluştur: `src/app/features/provider/boats/boat-terms/boat-terms.html`
- Oluştur: `src/app/features/provider/boats/boat-amenities/boat-amenities.ts`
- Oluştur: `src/app/features/provider/boats/boat-amenities/boat-amenities.html`

**Arayüzler:**
- Üretir: `BoatTerms` (`<app-boat-terms />`), `BoatAmenities`
  (`<app-boat-amenities />`). İkisi de girdi almaz, çıktı vermez.

- [ ] **Adım 1: `BoatTerms` bileşenini oluştur**

`boat-terms.ts`:

```ts
import { Component } from '@angular/core';

/**
 * Düzenleme sayfasının "Şartlar" sekmesi.
 *
 * Backend'de kullanım şartları ucu henüz yok (2026-08-01); bu tur yalnızca
 * sekmenin yerini açıyor.
 */
@Component({
  selector: 'app-boat-terms',
  templateUrl: './boat-terms.html',
})
export class BoatTerms {}
```

`boat-terms.html` — kutu deseni `my-boats.html`'deki boş durum kutusuyla
aynı:

```html
<div class="rounded-lg border border-dashed border-input p-10 text-center">
  <p class="font-medium">Kullanım şartları</p>
  <p class="mt-1 text-sm text-muted-foreground">Bu bölüm yakında eklenecek.</p>
</div>
```

- [ ] **Adım 2: `BoatAmenities` bileşenini oluştur**

`boat-amenities.ts`:

```ts
import { Component } from '@angular/core';

/**
 * Düzenleme sayfasının "İmkanlar" sekmesi.
 *
 * Backend'de imkanlar ucu henüz yok (2026-08-01); bu tur yalnızca sekmenin
 * yerini açıyor.
 */
@Component({
  selector: 'app-boat-amenities',
  templateUrl: './boat-amenities.html',
})
export class BoatAmenities {}
```

`boat-amenities.html`:

```html
<div class="rounded-lg border border-dashed border-input p-10 text-center">
  <p class="font-medium">İmkanlar</p>
  <p class="mt-1 text-sm text-muted-foreground">Bu bölüm yakında eklenecek.</p>
</div>
```

- [ ] **Adım 3: Derlemeyi doğrula**

Çalıştır: `npx ng build --configuration development`
Beklenen: hatasız tamamlanır. (Bileşenler henüz hiçbir yerden import
edilmiyor — bu normal, Task 4'te bağlanacaklar.)

- [ ] **Adım 4: Commit**

```bash
git add src/app/features/provider/boats/boat-terms src/app/features/provider/boats/boat-amenities
git commit -m "Add placeholder tabs for boat terms and amenities"
```

---

### Task 3: `BoatForm` hem oluşturma hem güncelleme yapsın

Form gövdesi (~195 satır) iki modda birebir aynı kalır; yalnızca doldurma,
kaydetme ve şablondaki üç nokta moda göre dallanır.

**Dosyalar:**
- Oluştur: `src/app/core/util/boat-form-model.ts`
- Değiştir: `src/app/features/provider/boats/boat-form/boat-form.ts`
- Değiştir: `src/app/features/provider/boats/boat-form/boat-form.html:1-4,200-205`

**Arayüzler:**
- Kullanır: `FormMode` (Task 1), `BoatService.update` (Task 1)
- Üretir: `BoatForm` girdisi `screenOpenType: FormMode` (varsayılan
  `FormMode.Create`) ve çıktısı `saved: void`. Kullanımı:
  `<app-boat-form [screenOpenType]="FormMode.Update" (saved)="…" />`
- Üretir: `emptyBoatForm(): BoatFormModel`,
  `toBoatFormModel(boat: BoatOutputModel): BoatFormModel`

- [ ] **Adım 1: Model çevirim yardımcılarını oluştur**

`src/app/core/util/boat-form-model.ts` — mevcut `core/util/boat-labels.ts`,
`boat-location.ts` kardeşlerinin yanına:

```ts
/**
 * `BoatOutputModel` ↔ `BoatFormModel` çevirimi.
 *
 * Form çalışma tipi sunucu tipinden ayrı: select/radio kontrolleri
 * değerlerini string tutar, doldurulmamış sayısal alanlar `null`'dır.
 */

import { BoatFormModel, BoatOutputModel } from '@models';

/** Formun boş başlangıç hâli — hiçbir alan doldurulmadı. */
export function emptyBoatForm(): BoatFormModel {
  return {
    name: '',
    boatType: '',
    rentalType: '',
    manufactureYear: null,
    lengthInMeters: null,
    diningCapacity: null,
    totalCapacity: null,
    swimmingCapacity: null,
    cityId: '',
    primaryHarborId: '',
    harborIds: [],
    description: '',
  };
}

/** Sunucudan gelen tekneyi formun çalışma tipine çevirir. */
export function toBoatFormModel(boat: BoatOutputModel): BoatFormModel {
  return {
    name: boat.name,
    boatType: boat.boatType,
    rentalType: boat.rentalType,
    manufactureYear: boat.manufactureYear ?? null,
    lengthInMeters: boat.lengthInMeters,
    diningCapacity: boat.diningCapacity,
    totalCapacity: boat.totalCapacity,
    swimmingCapacity: boat.swimmingCapacity,
    cityId: String(boat.cityId),
    primaryHarborId: String(boat.primaryHarborId),
    harborIds: [...boat.harborIds],
    description: boat.description ?? '',
  };
}
```

- [ ] **Adım 2: `boat-form.ts` — import'ları ve enjeksiyonları güncelle**

Dosyanın üst blokundaki import'ları şu hâle getir (yeni satırlar:
`linkedSignal`, `ActivatedRoute`, `rxResource`/`toSignal`, `map`,
`FormMode`, `ToastService`, çevirim yardımcıları):

```ts
import { Component, computed, effect, inject, input, linkedSignal, output } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
```

`signal` listeden çıktı — Adım 3'te `model` `linkedSignal`'a dönüyor ve
dosyada başka kullanımı yok.

Ayrıca:

```ts
import { FormMode } from '@enums';
import { BoatService, HarborService, ToastService } from '@services';
import { emptyBoatForm, toBoatFormModel } from '../../../../core/util/boat-form-model';
```

Sınıfın enjeksiyon bloğuna ekle:

```ts
  route = inject(ActivatedRoute);
  toast = inject(ToastService);
```

- [ ] **Adım 3: `boat-form.ts` — mod girdisi, veri yükleme ve `model`**

`cities = toSignal(...)` satırının **üstüne** ekle:

```ts
  /** Formun hangi amaçla açıldığı; sekme olarak kullanılırken Update verilir. */
  screenOpenType = input<FormMode>(FormMode.Create);

  /** Update'te kayıt başarılı olunca kapsayıcı başlığı tazelesin diye. */
  saved = output<void>();

  isUpdate = computed(() => this.screenOpenType() === FormMode.Update);

  /**
   * Route paramı input'a bağlanmıyor: `withComponentInputBinding` yalnızca
   * route'a bağlı bileşenlerde çalışır, bu bileşen düzenleme sayfasında
   * sekme olarak da kullanılıyor. Enjekte edilen route kapsayıcınınkine
   * çözülür, `:boatId` oradadır.
   */
  boatId = toSignal(this.route.paramMap.pipe(map((p) => p.get('boatId'))), {
    initialValue: null,
  });

  /** Create modunda `params` undefined kalır; resource hiç istek atmaz. */
  boatResource = rxResource({
    params: () => {
      const id = this.boatId();
      return this.isUpdate() && id ? Number(id) : undefined;
    },
    stream: ({ params }) => this.boatService.getById(params),
  });

  boat = computed(() => (this.boatResource.hasValue() ? this.boatResource.value() : null));
  loading = computed(() => this.isUpdate() && this.boatResource.isLoading());
  failed = computed(() => this.isUpdate() && this.boatResource.status() === 'error');
```

Sonra mevcut `model = signal<BoatFormModel>({ … })` bloğunun **tamamını**
şununla değiştir:

```ts
  /**
   * Formun çalışma kopyası. `linkedSignal`: Update'te yüklenen tekneden
   * türetilir, Create'te boş başlar; kullanıcı yazdıkça üzerine yazılır.
   */
  model = linkedSignal<BoatFormModel>(() => {
    const boat = this.boat();
    return boat ? toBoatFormModel(boat) : emptyBoatForm();
  });
```

`BoatFormModel` import'u `@models`'ten gelmeye devam ediyor; `BoatInputModel`
de öyle.

- [ ] **Adım 4: `boat-form.ts` — `save()` moda göre dallansın**

`save()` gövdesindeki `input` nesnesi kurulduktan **sonraki** kısmı
şununla değiştir (yorum bloğu korunuyor):

```ts
      // try/catch bilinçli yok: mesajı errorInterceptor gösterir; başarısızlıkta
      // navigate'e/emit'e ulaşılmaz, formda kalınır. Hatanın konsola/ErrorHandler'a
      // düşmesi kabul edilmiştir.
      if (this.isUpdate()) {
        await firstValueFrom(this.boatService.update(Number(this.boatId()), input));
        this.toast.success('Tekne bilgileri güncellendi.');
        this.saved.emit();
        return;
      }

      await firstValueFrom(this.boatService.create(input));
      await this.router.navigate(this.boatsUrl);
```

- [ ] **Adım 5: `boat-form.html` — başlığı, yükleme durumunu ve butonları koşulla**

Dosyanın **ilk 4 satırını** şununla değiştir (Update'te başlığı kapsayıcı
gösteriyor):

```html
@if (!isUpdate()) {
  <h1 class="text-2xl font-semibold">Yeni Tekne</h1>
  <p class="mt-2 text-sm text-muted-foreground">
    İlan bilgilerini girin; fotoğrafları kayıttan sonra ekleyebilirsiniz.
  </p>
}

@if (loading()) {
  <p class="text-sm text-muted-foreground">Tekne yükleniyor…</p>
} @else if (failed()) {
  <p class="text-sm text-destructive">Tekne yüklenemedi. Sayfayı yenileyip tekrar deneyin.</p>
} @else {
```

Dosyanın **en sonuna**, `</form>` satırının altına kapanış parantezini ekle:

```html
}
```

`novalidate` yorumu ve `<form>` etiketi olduğu gibi kalır — yalnızca artık
`@else` bloğunun içindeler.

- [ ] **Adım 6: `boat-form.html` — gönder butonu ve Vazgeç linki**

Dosyanın sonundaki aksiyon şeridini şununla değiştir:

```html
  <div class="mt-6 flex items-center gap-3">
    <button hlmBtn type="submit" [disabled]="boatForm().submitting()">
      @if (boatForm().submitting()) {
        Kaydediliyor…
      } @else if (isUpdate()) {
        Değişiklikleri kaydet
      } @else {
        Tekneyi kaydet
      }
    </button>
    @if (!isUpdate()) {
      <a hlmBtn variant="ghost" [routerLink]="boatsUrl">Vazgeç</a>
    }
  </div>
```

- [ ] **Adım 7: Derlemeyi ve mevcut testleri doğrula**

Çalıştır: `npx ng build --configuration development`
Beklenen: hatasız.

Çalıştır: `npm test -- --watch=false`
Beklenen: `Tests 1 failed | 90 passed (91)` — kırık olan yalnızca bilinen
`dashboard-shell.spec.ts`. `boat-form.spec.ts`'in 10 testi geçmeli:
varsayılan mod Create olduğu için ek HTTP isteği çıkmaz (`http.verify()`
temiz kalır) ve `model.set(...)` `linkedSignal` üzerinde çalışmaya devam
eder.

- [ ] **Adım 8: Tarayıcıda kontrol**

Çalıştır: `npm start`, `http://localhost:4200/partner/dashboard/teknelerim/yeni`
Beklenen: sayfa bugünkü gibi görünüyor — "Yeni Tekne" başlığı, "Tekneyi
kaydet" ve "Vazgeç" yerinde; kaydetme çalışıyor.

- [ ] **Adım 9: Commit**

```bash
git add src/app/core/util/boat-form-model.ts src/app/features/provider/boats/boat-form
git commit -m "Let the boat form handle both create and update"
```

---

### Task 4: `BoatEdit` kapsayıcısı, fotoğraf sekmesi ve route

Bu görevin parçaları ayrılamaz: kapsayıcı olmadan `BoatPhotos` sekmeye
inemez, route değişmeden kapsayıcıya ulaşılamaz.

**Dosyalar:**
- Değiştir: `src/app/core/routes.const.ts:37-48`
- Oluştur: `src/app/features/provider/boats/boat-edit/boat-edit.ts`
- Oluştur: `src/app/features/provider/boats/boat-edit/boat-edit.html`
- Değiştir: `src/app/features/provider/boats/boat-photos/boat-photos.ts`
- Değiştir: `src/app/features/provider/boats/boat-photos/boat-photos.html`
- Değiştir: `src/app/features/provider/provider.routes.ts:30-33`

**Arayüzler:**
- Kullanır: `FormMode` (Task 1), `BoatTerms`/`BoatAmenities` (Task 2),
  `BoatForm`'un `screenOpenType`/`saved` sözleşmesi (Task 3)
- Üretir: `BOAT_EDIT_TABS` (`routes.const.ts`), `ROUTE_PARTNER.boatEdit`,
  `BoatEdit` bileşeni

- [ ] **Adım 1: `routes.const.ts` — segment ve sekme slug'ları**

`ROUTE_PARTNER` içindeki `boatPhotos` satırını **sil** (artık URL segmenti
değil) ve yerine `boatNew`'ün altına ekle:

```ts
  /** `boats/:boatId` altına eklenir: `/partner/dashboard/teknelerim/5/duzenle`. */
  boatEdit: 'duzenle',
```

Dosyanın sonuna, `ROUTE_PARTNER` bloğunun altına ekle:

```ts
/**
 * Tekne düzenleme sayfasının sekmeleri — `?sekme=` query param'ının değeri.
 *
 * Segment değiller ama URL'de görünüyorlar ve iki yerde birden geçiyorlar
 * (`boat-edit` şablonu ve `my-boats` linki), bu yüzden burada.
 */
export const BOAT_EDIT_TABS = {
  general: 'genel',
  photos: 'fotograflar',
  terms: 'sartlar',
  amenities: 'imkanlar',
} as const;
```

- [ ] **Adım 2: `provider.routes.ts` — fotoğraf route'unu düzenlemeyle değiştir**

`boatPhotos` girdisini şununla değiştir (dosyadaki sırası korunur — düz
`ROUTE_PARTNER.boats` girdisinden önce kalmalı):

```ts
      {
        path: `${ROUTE_PARTNER.boats}/:boatId/${ROUTE_PARTNER.boatEdit}`,
        loadComponent: () => import('./boats/boat-edit/boat-edit').then((m) => m.BoatEdit),
      },
```

- [ ] **Adım 3: `boat-photos.ts` — sekmeye indir**

Dosyanın tamamını şununla değiştir:

```ts
import { Component, computed, inject, linkedSignal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { BoatService } from '@services';
import { PhotoUploader } from '../photo-uploader/photo-uploader';

/**
 * Düzenleme sayfasının "Fotoğraflar" sekmesi — `PhotoUploader`'ın host'u.
 *
 * Uploader veri çekmediği için tekneyi buradan yüklüyoruz; `photosChanged`
 * geldiğinde listeyi yeniden çekmek yerine `photos.set` ile yazıyoruz — refetch,
 * uploader'ın `photos()` girdisinin bayat kaldığı pencereyi bir gidiş-dönüş
 * boyunca açık tutardı.
 */
@Component({
  selector: 'app-boat-photos',
  imports: [PhotoUploader],
  templateUrl: './boat-photos.html',
})
export class BoatPhotos {
  route = inject(ActivatedRoute);
  boatService = inject(BoatService);

  /**
   * Sekme olduğu için route paramı input'a bağlanmıyor; kapsayıcının
   * route'undan okunur (`withComponentInputBinding` yalnızca route'a bağlı
   * bileşenlere işler).
   */
  boatId = toSignal(this.route.paramMap.pipe(map((p) => p.get('boatId'))), {
    initialValue: null,
  });

  boatResource = rxResource({
    params: () => {
      const id = this.boatId();
      return id ? Number(id) : undefined;
    },
    stream: ({ params }) => this.boatService.getById(params),
  });

  loading = computed(() => this.boatResource.isLoading());
  failed = computed(() => this.boatResource.status() === 'error');

  boat = computed(() => (this.boatResource.hasValue() ? this.boatResource.value() : null));

  /**
   * Uploader'a giden liste. `linkedSignal`: tekne yeniden yüklenirse sunucudan
   * gelen listeye döner, aradaki `photosChanged` emitleri ise `set` ile üzerine
   * yazılır — gerçek listenin sahibi bu sekmedir.
   */
  photos = linkedSignal(() => this.boat()?.photos ?? []);
}
```

- [ ] **Adım 4: `boat-photos.html` — başlığı ve geri linkini çıkar**

Dosyanın tamamını şununla değiştir (geri linki ve `<h1>` kapsayıcıya
taşındı):

```html
@if (loading()) {
  <p class="text-sm text-muted-foreground">Fotoğraflar yükleniyor…</p>
} @else if (failed() || !boat()) {
  <p class="text-sm text-destructive">
    Fotoğraflar yüklenemedi. Sayfayı yenileyip tekrar deneyin.
  </p>
} @else {
  <p class="text-sm text-muted-foreground">İlk sıradaki fotoğraf ilanın kapağıdır.</p>

  <app-photo-uploader
    class="mt-4 block"
    [boatId]="boat()!.id"
    [photos]="photos()"
    (photosChanged)="photos.set($event)"
  />
}
```

- [ ] **Adım 5: `boat-edit.ts` kapsayıcısını oluştur**

```ts
import { Component, computed, inject, input } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { HlmButton } from '@ui/button';
import { HlmTabsImports } from '@ui/tabs';
import { FormMode } from '@enums';
import { BoatService } from '@services';
import { BoatAmenities } from '../boat-amenities/boat-amenities';
import { BoatForm } from '../boat-form/boat-form';
import { BoatPhotos } from '../boat-photos/boat-photos';
import { BoatTerms } from '../boat-terms/boat-terms';
import { BOAT_EDIT_TABS, ROUTE_PARTNER } from '../../../../core/routes.const';

const TAB_SLUGS: string[] = Object.values(BOAT_EDIT_TABS);

/**
 * Tekne düzenleme sayfası — dört sekmenin kapsayıcısı.
 *
 * Tekneyi yalnızca **başlık için** yükler; her sekme kendi verisini kendi
 * çeker (tasarım kararı: sekmeler birbirinden ve kapsayıcıdan bağımsız).
 * Sekme içerikleri `hlmTabsContentLazy` ile ilk açılışa kadar render
 * edilmez, böylece girilmeyen sekme istek atmaz.
 */
@Component({
  selector: 'app-boat-edit',
  imports: [
    RouterLink,
    HlmButton,
    HlmTabsImports,
    BoatForm,
    BoatPhotos,
    BoatTerms,
    BoatAmenities,
  ],
  templateUrl: './boat-edit.html',
})
export class BoatEdit {
  router = inject(Router);
  route = inject(ActivatedRoute);
  boatService = inject(BoatService);

  /** Route paramı ve query paramı — ikisi de `withComponentInputBinding` ile gelir. */
  boatId = input.required<string>();
  sekme = input<string>(BOAT_EDIT_TABS.general);

  /** Şablonda `[screenOpenType]` ve `[hlmTabsTrigger]` için. */
  FormMode = FormMode;
  tabs = BOAT_EDIT_TABS;

  boatsUrl = ['/', ROUTE_PARTNER.main, ROUTE_PARTNER.dashboard, ROUTE_PARTNER.boats];

  /** Tanınmayan slug Genel'e düşer — elle yazılmış URL bozuk ekran üretmesin. */
  activeTab = computed(() =>
    TAB_SLUGS.includes(this.sekme()) ? this.sekme() : BOAT_EDIT_TABS.general,
  );

  boatResource = rxResource({
    params: () => Number(this.boatId()),
    stream: ({ params }) => this.boatService.getById(params),
  });

  loading = computed(() => this.boatResource.isLoading());
  failed = computed(() => this.boatResource.status() === 'error');

  boat = computed(() => (this.boatResource.hasValue() ? this.boatResource.value() : null));

  /**
   * `replaceUrl` bilinçli: sekme gezinmesi geçmişe yığılmaz, geri tuşu
   * kullanıcıyı teknelerim listesine döndürür.
   */
  onTabActivated(slug: string): void {
    if (slug === this.activeTab()) return;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { sekme: slug },
      replaceUrl: true,
    });
  }
}
```

- [ ] **Adım 6: `boat-edit.html` şablonunu oluştur**

```html
<a hlmBtn variant="ghost" size="sm" [routerLink]="boatsUrl">‹ Teknelerim</a>

@if (loading()) {
  <p class="mt-6 text-sm text-muted-foreground">Tekne yükleniyor…</p>
} @else if (failed() || !boat()) {
  <p class="mt-6 text-sm text-destructive">Tekne yüklenemedi. Sayfayı yenileyip tekrar deneyin.</p>
} @else {
  <h1 class="mt-2 text-2xl font-semibold">{{ boat()!.name }}</h1>

  <!--
    Tetikleyiciler tek tek yazılıyor, @for ile üretilmiyor:
    hlm-paginated-tabs-list onları contentChildren(..., {descendants: false})
    ile topluyor ve @for'un gömülü görünümleri bu aramada güvenilir eşleşmiyor.
    tabListClass: şeridin varsayılan yüksekliği h-8; dokunma hedefi için h-10
    (my-boats aksiyon butonlarıyla tutarlı). Aynı variant anahtarı kullanıldı
    ki tailwind-merge h-8'i gerçekten değiştirsin.
  -->
  <!--
    class'a display sınıfı YAZMA: HlmTabs host'una zaten `flex ... flex-col`
    uyguluyor, `block` onunla çakışır. Yalnızca boşluk sınıfı geçilir.
  -->
  <hlm-tabs class="mt-6" [tab]="activeTab()" (tabActivated)="onTabActivated($event)">
    <hlm-paginated-tabs-list tabListClass="group-data-horizontal/tabs:h-10">
      <button [hlmTabsTrigger]="tabs.general">Genel</button>
      <button [hlmTabsTrigger]="tabs.photos">Fotoğraflar</button>
      <button [hlmTabsTrigger]="tabs.terms">Şartlar</button>
      <button [hlmTabsTrigger]="tabs.amenities">İmkanlar</button>
    </hlm-paginated-tabs-list>

    <div [hlmTabsContent]="tabs.general" class="pt-4">
      <ng-template hlmTabsContentLazy>
        <app-boat-form [screenOpenType]="FormMode.Update" (saved)="boatResource.reload()" />
      </ng-template>
    </div>

    <div [hlmTabsContent]="tabs.photos" class="pt-4">
      <ng-template hlmTabsContentLazy>
        <app-boat-photos />
      </ng-template>
    </div>

    <div [hlmTabsContent]="tabs.terms" class="pt-4">
      <ng-template hlmTabsContentLazy>
        <app-boat-terms />
      </ng-template>
    </div>

    <div [hlmTabsContent]="tabs.amenities" class="pt-4">
      <ng-template hlmTabsContentLazy>
        <app-boat-amenities />
      </ng-template>
    </div>
  </hlm-tabs>
}
```

- [ ] **Adım 7: Derlemeyi ve mevcut testleri doğrula**

Çalıştır: `npx ng build --configuration development`
Beklenen: hatasız.

Çalıştır: `npm test -- --watch=false`
Beklenen: `Tests 1 failed | 90 passed (91)` — yalnızca bilinen kırık test.
`provider.routes.spec.ts` route ağacını yalnızca `/partner` ve
`/partner/dashboard` üzerinden sınadığı için değişiklikten etkilenmez.

- [ ] **Adım 8: Tarayıcıda kontrol**

Çalıştır: `npm start`, `http://localhost:4200/partner/dashboard/teknelerim/1/duzenle`
(id'yi kendi teknenle değiştir). Kontrol listesi:

1. Başlıkta tekne adı, üstünde "‹ Teknelerim" linki görünüyor.
2. Dört sekme görünüyor, Genel açık; URL'de `sekme` yok.
3. Fotoğraflar'a tıkla → URL `?sekme=fotograflar` oluyor, uploader
   yükleniyor.
4. Sayfayı yenile → Fotoğraflar sekmesi açık kalıyor.
5. Geri tuşu → teknelerim listesine dönüyor (sekmeler arasında değil).
6. `?sekme=xyz` yaz → Genel açılıyor.
7. Şartlar ve İmkanlar → kesikli çerçeveli "yakında" kutusu.
8. Genel sekmesinde form tekne verisiyle dolu geliyor.
9. Tarayıcıyı telefon genişliğine daralt → sekme şeridi sığmazsa iki ucunda
   ok butonları beliriyor, sığdığında görünmüyorlar.

Not: "Değişiklikleri kaydet" bu turda 404 döner — `PUT /api/Boats/{id}`
backend'de henüz yok, spec'te bilinçli bırakıldı.

- [ ] **Adım 9: Commit**

```bash
git add src/app/core/routes.const.ts src/app/features/provider/provider.routes.ts src/app/features/provider/boats/boat-edit src/app/features/provider/boats/boat-photos
git commit -m "Add the tabbed boat edit page and move photos into a tab"
```

---

### Task 5: `my-boats` linklerini yeni sayfaya çevir

**Dosyalar:**
- Değiştir: `src/app/features/provider/boats/my-boats/my-boats.ts:31-41`
- Değiştir: `src/app/features/provider/boats/my-boats/my-boats.html:25-31,59-68`

**Arayüzler:**
- Kullanır: `ROUTE_PARTNER.boatEdit`, `BOAT_EDIT_TABS` (Task 4)

- [ ] **Adım 1: `my-boats.ts` — `photosUrl` yerine `editUrl`**

`photosUrl` metodunu şununla değiştir:

```ts
  /** Kartın birincil hedefi — `/partner/dashboard/teknelerim/{id}/duzenle`. */
  editUrl(boatId: number): (string | number)[] {
    return [
      '/',
      ROUTE_PARTNER.main,
      ROUTE_PARTNER.dashboard,
      ROUTE_PARTNER.boats,
      boatId,
      ROUTE_PARTNER.boatEdit,
    ];
  }
```

Import satırını güncelle:

```ts
import { BOAT_EDIT_TABS, ROUTE_MARKET, ROUTE_PARTNER } from '../../../../core/routes.const';
```

Ve şablonun query param'ı okuyabilmesi için sınıfa ekle:

```ts
  tabs = BOAT_EDIT_TABS;
```

`swallowSwiperClick` yorumundaki "fotoğraf sayfasına götürürdü" ifadesini
"düzenleme sayfasına götürürdü" yap.

- [ ] **Adım 2: `my-boats.html` — kart linki**

Kart gövdesindeki büyük linki ve üstündeki yorumu şununla değiştir:

```html
        <a
          [routerLink]="editUrl(boat.id)"
          class="block"
          [attr.aria-label]="boat.name + ' — düzenle'"
        >
```

(Üstündeki "Kartın tamamı bugünkü tek yönetim işine…" yorum bloğu silinir —
artık düzenleme sayfası var.)

- [ ] **Adım 3: `my-boats.html` — aksiyon şeridi**

Aksiyon şeridini ve üstündeki yorumu şununla değiştir:

```html
        <!-- Aksiyon şeridi linkin KARDEŞİ: link içinde link geçersiz HTML olurdu. -->
        <div class="flex items-center gap-2 border-t border-border p-3">
          <a hlmBtn class="h-10 px-4" [routerLink]="editUrl(boat.id)">Düzenle</a>
          <a
            hlmBtn
            variant="outline"
            class="h-10 px-4"
            [routerLink]="editUrl(boat.id)"
            [queryParams]="{ sekme: tabs.photos }"
            >Fotoğraflar</a
          >
          @if (boat.isActive) {
            <a hlmBtn variant="ghost" class="h-10 px-4" [routerLink]="publicUrl(boat)">İlanı gör</a>
          }
        </div>
```

- [ ] **Adım 4: Derlemeyi ve mevcut testleri doğrula**

Çalıştır: `npx ng build --configuration development`
Beklenen: hatasız. `photosUrl`'e kalan referans varsa derleme hata verir —
`my-boats.html` dışında referans olmamalı.

Çalıştır: `npm test -- --watch=false`
Beklenen: `Tests 1 failed | 90 passed (91)`.

- [ ] **Adım 5: Tarayıcıda kontrol**

`http://localhost:4200/partner/dashboard/teknelerim`

1. Kart görseline tıkla → düzenleme sayfası, Genel sekmesi.
2. "Düzenle" → aynı yer.
3. "Fotoğraflar" → düzenleme sayfası, Fotoğraflar sekmesi açık.
4. Üç buton da telefon genişliğinde parmakla basılabilir yükseklikte
   (`h-10`) ve şeride sığıyor.

- [ ] **Adım 6: Commit**

```bash
git add src/app/features/provider/boats/my-boats
git commit -m "Point the my-boats links at the new edit page"
```

---

## Backend'e kalanlar

Bu plan bitince frontend hazır ama üç uç eksik (kullanıcı ekleyecek):

| Uç | Etkilediği sekme |
|---|---|
| `PUT /api/Boats/{id}` | Genel — "Değişiklikleri kaydet" bu gelene kadar 404 döner |
| İmkanlar uçları | İmkanlar — placeholder kutusu duruyor |
| Kullanım şartları uçları | Şartlar — placeholder kutusu duruyor |
