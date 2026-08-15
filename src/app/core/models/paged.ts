/**
 * Sayfalı liste yanıtı — backend'in `PagedResult<T>` altyapı tipinin karşılığı.
 *
 * `totalPages`, `hasPrevious` ve `hasNext` sunucuda hesaplanıp gövdeye yazılır;
 * istemci bunları `totalCount / pageSize`'dan yeniden türetmez. Sayfa boyutunu
 * da sunucu belirler — istekte `pageSize` diye bir alan yok.
 */
export interface PagedOutputModel<T> {
  items: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  hasPrevious: boolean;
  hasNext: boolean;
}
