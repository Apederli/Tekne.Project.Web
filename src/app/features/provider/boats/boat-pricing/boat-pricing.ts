import { Component, computed, inject, linkedSignal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { rxResource, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { form, required, submit } from '@angular/forms/signals';
import { debounceTime, firstValueFrom, map } from 'rxjs';
import { HlmButton } from '@ui/button';
import { HlmCardImports } from '@ui/card';
import { HlmSkeleton } from '@ui/skeleton';
import { HlmSwitchImports } from '@ui/switch';
import { AppAmountInput } from '@forms';
import { RentalType } from '@enums';
import { BoatPricingFormModel, BoatPricingInputModel, PricingPreviewOutputModel } from '@models';
import { BoatPricingService, BoatService, ToastService } from '@services';

/**
 * Düzenleme sayfasının "Fiyatlandırma" sekmesi.
 *
 * İki kaynağı paralel çeker: tekne (`rentalType` için) ve fiyat kaydı.
 * Gecelik teknede form yerine bilgi notu gösterilir — backend'in gecelik
 * hesabı henüz yok, quote ucu yalnızca saatlik teknelere cevap veriyor.
 *
 * Kaydet butonlu tek `PUT` — sayı alanlarında otomatik kayıt, yarım yazılmış
 * değerleri sunucuya taşıyacağı için bilinçli olarak yok.
 */
@Component({
  selector: 'app-boat-pricing',
  imports: [AppAmountInput, HlmButton, ...HlmCardImports, HlmSkeleton, ...HlmSwitchImports],
  templateUrl: './boat-pricing.html',
})
export class BoatPricing {
  route = inject(ActivatedRoute);
  boatService = inject(BoatService);
  pricingService = inject(BoatPricingService);
  toast = inject(ToastService);

  /**
   * Sekme olduğu için route paramı input'a bağlanmıyor; kapsayıcının
   * route'undan okunur (boat-terms ile aynı gerekçe).
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

  /**
   * Fiyat kaydı tekneyi beklemeden paralel istenir. Gecelik teknede sonuç
   * kullanılmaz ama istek zararsız; yaygın durum (saatlik) için hızlı olan bu.
   */
  pricingResource = rxResource({
    params: () => {
      const id = this.boatId();
      return id ? Number(id) : undefined;
    },
    stream: ({ params }) => this.pricingService.getPricing(params),
  });

  boat = computed(() => (this.boatResource.hasValue() ? this.boatResource.value() : null));
  pricing = computed(() =>
    this.pricingResource.hasValue() ? this.pricingResource.value() : null,
  );

  loading = computed(() => this.boatResource.isLoading() || this.pricingResource.isLoading());
  failed = computed(
    () => this.boatResource.status() === 'error' || this.pricingResource.status() === 'error',
  );

  isHourly = computed(() => this.boat()?.rentalType === RentalType.Hourly);

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

  /** Kayıt yoksa (`null`) boş form — ilk giriş senaryosu. */
  model = linkedSignal<BoatPricingFormModel>(() => {
    const p = this.pricing();
    return {
      baseRate: p?.baseRate ?? null,
      weekdayMorningRate: p?.weekdayMorningRate ?? null,
      weekdayEveningRate: p?.weekdayEveningRate ?? null,
      weekdayNightRate: p?.weekdayNightRate ?? null,
      weekendMorningRate: p?.weekendMorningRate ?? null,
      weekendEveningRate: p?.weekendEveningRate ?? null,
      weekendNightRate: p?.weekendNightRate ?? null,
    };
  });

  /**
   * Yalnız zorunluluk kuralı: eksi değer app-amount-input maskesinde zaten
   * yazılamıyor; sıfır ucu backend validator'ına bırakıldı (nadir durum,
   * mesajını interceptor toast'la gösterir).
   */
  pricingForm = form(this.model, (path) => {
    required(path.baseRate);
  });

  /**
   * Boş dilim input'unun placeholder'ı. Çıplak sayı ("4.500") alan doluymuş
   * yanılgısı yaratıyordu; "Temel: …" kalıbı boşluğun ne anlama
   * geldiğini söyler (kullanıcı kararı 2026-08-11). Temel ücret geçerli
   * değilken ipucu da anlamsız — boş döner.
   */
  basePlaceholder = computed(() => {
    const base = this.model().baseRate;
    return base !== null && base > 0 ? `Temel: ${this.format(base)}` : '';
  });

  /**
   * Örnek hesap için gönderilecek gövde. Temel ücret geçersizken `undefined` —
   * istek atılmaz, kart da gizli. Anahtar kapalıyken dilimler null gider ki
   * ekran, Kaydet'in göndereceği hâlle aynı sonucu göstersin.
   */
  previewParams = computed<BoatPricingInputModel | undefined>(() => {
    const m = this.model();
    if (m.baseRate === null || m.baseRate <= 0) return undefined;
    return this.toInput(this.useMatrix() ? m : this.withoutSlices(m));
  });

  /**
   * Hesap backend'de olduğu için her tuş vuruşu bir istek demek; 300 ms'lik
   * bekleme yazarken çıkan istekleri tek isteğe indiriyor.
   */
  debouncedPreviewParams = toSignal(toObservable(this.previewParams).pipe(debounceTime(300)), {
    initialValue: undefined,
  });

  previewResource = rxResource({
    params: () => this.debouncedPreviewParams(),
    stream: ({ params }) => this.pricingService.preview(params),
  });

  /**
   * Yeni istek uçarken kart bir önceki hesabı göstermeye devam eder (kullanıcı
   * kararı 2026-08-13): kaynak yükleme sırasında değerini boşaltıyor, son iyi
   * sonucu burada tutuyoruz. Skeleton kullanılmadı — her düzenlemede yanıp
   * sönme yaratıyordu.
   */
  lastPreview = linkedSignal<PricingPreviewOutputModel | undefined, PricingPreviewOutputModel | undefined>({
    source: () => (this.previewResource.hasValue() ? this.previewResource.value() : undefined),
    computation: (value, previous) => value ?? previous?.value,
  });

  /**
   * Temel ücret silinince kart anında gizlenir — `lastPreview` elindeki eski
   * hesabı göstermeye devam etmesin.
   */
  examples = computed(() => (this.previewParams() ? (this.lastPreview()?.examples ?? []) : []));

  /**
   * Ekrandaki hesap bayat mı: debounce beklerken de, istek uçarken de evet.
   * `previewParams` her düzenlemede yeni bir nesne ürettiği için kimlik
   * karşılaştırması bekleme penceresini de yakalıyor.
   */
  previewStale = computed(
    () => this.previewParams() !== this.debouncedPreviewParams() || this.previewResource.isLoading(),
  );

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

  /** Form modelinden istek gövdesi — `save()` ve önizleme aynı gövdeyi üretir. */
  toInput(m: BoatPricingFormModel): BoatPricingInputModel {
    return {
      baseRate: m.baseRate ?? 0,
      weekdayMorningRate: m.weekdayMorningRate,
      weekdayEveningRate: m.weekdayEveningRate,
      weekdayNightRate: m.weekdayNightRate,
      weekendMorningRate: m.weekendMorningRate,
      weekendEveningRate: m.weekendEveningRate,
      weekendNightRate: m.weekendNightRate,
    };
  }

  format(value: number): string {
    return value.toLocaleString('tr-TR');
  }

  async save(): Promise<void> {
    await submit(this.pricingForm, async () => {
      const useMatrix = this.useMatrix();
      const m = useMatrix ? this.model() : this.withoutSlices(this.model());
      const saved = await firstValueFrom(
        this.pricingService.upsert(Number(this.boatId()), this.toInput(m)),
      );
      if (!saved) {
        this.toast.error('Fiyatlar kaydedilemedi.');
        return;
      }
      if (!useMatrix) {
        this.model.update((x) => this.withoutSlices(x));
      }
      this.toast.success('Fiyatlar kaydedildi.');
    });
  }
}
