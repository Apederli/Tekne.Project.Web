/**
 * Teknenin imkan işaretleri (`/api/Boats/{boatId}/amenities`).
 *
 * Kaynak: `Tekne.Project.Shema/Model/BoatAmenity.cs`.
 *
 * Okuma yolu yok — işaretli imkanlar `BoatOutputModel.amenities` içinde döner.
 */

/**
 * Teknede bulunan imkanların **tam** listesi; kısmi güncelleme değildir.
 * Gönderilen liste ara tabloya birebir eşitlenir, boş liste tüm işaretleri
 * kaldırır.
 */
export interface BoatAmenityInputModel {
  amenityIds: number[];
}
