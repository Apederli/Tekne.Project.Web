/**
 * Kiralama tipi. Bir tekne tek tip yapar; şu anki odak saatlik.
 *
 * Kaynak: `Tekne.Project.Shema/Enums/RentalType.cs`. Backend'de sayısal
 * (`Hourly = 10`) ama JSON'a isimle serialize edilir.
 */
export enum RentalType {
  Hourly = 'Hourly',
  Daily = 'Daily',
}
