/**
 * Kullanıcı tipi — yetkilendirme / claim ayrımı için.
 *
 * Kaynak: `Tekne.Project.Shema/Enums/UserType.cs`. Backend'de sayısal
 * (`Customer = 10`) ama `JsonStringEnumConverter` kurulu olduğu için tel
 * üzerinde isimle taşınır — bu yüzden burada string enum.
 *
 * Not: buradaki `Partner`, bu projenin kodunda `provider` alanına karşılık gelir.
 */
export enum UserType {
  /** Müşteri kullanıcısı. */
  Customer = 'Customer',

  /** Tekne'yi işleten taraf — iç ekip / hizmet sağlayıcı. */
  Partner = 'Partner',

  /** Sistem yöneticisi. */
  Admin = 'Admin',
}
