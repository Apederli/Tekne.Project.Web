/**
 * Konum modelleri.
 *
 * Kaynak: `Tekne.Project.Shema/Model/Harbor.cs`.
 *
 * Hiyerarşi `City` → `Harbor`: bir tekne tek şehirde hizmet verir, o şehrin
 * birden çok limanından kalkabilir. `GET /api/Harbors` yalnızca limanı olan
 * şehirleri, limanları gömülü hâlde döner — cascading dropdown tek istekle
 * doldurulabilsin diye.
 */

export interface HarborOutputModel {
  id: number;
  name: string;
  boatCount?: number;
}

/** `GET /api/Harbors` ve `GET /api/Harbors/market` yanıtlarındaki dizinin eleman tipi. */
export interface CityHarborsOutputModel {
  cityId: number;
  cityName: string;
  boatCount?: number;
  harbors: HarborOutputModel[];
}
