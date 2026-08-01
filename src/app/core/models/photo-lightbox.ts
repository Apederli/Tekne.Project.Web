import { BoatPhotoOutputModel } from '@models/boat-photo';

/** `PhotoLightboxService.open` bağlamı — CDK `DIALOG_DATA` ile bileşene taşınır. */
export interface PhotoLightboxData {
  photos: BoatPhotoOutputModel[];
  /** Açılış slaytı — tıklanan fotoğrafın `sortBoatPhotos` sonrası index'i. */
  startIndex: number;
  /** Tekne adı — sayaç ve alt metinler bundan üretilir. */
  alt: string;
}
