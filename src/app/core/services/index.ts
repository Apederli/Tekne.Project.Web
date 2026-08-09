/**
 * Servis barrel'ı — `@services` alias'ı buraya çözülür, birden çok servis
 * tek import satırında alınabilir:
 *
 *   import { BoatService, HarborService } from '@services';
 *
 * Kural: bu dosya YALNIZCA re-export içerir. Mantık veya tip tanımı koyma —
 * barrel'a giren her bağımlılık, barrel'ı import eden herkese bulaşır ve
 * döngüsel import üretmesi kolaydır. Yeni servis ekleyince buraya satırını yaz.
 */

export * from './amenity.service';
export * from './boat-amenity.service';
export * from './boat-photo.service';
export * from './boat-usage-term.service';
export * from './boat.service';
export * from './harbor.service';
export * from './pending-requests.service';
export * from './toast.service';
export * from './usage-term.service';
export * from './user.service';
