/**
 * Bir formun hangi amaçla açıldığı.
 *
 * Klasördeki diğer enum'lardan farklı olarak **backend karşılığı yok** —
 * yalnızca arayüz davranışını seçer (`BoatForm` hem oluşturma hem
 * güncelleme yapıyor).
 */
export enum FormMode {
  Create = 'Create',
  Update = 'Update',
}
