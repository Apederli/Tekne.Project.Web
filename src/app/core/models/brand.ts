/**
 * Marka katalogu — `GET /api/Boats/brands`. Sunucu sıralar: "Özel Tasarım"
 * (id 1) her zaman ilk, kalanı alfabetik. İstemci yeniden sıralamaz.
 */
export interface BrandOutputModel {
  id: number;
  name: string;
}
