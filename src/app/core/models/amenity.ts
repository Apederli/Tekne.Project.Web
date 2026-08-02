/**
 * İmkan katalogu modelleri (`/api/Amenities`).
 *
 * Kaynak: `Tekne.Project.Shema/Model/Amenity.cs`. Swagger'da yalnızca
 * `AmenityInputModel` var; çıktı tipi handler'ın döndürdüğü tipten çıkarıldı.
 *
 * İmkan, teknenin donanımıdır ("Wifi", "Güneşlenme Güvertesi"). Kullanım
 * şartlarından (`@models/usage-term`) ayrı bir katalogdur: imkanlar birbirini
 * dışlamaz ve kiralama tipinden bağımsızdır.
 */

/**
 * İmkan. `name` isteğin diline göre çözülmüş hâliyle döner — istemci ayrı bir
 * çeviri alanı almaz, dil `Accept-Language` (veya `?culture=`) üzerinden
 * backend'de belirlenir.
 */
export interface AmenityOutputModel {
  id: number;
  name: string;
}

/** `POST /api/Amenities` ve `PUT /api/Amenities/{id}` istek gövdesi. */
export interface AmenityInputModel {
  name: string;
  /** İngilizce ad. Boşsa İngilizce istekte de `name` (Türkçe) döner. */
  nameEn?: string;
  /** Boş bırakılırsa imkan listenin sonuna eklenir. */
  order?: number;
}
