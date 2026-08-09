/**
 * Model katalogu — `GET /api/Boats/brands/{brandId}/models`. Her zaman tek bir
 * markanın altında listelenir; katalogda modelsiz marka yok.
 */
export interface BoatModelOutputModel {
  id: number;
  name: string;
}
