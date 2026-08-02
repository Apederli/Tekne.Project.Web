/**
 * Tekne modelleri.
 *
 * Kaynak: `Tekne.Project.Shema/Model/Boat.cs`. Swagger'da yalnızca
 * `BoatInputModel` var; `BoatOutputModel` handler'ın döndürdüğü tipten çıkarıldı.
 */

import { BoatType } from '@enums/boat-type';
import { RentalType } from '@enums/rental-type';
import { BoatPhotoOutputModel } from '@models/boat-photo';
import { UsageTermOutputModel } from '@models/usage-term';

/**
 * `POST /api/Boats` istek gövdesi.
 *
 * `ownerId` gönderilmez — backend token'daki kullanıcıdan set eder.
 */
export interface BoatInputModel {
  name: string;
  boatType: BoatType;
  rentalType: RentalType;
  manufactureYear?: number;
  lengthInMeters: number;
  diningCapacity: number;
  totalCapacity: number;
  swimmingCapacity: number;
  cityId: number;
  primaryHarborId: number;
  /** Teknenin ücretsiz alım limanları — `primaryHarborId` bu listede olmak zorunda. */
  harborIds: number[];
  description?: string;
}

/**
 * Tekne formunun çalışma kopyası. `BoatInputModel`'den farkı, alanların
 * "henüz doldurulmadı" hâlini taşıyabilmesi: sayısal inputlar boşken `null`,
 * select/radio kontrolleri native değerleri string tutar. Gönderimden hemen
 * önce `BoatInputModel`'e çevrilir.
 */
export interface BoatFormModel {
  name: string;
  boatType: BoatType | '';
  rentalType: RentalType | '';
  manufactureYear: number | null;
  lengthInMeters: number | null;
  diningCapacity: number | null;
  totalCapacity: number | null;
  swimmingCapacity: number | null;
  /** Native select değeri — `''` henüz seçilmedi demektir. */
  cityId: string;
  /** Native radio değeri — `''` henüz seçilmedi demektir. */
  primaryHarborId: string;
  harborIds: number[];
  description: string;
}

/** `GET /api/Boats` ve `GET /api/Boats/{id}` yanıt gövdesi. */
export interface BoatOutputModel {
  id: number;
  name: string;
  boatType: BoatType;
  rentalType: RentalType;
  manufactureYear?: number;
  lengthInMeters: number;
  diningCapacity: number;
  totalCapacity: number;
  swimmingCapacity: number;
  cityId: number;
  primaryHarborId: number;
  harborIds: number[];
  ownerId: number;
  description?: string;
  isActive: boolean;
  photos: BoatPhotoOutputModel[];
  /**
   * İşaretli kullanım şartları — yalnızca `GET /api/Boats/{id}` doldurur, liste
   * uçlarında alan hiç gelmez. Bu yüzden `undefined` "şartı yok" demek değil,
   * "bu yanıt şartları taşımıyor" demektir.
   *
   * Katalogda (`GET /api/UsageTerms`) olmayan maddeler de burada dönebilir:
   * admin sonradan pasifleştirmiş olabilir ve backend bunları bilinçli
   * filtrelemiyor. Ekranda yok sayılırlarsa bir sonraki kayıtta sessizce
   * silinirler.
   */
  usageTerms?: UsageTermOutputModel[];
}
