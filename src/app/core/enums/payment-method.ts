/**
 * Kalan ödemenin kabul edildiği yöntem.
 *
 * Kaynak: `Tekne.Project.Shema/Enums/PaymentMethod.cs`. Backend'de sayısal
 * (`Cash = 1`) ama JSON'a isimle serialize edilir. Tekne başına en az bir
 * yöntem seçilmek zorundadır.
 */
export enum PaymentMethod {
  Cash = 'Cash',
  BankTransfer = 'BankTransfer',
  CreditCard = 'CreditCard',
}
