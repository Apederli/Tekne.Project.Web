# Fiyatlandırma Yeniden Tasarım Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fiyatlandırma sekmesini onaylanan makete göre yeniden kurmak: kartlı yerleşim, "Gün ve saate göre farklı fiyat belirle" anahtarı arkasında matris, boş/dolu hücre görsel ayrımı, yeşil tonlu örnek hesap kartı.

**Architecture:** Veri katmanı (servis, modeller, breakdown, form şeması) değişmez; iş yalnız sunum + bir davranış (anahtar) katmanıdır. Spartan `switch` CLI ile eklenir; `AppAmountInput` opsiyonel `cell` görünümü kazanır (bileşen kendi değerinden boş/dolu stilini türetir); `boat-pricing.ts` anahtar durumunu ve kapalıyken-null-gönderme kuralını üstlenir; şablon kart yapısına geçer.

**Tech Stack:** Angular 22 Signal Forms, spartan/ui (card, switch, skeleton, button), Tailwind v4 tema token'ları.

**Spec:** `docs/superpowers/specs/2026-08-11-fiyatlandirma-redesign-design.md`

## Global Constraints

- **Test yazılmaz**; doğrulama `npx ng build` + `npm test -- --watch=false` (91 test yeşil; ilk koşu "no tests" flake'i → bir kez daha).
- **Commit atılmaz** (HARD RULE); dispatch'lere commit talimatı yazılmaz.
- Angular 22: erişim belirteci yazma; `inject()`; `input()`; `@if`/`@for`; `linkedSignal`/`computed`.
- **Açıklama metinleri birebir korunur** — kullanıcı metinleri: alan altı ("Teknenizin standart 1 saatlik…"), matris üstü ("Farklı fiyat uygulamak istediğiniz…"), "Nasıl doldurmalıyım?" üç senaryosu. Kelime değiştirilmez.
- Renkler tema token'larıyla (`primary`, `primary-deep`, `muted`, `border`); hex yazılmaz. `dark:` yok. Mobile-first: taban sınıflar mobil, `lg:` yalnız genişletir.
- Para birimi ibaresi **"TL"**, `app-amount-input` sonekinde (bileşende hazır — dokunulmaz).
- Vitest ilk koşu flake'i bilinir.

---

### Task 1: Spartan switch bileşenini ekle

**Files:**
- Create: `src/app/shared/ui/switch/` (CLI üretir)

**Interfaces:**
- Consumes: `@spartan-ng/cli` (kurulu, ^1.1.2), Angular CLI workspace.
- Produces: `HlmSwitchImports` (`@ui/switch`) — `<hlm-switch [checked]="bool" (checkedChange)="…" inputId="…" />` (API: checked: boolean, checkedChange: boolean output, inputId: string | null). Task 3-4 kullanır.

- [ ] **Step 1: CLI ile ekle**

Run: `npx ng g @spartan-ng/cli:ui --name=switch`
Expected: `src/app/shared/ui/switch/` klasörü oluşur (helm kodu kopyalanır). `package.json` değişirse (beklenmez — brain zaten kurulu) not et, geri ALMA.

- [ ] **Step 2: Barrel/alias doğrula**

`src/app/shared/ui/switch/src/index.ts` dosyasının `HlmSwitch` (ve varsa `HlmSwitchImports`) export ettiğini oku-doğrula; `@ui/switch` alias'ının çözüldüğünü Step 3 build'i gösterir. Export adı farklıysa (örn. yalnız `HlmSwitch`), Task 3-4'te o ad kullanılacak — raporuna yaz.

- [ ] **Step 3: Build ile doğrula**

Run: `npx ng build`
Expected: hatasız.

---

### Task 2: AppAmountInput'a `cell` görünümü

**Files:**
- Modify: `src/app/shared/forms/app-amount-input.ts`

**Interfaces:**
- Consumes: mevcut bileşen (değer durumu `state()` computed'ında).
- Produces: opsiyonel `cell` girdisi (booleanAttribute). `cell` verildiğinde: değer `null` iken input grubu kesikli/soluk çerçeve; değer doluyken `border-primary-deep bg-primary/10` vurgusu. Task 4'ün 6 matris hücresi kullanır.

- [ ] **Step 1: Girdi + sınıf computed'ı ekle**

`AppAmountInput` sınıfına (`state` computed'ının altına):

```ts
  /**
   * Matris hücresi görünümü: boş hücre kesikli çerçeveyle "doldurulmamış"
   * hissi verir, dolu hücre yeşil vurgu alır — neyin girilmiş, neyin temel
   * ücretten geldiği tek bakışta ayrışsın (fiyatlandırma yeniden tasarımı,
   * 2026-08-11). Bileşen kendi değerine bakar; dışarıdan kablolama yok.
   */
  cell = input(false, { transform: booleanAttribute });

  cellClass = computed(() => {
    if (!this.cell()) return '';
    return this.state().value() !== null
      ? 'border-primary-deep bg-primary/10'
      : 'border-dashed';
  });
```

- [ ] **Step 2: Şablonda gruba bağla**

`<div hlmInputGroup>` satırını şu hâle getir (AppInput'un `[class]`'lı grup deseniyle aynı mekanizma):

```html
      <div hlmInputGroup [class]="cellClass()">
```

- [ ] **Step 3: Build ile doğrula**

Run: `npx ng build`
Expected: hatasız. (`cell` verilmeyen mevcut kullanımlar boş string alır — görünüm değişmez.)

---

### Task 3: boat-pricing.ts — anahtar durumu ve kayıt kuralı

**Files:**
- Modify: `src/app/features/provider/boats/boat-pricing/boat-pricing.ts`

**Interfaces:**
- Consumes: Task 1'in `HlmSwitchImports` (yalnız şablon için import listesine girer), mevcut `BoatPricingInputModel`, `breakdown`.
- Produces: `useMatrix: WritableSignal<boolean>` (linkedSignal), şablonun kullandığı mevcut üyeler aynen; `basePlaceholder` yeni kalıp `Temel: 4.500`. Task 4 şablonu bunlara bağlanır.

- [ ] **Step 1: Import'ları güncelle**

- `import { HlmCardImports } from '@ui/card';` ve `import { HlmSwitchImports } from '@ui/switch';` eklenir (Task 1 Step 2 farklı export adı raporladıysa onu kullan).
- `@Component.imports` dizisine `HlmCardImports` ve `HlmSwitchImports` eklenir (mevcutlar kalır).

- [ ] **Step 2: `useMatrix` linkedSignal'ini ekle**

`model` linkedSignal'inin ÜSTÜNE:

```ts
  /**
   * "Gün ve saate göre farklı fiyat belirle" anahtarı. İlk değer sunucudan
   * türer: herhangi bir dilim doluysa açık. Kapatmak matrisi gizler ama
   * girilen değerler modelde KORUNUR — yanlış tıkta veri kaybı olmasın.
   * Kapalıyken kaydetmek dilimleri null gönderir (bkz. save).
   */
  useMatrix = linkedSignal(() => {
    const p = this.pricing();
    if (!p) return false;
    return [
      p.weekdayMorningRate,
      p.weekdayEveningRate,
      p.weekdayNightRate,
      p.weekendMorningRate,
      p.weekendEveningRate,
      p.weekendNightRate,
    ].some((rate) => rate !== null);
  });
```

- [ ] **Step 3: `basePlaceholder` kalıbını güncelle**

Mevcut `basePlaceholder` computed'ının gövdesindeki dönüş şu olur (doc yorumundaki "Temel fiyat: …" ifadesini de "Temel: …" yap):

```ts
    return base !== null && base > 0 ? `Temel: ${this.format(base)}` : '';
```

- [ ] **Step 4: `examples` hesabını anahtara bağla**

Mevcut `examples` computed'ını şununla değiştir:

```ts
  /**
   * Temel ücret geçersizken örnekler gizli (boş dizi). Anahtar kapalıyken
   * dilimler hesaba katılmaz — ekrandaki örnek, Kaydet'in göndereceği hâlle
   * aynı sonucu göstersin (modelde korunan değerler yanıltmasın).
   */
  examples = computed<PricingExample[]>(() => {
    const m = this.model();
    if (m.baseRate === null || m.baseRate <= 0) return [];
    const effective = this.useMatrix() ? m : this.withoutSlices(m);
    return EXAMPLE_SCENARIOS.map((s) => {
      const groups = breakdown(effective, s.startDay, s.startHour, s.hours);
      return {
        title: s.title,
        groups,
        total: groups.reduce((sum, g) => sum + g.total, 0),
      };
    });
  });

  /** Altı dilim alanı null'lanmış kopya — kapalı anahtar ve kayıt gövdesi için. */
  withoutSlices(m: BoatPricingFormModel): BoatPricingFormModel {
    return {
      ...m,
      weekdayMorningRate: null,
      weekdayEveningRate: null,
      weekdayNightRate: null,
      weekendMorningRate: null,
      weekendEveningRate: null,
      weekendNightRate: null,
    };
  }
```

- [ ] **Step 5: `save`'i anahtar kuralına göre değiştir**

Mevcut `save` metodunu şununla değiştir:

```ts
  async save(): Promise<void> {
    await submit(this.pricingForm, async () => {
      const useMatrix = this.useMatrix();
      const m = useMatrix ? this.model() : this.withoutSlices(this.model());
      const input: BoatPricingInputModel = {
        baseRate: m.baseRate ?? 0,
        weekdayMorningRate: m.weekdayMorningRate,
        weekdayEveningRate: m.weekdayEveningRate,
        weekdayNightRate: m.weekdayNightRate,
        weekendMorningRate: m.weekendMorningRate,
        weekendEveningRate: m.weekendEveningRate,
        weekendNightRate: m.weekendNightRate,
      };
      const saved = await firstValueFrom(
        this.pricingService.upsert(Number(this.boatId()), input),
      );
      if (!saved) {
        this.toast.error('Fiyatlar kaydedilemedi.');
        return;
      }
      // Kapalı anahtarla kayıt tek fiyata döndürür; model sunucudaki hâle
      // eşitlenir ki anahtar tekrar açılınca silinmiş değerler geri gelmesin.
      if (!useMatrix) {
        this.model.update((x) => this.withoutSlices(x));
      }
      this.toast.success('Fiyatlar kaydedildi.');
    });
  }
```

(`BoatPricingFormModel` import'u `@models` satırına eklenir — Step 4'teki tip için.)

- [ ] **Step 6: Build ile doğrula**

Run: `npx ng build`
Expected: hatasız. (Şablon henüz eski — `useMatrix` kullanılmıyor olabilir; hata değil.)

---

### Task 4: boat-pricing.html — kartlı şablon

**Files:**
- Modify: `src/app/features/provider/boats/boat-pricing/boat-pricing.html` (tam yeniden yazım)

**Interfaces:**
- Consumes: Task 2 `cell` girdisi; Task 3 `useMatrix`, `basePlaceholder`, `examples`; `HlmCardImports`/`HlmSwitchImports` (Task 3 import etti).
- Produces: — (yaprak).

- [ ] **Step 1: Şablonu tümüyle şu içerikle değiştir**

```html
@if (loading()) {
  <!-- İskelet kart yapısına kabaca uyar: temel ücret kartı + matris kartı. -->
  <div class="max-w-2xl" aria-hidden="true">
    <hlm-skeleton class="h-44 w-full rounded-xl" />
    <hlm-skeleton class="mt-6 h-72 w-full rounded-xl" />
  </div>
} @else if (failed() || !boat()) {
  <!-- Lazy sekme yeniden istek atmıyor; tek çıkış sayfa yenilemek. -->
  <p class="text-sm text-destructive">
    Fiyat bilgisi yüklenemedi. Sayfayı yenileyip tekrar deneyin.
  </p>
} @else if (!isHourly()) {
  <p class="text-sm text-muted-foreground">
    Gecelik fiyatlandırma henüz hazır değil. Şimdilik yalnızca saatlik kiralama
    yapan teknelere fiyat girilebiliyor.
  </p>
} @else {
  <!--
    Masaüstünde iki sütun: solda kartlar + Kaydet, sağda örnek hesap. Grid'in
    otomatik yerleşimi mobil DOM sırasını (kartlar → örnek → Kaydet) bozmadan
    örneği sağa alır: kartlar r1c1, örnek r1c2, Kaydet r2c1 (col-start-1 şart —
    örnek kartı gizliyken Kaydet sağa kaymasın). Kart satırı doldurur (stretch).
  -->
  <div class="max-w-2xl lg:grid lg:max-w-5xl lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:gap-x-8">
    <div class="flex flex-col gap-6">
      <section hlmCard>
        <div hlmCardHeader>
          <h2 hlmCardTitle>Temel saatlik ücret</h2>
        </div>
        <div hlmCardContent>
          <!-- Kart başlığı görsel etiket; input etiketi ekran okuyucuya sr-only gider. -->
          <app-amount-input
            class="block sm:max-w-[12rem]"
            hideLabel
            label="Temel saatlik ücret"
            [field]="pricingForm.baseRate"
          />
          <p class="mt-1.5 text-sm text-muted-foreground">
            Teknenizin standart 1 saatlik kiralama ücretini girin. Farklı fiyat
            belirtmediğiniz tüm gün ve saatlerde bu ücret uygulanır.
          </p>

          <div class="mt-4 flex min-h-10 items-center gap-3 border-t border-border pt-4">
            <hlm-switch
              inputId="use-matrix"
              [checked]="useMatrix()"
              (checkedChange)="useMatrix.set($event)"
            />
            <label for="use-matrix" class="cursor-pointer text-sm font-medium">
              Gün ve saate göre farklı fiyat belirle
            </label>
          </div>
        </div>
      </section>

      @if (useMatrix()) {
        <section hlmCard>
          <div hlmCardHeader>
            <h2 hlmCardTitle>Gün ve saat farkları</h2>
            <p hlmCardDescription>
              Farklı fiyat uygulamak istediğiniz alanları doldurun. Boş
              bıraktığınız alanlarda temel saatlik ücret geçerli olur.
            </p>
          </div>
          <div hlmCardContent>
            <!--
              Matris: satırlar dilimler, sütunlar hafta içi/sonu. Etiketler grid
              başlığında olduğu için input etiketleri sr-only (hideLabel) — ekran
              okuyucu yine tam adı duyar.
            -->
            <div class="grid grid-cols-[minmax(5rem,auto)_1fr_1fr] items-center gap-x-3 gap-y-4">
              <div></div>
              <div>
                <p class="text-sm font-medium">Hafta içi</p>
                <p class="text-xs text-muted-foreground">Pazartesi–Cuma</p>
              </div>
              <div>
                <p class="text-sm font-medium">Hafta sonu</p>
                <p class="text-xs text-muted-foreground">Cumartesi–Pazar</p>
              </div>

              <div>
                <p class="text-sm font-medium">Sabah</p>
                <p class="text-xs text-muted-foreground">08:00–18:00</p>
              </div>
              <app-amount-input
                cell
                hideLabel
                label="Hafta içi sabah ücreti"
                [placeholder]="basePlaceholder()"
                [field]="pricingForm.weekdayMorningRate"
              />
              <app-amount-input
                cell
                hideLabel
                label="Hafta sonu sabah ücreti"
                [placeholder]="basePlaceholder()"
                [field]="pricingForm.weekendMorningRate"
              />

              <div>
                <p class="text-sm font-medium">Akşam</p>
                <p class="text-xs text-muted-foreground">18:00–24:00</p>
              </div>
              <app-amount-input
                cell
                hideLabel
                label="Hafta içi akşam ücreti"
                [placeholder]="basePlaceholder()"
                [field]="pricingForm.weekdayEveningRate"
              />
              <app-amount-input
                cell
                hideLabel
                label="Hafta sonu akşam ücreti"
                [placeholder]="basePlaceholder()"
                [field]="pricingForm.weekendEveningRate"
              />

              <div>
                <p class="text-sm font-medium">Gece</p>
                <p class="text-xs text-muted-foreground">00:00–08:00</p>
              </div>
              <app-amount-input
                cell
                hideLabel
                label="Hafta içi gece ücreti"
                [placeholder]="basePlaceholder()"
                [field]="pricingForm.weekdayNightRate"
              />
              <app-amount-input
                cell
                hideLabel
                label="Hafta sonu gece ücreti"
                [placeholder]="basePlaceholder()"
                [field]="pricingForm.weekendNightRate"
              />
            </div>

            <!-- Doldurma rehberi — metinler kullanıcı kararı (2026-08-11), birebir. -->
            <div class="mt-6 rounded-lg bg-muted/50 p-4">
              <p class="text-sm font-semibold">Nasıl doldurmalıyım?</p>

              <div class="mt-3 flex flex-col gap-4 text-sm">
                <div>
                  <p class="font-medium">Her gün aynı fiyat geçerliyse</p>
                  <p class="mt-0.5 text-muted-foreground">
                    Sadece temel saatlik ücreti girin. Diğer alanları boş bırakın.
                  </p>
                </div>

                <div>
                  <p class="font-medium">Hafta içi 4.000 TL, hafta sonu 5.000 TL olacaksa</p>
                  <p class="mt-0.5 text-muted-foreground">
                    Temel saatlik ücret: 4.000 TL<br />
                    Hafta sonu Sabah: 5.000 TL<br />
                    Hafta sonu Akşam: 5.000 TL<br />
                    Hafta sonu Gece: 5.000 TL<br />
                    Hafta içi alanlarını boş bırakın.
                  </p>
                </div>

                <div>
                  <p class="font-medium">Yalnızca belirli saatlerde farklı fiyat uygulayacaksanız</p>
                  <p class="mt-0.5 text-muted-foreground">
                    Sadece ilgili gün ve saat alanına farklı fiyatı girin. Örneğin hafta
                    sonu akşamları 6.000 TL olacaksa yalnızca “Hafta sonu – Akşam”
                    alanına 6.000 TL yazın.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      }
    </div>

    @if (examples().length) {
      <div class="mt-6 rounded-xl border border-primary/20 bg-primary/10 p-4 lg:mt-0">
        <p class="text-sm font-semibold text-primary-deep">Örnek hesap</p>
        <p class="mt-0.5 text-xs text-muted-foreground">
          Girdiğiniz fiyatlarla anında güncellenir.
        </p>

        @for (example of examples(); track example.title) {
          <div class="mt-3 rounded-lg bg-background p-3">
            <p class="text-sm font-medium">{{ example.title }}</p>
            <ul class="mt-1 flex flex-col gap-0.5 text-sm text-muted-foreground">
              @for (group of example.groups; track $index) {
                <li>
                  {{ group.hours }} saat × {{ format(group.hourRate) }} TL
                  ({{ group.dayType }} {{ group.period }}) = {{ format(group.total) }} TL
                </li>
              }
            </ul>
            <p class="mt-1 text-sm font-medium">Toplam: {{ format(example.total) }} TL</p>
          </div>
        }
      </div>
    }

    <div class="mt-6 lg:col-start-1">
      <button
        hlmBtn
        size="lg"
        class="h-12 w-full px-8 text-base sm:w-auto"
        type="button"
        [disabled]="pricingForm().submitting()"
        (click)="save()"
      >
        @if (pricingForm().submitting()) {
          Kaydediliyor…
        } @else {
          Kaydet
        }
      </button>
    </div>
  </div>
}
```

- [ ] **Step 2: Build + süit ile doğrula**

Run: `npx ng build`
Expected: hatasız — bu build `useMatrix`, `cell`, switch ve kart direktiflerini birlikte derler.

Run: `npm test -- --watch=false`
Expected: 91 test yeşil (ilk koşu flake'i → bir kez daha).

---

### Task 5: Elle doğrulama (kullanıcı tarayıcıda)

**Files:** yok.

**Interfaces:** —

- [ ] **Step 1: Kontrol listesi kullanıcıya raporlanır**

- Dilim kaydı olmayan teknede sekme tek kartla açılır (anahtar kapalı, matris yok); dilimli teknede anahtar açık gelir.
- Anahtar açılınca matris kartı gelir; kapatıp açınca girilmiş değerler kaybolmaz.
- Boş hücre: kesikli çerçeve + soluk "Temel: 4.500"; değer girilince yeşil çerçeve + açık yeşil zemin.
- Anahtar kapalıyken örnek hesap dilimleri yok sayar; kapalıyken Kaydet → yenileyince dilimler sıfırlanmış (tek fiyat).
- Örnek hesap kartı yeşil tonlu, masaüstünde sağda, telefonda kartların altında; Kaydet en altta.
- "Nasıl doldurmalıyım?" üç senaryosuyla matris kartının içinde, hep görünür.
- ~390px mobil genişlikte taşma yok.
