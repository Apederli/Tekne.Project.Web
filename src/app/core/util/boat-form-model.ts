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
    toiletCount: null,
    minimumRentalDuration: 1,
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
    toiletCount: boat.toiletCount,
    minimumRentalDuration: boat.minimumRentalDuration,
    cityId: String(boat.cityId),
    primaryHarborId: String(boat.primaryHarborId),
    harborIds: [...boat.harborIds],
    description: boat.description ?? '',
  };
}
