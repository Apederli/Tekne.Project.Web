/**
 * Tekne modelleri.
 *
 * Kaynak: `Tekne.Project.Shema/Model/Boat.cs`. Swagger'da yalnızca
 * `BoatInputModel` var; `BoatOutputModel` handler'ın döndürdüğü tipten çıkarıldı.
 */

import { BoatType } from '@enums/boat-type';
import { RentalType } from '@enums/rental-type';
import { AmenityOutputModel } from '@models/amenity';
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

/**
 * `GET /api/Boats` sorgu filtreleri — tüm alanlar opsiyonel, boş alan süzmez.
 * Yeni filtreler (tarih/müsaitlik, kapasite…) backend'e eklendikçe buraya alan
 * olarak gelir; tarih filtresi rezervasyon modeli kurulduğunda eklenecek.
 */
export interface BoatListFilterInputModel {
  /** Bu limandan müşteri alan tekneler. */
  harborId?: number;
}

/**
 * `GET /api/Boats` yanıt elemanı — pazar yeri kartı. Kartın gösterdiği alanlarla
 * sınırlıdır; liman/şehir adları backend'de doldurulur, istemci lookup yapmaz.
 * `name` kartta gösterilmez ama detay linkinin slug'ı ondan üretilir.
 */
export interface BoatCardOutputModel {
  id: number;
  name: string;
  boatType: BoatType;
  totalCapacity: number;
  /** Bağlı liman — liman filtresi "X Kalkışlı" kıyasını bu id ile yapar. */
  primaryHarborId: number;
  primaryHarborName: string;
  cityName: string;
  photos: BoatPhotoOutputModel[];
}

/** `GET /api/Boats/mine` ve `GET /api/Boats/{id}` yanıt gövdesi. */
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
   * Buradaki her madde katalogda da (`GET /api/UsageTerms`) bulunur: katalog
   * değiştiğinde backend geçersiz kalan işaretleri kendisi temizliyor.
   */
  usageTerms?: UsageTermOutputModel[];

  /** Teknede bulunan imkanlar — `usageTerms` ile aynı kural: yalnızca tekil detayda gelir. */
  amenities?: AmenityOutputModel[];
}
