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
}

/** `GET /api/Harbors` yanıtındaki dizinin eleman tipi. */
export interface CityHarborsOutputModel {
  cityId: number;
  cityName: string;
  harbors: HarborOutputModel[];
}
