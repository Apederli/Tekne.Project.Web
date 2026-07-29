import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
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
import { firstValueFrom } from 'rxjs';
import { BoatType } from '@enums/boat-type';
import { RentalType } from '@enums/rental-type';
import { BoatFormModel, BoatInputModel } from '@models/boat';
import { BoatService } from '@services/boat.service';
import { HarborService } from '@services/harbor.service';
import { ROUTE_PARTNER } from '../../../core/routes.const';

@Component({
  selector: 'app-boat-form',
  imports: [FormField, RouterLink],
  templateUrl: './boat-form.html',
})
export class BoatForm {
  router = inject(Router);
  boatService = inject(BoatService);
  harborService = inject(HarborService);

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

  cities = toSignal(this.harborService.getAll(), { initialValue: [] });

  model = signal<BoatFormModel>({
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
  });

  /** Seçili şehrin limanları — liman seçim satırları buradan çizilir. */
  harbors = computed(() => {
    const cityId = Number(this.model().cityId);
    return this.cities().find((c) => c.cityId === cityId)?.harbors ?? [];
  });

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
    required(path.primaryHarborId, { message: 'Ana liman seçin.' });
    validate(path.primaryHarborId, (ctx) => {
      const value = ctx.value();
      return value !== '' && !ctx.valueOf(path.harborIds).includes(Number(value))
        ? { kind: 'primaryInHarbors', message: 'Ana liman, seçili limanlar arasında olmalı.' }
        : undefined;
    });
    maxLength(path.description, 1000, { message: 'Açıklama en fazla 1000 karakter olabilir.' });
  });

  onCityChange(): void {
    this.model.update((m) => ({ ...m, harborIds: [], primaryHarborId: '' }));
  }

  isHarborSelected(id: number): boolean {
    return this.model().harborIds.includes(id);
  }

  isPrimaryHarbor(id: number): boolean {
    return this.model().primaryHarborId === String(id);
  }

  toggleHarbor(id: number, checked: boolean): void {
    this.model.update((m) => ({
      ...m,
      harborIds: checked ? [...m.harborIds, id] : m.harborIds.filter((h) => h !== id),
      primaryHarborId: !checked && m.primaryHarborId === String(id) ? '' : m.primaryHarborId,
    }));
    this.boatForm.harborIds().markAsTouched();
  }

  setPrimaryHarbor(id: number): void {
    this.model.update((m) => ({
      ...m,
      primaryHarborId: String(id),
      harborIds: m.harborIds.includes(id) ? m.harborIds : [...m.harborIds, id],
    }));
    this.boatForm.primaryHarborId().markAsTouched();
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
      // navigate'e ulaşılmaz, formda kalınır. Hatanın konsola/ErrorHandler'a
      // düşmesi kabul edilmiştir.
      await firstValueFrom(this.boatService.create(input));
      await this.router.navigate(this.boatsUrl);
    });
  }
}
