/** Auth modalının görünümleri. */
export type AuthView = 'login' | 'register';

/** `AuthModalService.open` → `AuthModal` diyalog context'i. */
export interface AuthModalContext {
  /** Modalın açılış görünümü. */
  view: AuthView;
}

/**
 * Kayıt FORMUNUN modeli — API modelinden bilinçli olarak ayrı: Signal
 * Forms'ta isteğe bağlı (`?:`) alanlar `MaybeFieldTree` üretir ve bileşen
 * girdileriyle (`FieldTree`) uyuşmaz. Formda tüm alanlar zorunlu string
 * tutulur; API'ye submit sırasında `RegisterUserInputModel`'e map'lenir
 * (boş telefon → iki alan da undefined).
 */
export interface RegisterFormModel {
  email: string;
  password: string;
  /** Yalnız formda yaşar: `password` ile eşleşmesi doğrulanır, API'ye gitmez. */
  passwordRepeat: string;
  name: string;
  surname: string;
  phoneNumber: string;
  phoneNumberDialCode: string;
  /** Yalnız formda yaşar: sözleşme onayı zorunlu, API'ye gitmez. */
  termsAccepted: boolean;
}
