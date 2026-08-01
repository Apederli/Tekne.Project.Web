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
import { HlmInput } from '@ui/input';
import { HlmTextarea } from '@ui/textarea';
import { HlmToggleGroupImports } from '@ui/toggle-group';
import { AppMultiSelect } from '../../../../shared/forms/app-multi-select';
import { AppSelect } from '../../../../shared/forms/app-select';
import { BoatType, FormMode, RentalType } from '@enums';
import { BoatFormModel, BoatInputModel } from '@models';
import { BoatService, HarborService, ToastService } from '@services';
import { ROUTE_PARTNER } from '../../../../core/routes.const';
import { emptyBoatForm, toBoatFormModel } from '../../../../core/util/boat-form-model';

@Component({
  selector: 'app-boat-form',
  imports: [
    FormField,
    RouterLink,
    AppMultiSelect,
    AppSelect,
    HlmButton,
    HlmCardImports,
    HlmFieldImports,
    HlmInput,
    HlmTextarea,
    HlmToggleGroupImports,
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
    { value: RentalType.Daily, label: 'Günlük' },
  ];

  /** Vazgeç linki — teknelerim listesine döner. */
  boatsUrl = ['/', ROUTE_PARTNER.main, ROUTE_PARTNER.dashboard, ROUTE_PARTNER.boats];

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

  cities = toSignal(this.harborService.getAll(), { initialValue: [] });

  /**
   * Formun çalışma kopyası. `linkedSignal`: Update'te yüklenen tekneden
   * türetilir, Create'te boş başlar; kullanıcı yazdıkça üzerine yazılır.
   */
  model = linkedSignal<BoatFormModel>(() => {
    const boat = this.boat();
    return boat ? toBoatFormModel(boat) : emptyBoatForm();
  });

  /** Şehir select'inin seçenekleri — değerler form modelindeki gibi string. */
  cityOptions = computed(() =>
    this.cities().map((c) => ({ value: String(c.cityId), label: c.cityName })),
  );

  /** Seçili şehrin limanları — chip listesi buradan çizilir. */
  harbors = computed(() => {
    const cityId = Number(this.model().cityId);
    return this.cities().find((c) => c.cityId === cityId)?.harbors ?? [];
  });

  /** Ücretsiz kalkış limanları multi-select'inin seçenekleri. */
  harborOptions = computed(() =>
    this.harbors().map((h) => ({ value: h.id, label: h.name })),
  );

  /** Bağlı olduğu liman select'inin seçenekleri — yalnızca seçili limanlar. */
  primaryHarborOptions = computed(() => {
    const selected = this.model().harborIds;
    return this.harbors()
      .filter((h) => selected.includes(h.id))
      .map((h) => ({ value: String(h.id), label: h.name }));
  });

  constructor() {
    // Liman chip'i kaldırılınca ona bağlı ana liman seçimi de düşmeli —
    // aksi hâlde listede olmayan bir ana liman gönderilebilir (backend kuralı ihlali).
    effect(() => {
      const m = this.model();
      if (m.primaryHarborId !== '' && !m.harborIds.includes(Number(m.primaryHarborId))) {
        this.model.update((x) => ({ ...x, primaryHarborId: '' }));
      }
    });
  }

  /** Kurallar backend'in `BoatInputModelValidator`'ıyla birebir. */
  boatForm = form(this.model, (path) => {
    required(path.name, { message: 'Tekne adı gerekli.' });
    maxLength(path.name, 100, { message: 'Tekne adı en fazla 100 karakter olabilir.' });
    required(path.boatType, { message: 'Tekne tipi seçin.' });
    required(path.rentalType, { message: 'Kiralama tipi seçin.' });
    min(path.manufactureYear, 1900, { message: 'Üretim yılı 1900 veya sonrası olmalı.' });
    max(path.manufactureYear, 2100, { message: 'Üretim yılı 2100 veya öncesi olmalı.' });
    required(path.lengthInMeters, { message: 'Tekne uzunluğu gerekli.' });
    validate(path.lengthInMeters, (ctx) => {
      const value = ctx.value();
      return value !== null && value <= 0
        ? { kind: 'greaterThanZero', message: 'Uzunluk 0’dan büyük olmalı.' }
        : undefined;
    });
    required(path.totalCapacity, { message: 'Toplam kapasite gerekli.' });
    min(path.totalCapacity, 1, { message: 'Toplam kapasite en az 1 olmalı.' });
    required(path.diningCapacity, { message: 'Yemekli kapasite gerekli.' });
    min(path.diningCapacity, 0, { message: 'Yemekli kapasite negatif olamaz.' });
    required(path.swimmingCapacity, { message: 'Yüzme turu kapasitesi gerekli.' });
    min(path.swimmingCapacity, 0, { message: 'Yüzme turu kapasitesi negatif olamaz.' });
    required(path.cityId, { message: 'Şehir seçin.' });
    validate(path.harborIds, (ctx) =>
      ctx.value().length === 0
        ? { kind: 'minSelected', message: 'En az bir liman seçin.' }
        : undefined,
    );
    required(path.primaryHarborId, { message: 'Bağlı olduğu limanı seçin.' });
    validate(path.primaryHarborId, (ctx) => {
      const value = ctx.value();
      return value !== '' && !ctx.valueOf(path.harborIds).includes(Number(value))
        ? {
            kind: 'primaryInHarbors',
            message: 'Bağlı olduğu liman, seçili limanlar arasında olmalı.',
          }
        : undefined;
    });
    maxLength(path.description, 1000, { message: 'Açıklama en fazla 1000 karakter olabilir.' });
  });

  onCityChange(): void {
    this.model.update((m) => ({ ...m, harborIds: [], primaryHarborId: '' }));
  }

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
        cityId: Number(m.cityId),
        primaryHarborId: Number(m.primaryHarborId),
        harborIds: m.harborIds,
        description: m.description.trim() || undefined,
      };
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
    });
  }
}
