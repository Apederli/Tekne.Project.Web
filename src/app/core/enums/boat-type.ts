/**
 * Tekne tipi.
 *
 * Kaynak: `Tekne.Project.Shema/Enums/BoatType.cs`. Backend'de sayısal
 * (`Sailboat = 10`) ama JSON'a isimle serialize edilir.
 */
export enum BoatType {
  Sailboat = 'Sailboat',
  MotorYacht = 'MotorYacht',
  Catamaran = 'Catamaran',
  Gulet = 'Gulet',
}
