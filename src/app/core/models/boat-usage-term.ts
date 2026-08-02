/**
 * Teknenin kullanım şartı işaretleri (`/api/Boats/{boatId}/usage-terms`).
 *
 * Kaynak: `Tekne.Project.Shema/Model/BoatUsageTerm.cs`.
 *
 * Okuma yolu yok — işaretli şartlar `BoatOutputModel.usageTerms` içinde döner.
 */

/**
 * İşaretli şartların **tam** listesi; kısmi güncelleme değildir. Gönderilen
 * liste ara tabloya birebir eşitlenir, boş liste tüm işaretleri kaldırır.
 */
export interface BoatUsageTermInputModel {
  usageTermIds: number[];
}
