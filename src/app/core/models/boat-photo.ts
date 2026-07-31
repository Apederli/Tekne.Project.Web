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

/**
 * Gösterim sırası: ana fotoğraf başta, gerisi `sortOrder` artan.
 *
 * `PhotoUploader` ve `PhotoGallery` aynı fotoğrafı kapak saymalı — market kartı
 * ile partner listesinin farklı fotoğrafla açılması istenmez. Ölçüt bu yüzden
 * modelin yanında tek yerde tutulur, iki bileşen de buradan çağırır.
 */
export function sortBoatPhotos(photos: BoatPhotoOutputModel[]): BoatPhotoOutputModel[] {
  return [...photos].sort((a, b) => {
    if (a.isMain !== b.isMain) return a.isMain ? -1 : 1;
    return a.sortOrder - b.sortOrder;
  });
}
