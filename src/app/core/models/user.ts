/**
 * Kullanıcı ve kimlik doğrulama modelleri.
 *
 * Kaynak: `Tekne.Project.Shema/Model/User.cs`. Swagger'da yalnızca input
 * şemaları var (endpoint'lerde `ProducesResponseType` yazılı değil, hepsi
 * `200: OK` dönüyor) — output modelleri backend'in `Result<T>` sarmaladığı
 * tiplerden birebir çıkarıldı.
 *
 * Ayrı bir partner login endpoint'i yok: her rol `POST /api/Users/login`
 * üzerinden giriş yapar, rol ayrımı JWT içindeki `UserType` claim'i ile olur.
 */

import { UserType } from '@enums/user-type';

/**
 * `POST /api/Users/register` istek gövdesi.
 *
 * Public kayıt her zaman `Customer` üretir — `userType` gönderilemez.
 */
export interface RegisterUserInputModel {
  email: string;
  password: string;
  name: string;
  surname: string;
  phoneNumber?: string;
  phoneNumberDialCode?: string;
}

/**
 * Giriş istek gövdesi — hem `POST /api/Users/login` hem
 * `POST /api/Users/login/partner` aynı gövdeyi alır.
 *
 * Portal kısıtı gövdede taşınmıyor, adresin kendisinde: `/login/partner`
 * yalnızca Partner hesaplarını kabul eder, tür tutmazsa backend cookie'yi hiç
 * yazmadan reddeder. Böylece istemcinin hesap türü beyan edebileceği bir alan
 * kalmıyor.
 */
export interface LoginInputModel {
  email: string;
  password: string;
}

/**
 * `POST /api/Users/login` yanıt gövdesi.
 *
 * Backend token'ı ayrıca HttpOnly cookie olarak da yazıyor; web tarafında
 * asıl taşıyıcı o cookie'dir, gövdedeki token mobil istemciler için duruyor.
 */
export interface LoginOutputModel {
  token: string;
  /** ISO 8601 tarih dizesi (backend `DateTime`). */
  expiresAt: string;
}

/** `GET /api/Users/me` yanıt gövdesi. Şifre hash'i hiçbir zaman dönmez. */
export interface UserOutputModel {
  id: number;
  email: string;
  name: string;
  surname: string;
  userType: UserType;
  phoneNumber?: string;
  phoneNumberDialCode?: string;
  /** Hesap doğrulanmış mı — kayıt sonrası `false` başlar. */
  isValid: boolean;
}
