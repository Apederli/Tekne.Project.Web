/**
 * Tekne fotoğrafı modelleri (`/api/Boats/{boatId}/photos`).
 *
 * Kaynak: `Tekne.Project.Shema/Model/BoatPhoto.cs`.
 *
 * Oradaki `PhotoUploadFile` karşılanmadı: o, controller'ın `IFormFile`'dan
 * doldurup handler'a geçirdiği sunucu içi bir model. Yükleme tarafı
 * `multipart/form-data` olduğu için istemci `FormData` gönderir.
 */

/**
 * Fotoğraf kaydı. `POST /api/Boats/{boatId}/photos` yanıtında ve
 * `BoatOutputModel.photos` içinde döner.
 *
 * Yalnızca `objectKey` var — backend public URL tutmuyor (ilgili alan
 * migration ile kaldırıldı), görsel adresi istemci tarafında üretilir.
 */
export interface BoatPhotoOutputModel {
  id: number;
  objectKey: string;
  isMain: boolean;
  sortOrder: number;
}

/** `PUT /api/Boats/{boatId}/photos/order` istek gövdesi. */
export interface ReorderPhotosInputModel {
  photoIdsInOrder: number[];
}
