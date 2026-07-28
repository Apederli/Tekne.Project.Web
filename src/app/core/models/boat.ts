/**
 * Tekne modelleri.
 *
 * Kaynak: `Tekne.Project.Shema/Model/Boat.cs`. Swagger'da yalnızca
 * `BoatInputModel` var; `BoatOutputModel` handler'ın döndürdüğü tipten çıkarıldı.
 */

import { BoatType } from '@enums/boat-type';
import { RentalType } from '@enums/rental-type';
import { BoatPhotoOutputModel } from '@models/boat-photo';

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
}
