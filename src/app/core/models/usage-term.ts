/**
 * Kullanım şartı katalogu modelleri (`/api/UsageTerms`).
 *
 * Kaynak: `Tekne.Project.Shema/Model/UsageTerm.cs`. Swagger'da yalnızca
 * `UsageTermInputModel` var; çıktı tipleri handler'ın döndürdüğü tipten
 * çıkarıldı.
 *
 * Kullanım şartı teknenin kuralıdır ("Evcil hayvan getirilemez"). İmkandan
 * (`@models/amenity`) iki farkı var: gruplanabilir ve kiralama tipine göre
 * süzülür.
 */

import { RentalType } from '@enums/rental-type';

/**
 * Birbirini dışlayan şartların grubu. Formda başlık olarak çizilir, altındaki
 * şartlar radio buton olur.
 *
 * Grupların kendi ucu yok — yalnızca `UsageTermOutputModel.group` içinde
 * gömülü gelir. Grup listesi gerekiyorsa şart listesinden türetilmeli.
 */
export interface UsageTermGroupOutputModel {
  id: number;
  name: string;
  order: number;
}

/**
 * Kullanım şartı. `name` isteğin diline göre çözülmüş hâliyle döner — istemci
 * ayrı bir çeviri alanı almaz, dil `Accept-Language` (veya `?culture=`)
 * üzerinden backend'de belirlenir.
 */
export interface UsageTermOutputModel {
  id: number;
  name: string;
  /**
   * Dolu ise bu şart aynı gruptaki diğer şartlarla birbirini dışlar — formda
   * checkbox değil radio buton olarak gösterilmeli. Boşsa şart tek yönlü bir
   * ifadedir, checkbox olur.
   */
  group?: UsageTermGroupOutputModel;
}

/** `POST /api/UsageTerms` ve `PUT /api/UsageTerms/{id}` istek gövdesi. */
export interface UsageTermInputModel {
  name: string;
  /** İngilizce ad. Boşsa İngilizce istekte de `name` (Türkçe) döner. */
  nameEn?: string;
  /** Mevcut bir grubun id'si; şart tek yönlü bir ifadeyse boş bırakılır. */
  groupId?: number;
  /** Boş bırakılırsa şart her iki kiralama tipinde de görünür. */
  rentalType?: RentalType;
  /** Boş bırakılırsa şart listenin sonuna eklenir. */
  order?: number;
}
