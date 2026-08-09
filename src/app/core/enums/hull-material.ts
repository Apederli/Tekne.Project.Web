/**
 * Teknenin yapım malzemesi.
 *
 * Kaynak: `Tekne.Project.Shema/Enums/HullMaterial.cs`. Backend'de sayısal
 * (`Wood = 1`) ama JSON'a isimle serialize edilir. Alan opsiyoneldir —
 * doldurulmadığında hiç gönderilmez.
 */
export enum HullMaterial {
  Wood = 'Wood',
  Fiberglass = 'Fiberglass',
  Steel = 'Steel',
  Aluminum = 'Aluminum',
  Composite = 'Composite',
  Other = 'Other',
}
