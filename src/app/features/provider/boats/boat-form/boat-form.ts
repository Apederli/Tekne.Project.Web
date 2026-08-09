import { Component, computed, effect, inject, input, linkedSignal, output } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import {
  FormField,
  form,
  max,
  maxLength,
  min,
  required,
  submit,
  validate,
} from '@angular/forms/signals';
import { firstValueFrom, map } from 'rxjs';
import { HlmButton } from '@ui/button';
import { HlmCardImports } from '@ui/card';
import { HlmFieldImports } from '@ui/field';
import { HlmTextarea } from '@ui/textarea';
import {
  AppInput,
  AppMultiSelect,
  AppSelect,
  AppToggleGroup,
  ErrorMessagePipe,
} from '@forms';
import { BoatType, FormMode, HullMaterial, PaymentMethod, RentalType } from '@enums';
import { BoatFormModel, BoatInputModel } from '@models';
import { BoatService, HarborService, ToastService } from '@services';
import { ROUTE_PARTNER } from '../../../../core/routes.const';
import { emptyBoatForm, toBoatFormModel } from '../../../../core/util/boat-form-model';

@Component({
  selector: 'app-boat-form',
  imports: [
    ErrorMessagePipe,
    FormField,
    RouterLink,
    AppInput,
    AppMultiSelect,
    AppSelect,
    AppToggleGroup,
    HlmButton,
    HlmCardImports,
    HlmFieldImports,
    HlmTextarea,
  ],
  templateUrl: './boat-form.html',
})
export class BoatForm {
  router = inject(Router);
  route = inject(ActivatedRoute);
  boatService = inject(BoatService);
  harborService = inject(HarborService);
  toast = inject(ToastService);

  boatTypeOptions = [
    { value: BoatType.Sailboat, label: 'Yelkenli' },
    { value: BoatType.MotorYacht, label: 'Motor yat' },
    { value: BoatType.Catamaran, label: 'Katamaran' },
    { value: BoatType.Gulet, label: 'Gulet' },
  ];

  rentalTypeOptions = [
    { value: RentalType.Hourly, label: 'Saatlik' },
    { value: RentalType.Nightly, label: 'Gecelik' },
  ];

  paymentMethodOptions = [
    { value: PaymentMethod.Cash, label: 'Nakit' },
    { value: PaymentMethod.BankTransfer, label: 'Havale' },
    { value: PaymentMethod.CreditCard, label: 'Kredi Kartı' },
  ];

  hullMaterialOptions = [
    { value: HullMaterial.Wood, label: 'Ahşap' },
    { value: HullMaterial.Fiberglass, label: 'Fiberglas' },
    { value: HullMaterial.Steel, label: 'Çelik' },
    { value: HullMaterial.Aluminum, label: 'Alüminyum' },
    { value: HullMaterial.Composite, label: 'Kompozit' },
    { value: HullMaterial.Other, label: 'Diğer' },
  ];

  boatsUrl = ['/', ROUTE_PARTNER.main, ROUTE_PARTNER.dashboard, ROUTE_PARTNER.boats];

  screenOpenType = input<FormMode>(FormMode.Create);

  saved = output<void>();

  isUpdate = computed(() => this.screenOpenType() === FormMode.Update);

  minimumDurationLabel = computed(() => {
    switch (this.model().rentalType) {
      case RentalType.Hourly:
        return 'Minimum süre (saat)';
      case RentalType.Nightly:
        return 'Minimum süre (gece)';
      default:
        return 'Minimum süre';
    }
  });

  boatId = toSignal(this.route.paramMap.pipe(map((p) => p.get('boatId'))), {
    initialValue: null,
  });

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

  cities = toSignal(this.harborService.getAll(), { initialValue: [] });

  brands = toSignal(this.boatService.getBrands(), { initialValue: [] });

  model = linkedSignal<BoatFormModel>(() => {
    const boat = this.boat();
    return boat ? toBoatFormModel(boat) : emptyBoatForm();
  });

  /**
   * Ayrı computed şart: `params` doğrudan `model()` okusaydı formdaki HERHANGİ
   * bir alan değişince yeniden çalışır ve kaynak aynı markayı tekrar isterdi —
   * gelen modeller `modelId`'yi yazdığı için istek kendini besleyen bir döngüye
   * giriyordu. Aradaki computed yalnızca marka gerçekten değişince haber verir.
   */
  selectedBrandId = computed(() => {
    const brandId = Number(this.model().brandId);
    return brandId > 0 ? brandId : undefined;
  });

  /** Seçili markanın modelleri; marka değişince yeniden istenir. */
  modelsResource = rxResource({
    params: () => this.selectedBrandId(),
    stream: ({ params }) => this.boatService.getModels(params),
  });

  boatModels = computed(() =>
    this.modelsResource.hasValue() ? this.modelsResource.value() : [],
  );

  brandOptions = computed(() =>
    this.brands().map((b) => ({ value: String(b.id), label: b.name })),
  );

  modelOptions = computed(() =>
    this.boatModels().map((m) => ({ value: String(m.id), label: m.name })),
  );

  cityOptions = computed(() =>
    this.cities().map((c) => ({ value: String(c.cityId), label: c.cityName })),
  );

  harbors = computed(() => {
    const cityId = Number(this.model().cityId);
    return this.cities().find((c) => c.cityId === cityId)?.harbors ?? [];
  });

  harborOptions = computed(() =>
    this.harbors().map((h) => ({ value: h.id, label: h.name })),
  );

  primaryHarborOptions = computed(() => {
    const selected = this.model().harborIds;
    return this.harbors()
      .filter((h) => selected.includes(h.id))
      .map((h) => ({ value: String(h.id), label: h.name }));
  });

  constructor() {
    // Marka boş kaldığı sürece listenin ilki seçili gelir. Sunucu "Özel
    // Tasarım"ı başa koyuyor — katalogda karşılığı olmayan tekneler için
    // zaten doğru olan seçenek.
    effect(() => {
      const brands = this.brands();
      if (brands.length === 0 || this.model().brandId !== '') return;
      this.model.update((x) => ({ ...x, brandId: String(brands[0].id) }));
    });

    // Model, seçili markanın listesinde yoksa ilkine düşer: marka değişince
    // eskisi gider, yenisinin ilki seçili gelir. `hasValue()` şart — liste
    // yüklenirken boş görünüyor ve düzenlemede API'den gelen modeli silerdi.
    effect(() => {
      if (!this.modelsResource.hasValue()) return;
      const options = this.boatModels();
      const modelId = this.model().modelId;
      if (options.some((m) => String(m.id) === modelId)) return;
      this.model.update((x) => ({
        ...x,
        modelId: options.length > 0 ? String(options[0].id) : '',
      }));
    });

    // Şehir değişince önceki şehrin limanları temizlenir. Select'in
    // (valueChange)'ine bağlanmıyor: BrnSelect o event'i programatik
    // yazımda da yayınlıyor — update modunda API'den dolan formun
    // limanlarını siliyordu. Modelden süzmek iki durumu da doğru ayırır:
    // yüklenen kaydın limanları şehrine ait olduğu için dokunulmaz.
    effect(() => {
      if (this.cities().length === 0) return;
      const valid = new Set(this.harbors().map((h) => h.id));
      const m = this.model();
      const harborIds = m.harborIds.filter((id) => valid.has(id));
      if (harborIds.length !== m.harborIds.length) {
        this.model.update((x) => ({ ...x, harborIds }));
      }
    });

    effect(() => {
      const m = this.model();
      if (m.primaryHarborId !== '' && !m.harborIds.includes(Number(m.primaryHarborId))) {
        this.model.update((x) => ({ ...x, primaryHarborId: '' }));
      }
    });
  }

  boatForm = form(this.model, (path) => {
    required(path.name);
    maxLength(path.name, 100);
    required(path.boatType);
    required(path.rentalType);
    min(path.manufactureYear, 1900);
    max(path.manufactureYear, 2100);
    required(path.lengthInMeters);
    validate(path.lengthInMeters, (ctx) => {
      const value = ctx.value();
      return value !== null && value <= 0
        ? { kind: 'greaterThanZero', message: '0’dan büyük olmalı.' }
        : undefined;
    });
    required(path.totalCapacity);
    min(path.totalCapacity, 1);
    required(path.diningCapacity);
    min(path.diningCapacity, 0);
    required(path.swimmingCapacity);
    min(path.swimmingCapacity, 0);
    required(path.toiletCount);
    min(path.toiletCount, 0);
    required(path.minimumRentalDuration);
    min(path.minimumRentalDuration, 1);
    validate(path.minimumRentalDuration, (ctx) => {
      const value = ctx.value();
      return value !== null &&
        value > 12 &&
        ctx.valueOf(path.rentalType) === RentalType.Hourly
        ? {
            kind: 'hourlyMax',
            message: 'Saatlik teknede minimum süre en fazla 12 saat olabilir.',
          }
        : undefined;
    });
    required(path.brandId);
    required(path.modelId);
    validate(path.remainingPaymentMethods, (ctx) =>
      ctx.value().length === 0
        ? { kind: 'minSelected', message: 'En az bir ödeme yöntemi seçin.' }
        : undefined,
    );
    required(path.cityId);
    validate(path.harborIds, (ctx) =>
      ctx.value().length === 0
        ? { kind: 'minSelected', message: 'En az bir liman seçin.' }
        : undefined,
    );
    required(path.primaryHarborId);
    validate(path.primaryHarborId, (ctx) => {
      const value = ctx.value();
      return value !== '' && !ctx.valueOf(path.harborIds).includes(Number(value))
        ? {
            kind: 'primaryInHarbors',
            message: 'Bağlı olduğu liman, seçili limanlar arasında olmalı.',
          }
        : undefined;
    });
    maxLength(path.description, 1000);
  });

  async save(): Promise<void> {
    await submit(this.boatForm, async () => {
      const m = this.model();
      const input: BoatInputModel = {
        name: m.name.trim(),
        boatType: m.boatType as BoatType,
        rentalType: m.rentalType as RentalType,
        manufactureYear: m.manufactureYear ?? undefined,
        lengthInMeters: m.lengthInMeters ?? 0,
        diningCapacity: m.diningCapacity ?? 0,
        totalCapacity: m.totalCapacity ?? 0,
        swimmingCapacity: m.swimmingCapacity ?? 0,
        toiletCount: m.toiletCount ?? 0,
        minimumRentalDuration: m.minimumRentalDuration ?? 1,
        brandId: Number(m.brandId),
        modelId: Number(m.modelId),
        hullMaterial: m.hullMaterial || undefined,
        remainingPaymentMethods: m.remainingPaymentMethods,
        cityId: Number(m.cityId),
        primaryHarborId: Number(m.primaryHarborId),
        harborIds: m.harborIds,
        description: m.description.trim() || undefined,
      };
      if (this.isUpdate()) {
        const updated = await firstValueFrom(
          this.boatService.update(Number(this.boatId()), input),
        );
        if (!updated) {
          this.toast.error('Tekne bilgileri güncellenemedi.');
          return;
        }
        this.toast.success('Tekne bilgileri güncellendi.');
        this.saved.emit();
        return;
      }

      await firstValueFrom(this.boatService.create(input));
      await this.router.navigate(this.boatsUrl);
    });
  }
}
