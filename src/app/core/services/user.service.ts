import { Service, inject } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api/api.config';
import { SILENT_ERRORS } from '@interceptors/error.interceptor';
import {
  LoginInputModel,
  LoginOutputModel,
  RegisterUserInputModel,
  UserOutputModel,
} from '@models/user';

/**
 * `UsersController` (`/api/Users`) karşılığı — kayıt, giriş, çıkış ve
 * mevcut kullanıcı.
 *
 * Auth cookie'sinin taşınması `authInterceptor`'ın işi; burada `withCredentials`
 * geçilmiyor.
 *
 * Hata gövdeleri JSON nesnesi değil düz metin: backend `Result<T>` içindeki
 * mesajı doğrudan döner (400 iş kuralı, 422 doğrulama, 403 yetki).
 */
@Service()
export class UserService {
  http = inject(HttpClient);
  baseUrl = `${inject(API_BASE_URL)}/Users`;

  /** Public kayıt — oluşan kullanıcı her zaman `Customer` tipindedir. */
  register(model: RegisterUserInputModel): Observable<boolean> {
    return this.http.post<boolean>(`${this.baseUrl}/register`, model);
  }

  /**
   * Müşteri sitesi ve mobil girişi — tüm hesap türleri kabul edilir.
   * Rol ayrımı yanıtta değil, token claim'lerindedir.
   */
  login(model: LoginInputModel): Observable<LoginOutputModel> {
    return this.http.post<LoginOutputModel>(`${this.baseUrl}/login`, model);
  }

  /**
   * Tekne sahibi paneli girişi — yalnızca `Partner` hesapları.
   *
   * Portal kısıtı adreste olduğu için gövdede hesap türü göndermiyoruz;
   * tür tutmazsa backend cookie yazmadan 400 döner.
   */
  loginPartner(model: LoginInputModel): Observable<LoginOutputModel> {
    return this.http.post<LoginOutputModel>(`${this.baseUrl}/login/partner`, model);
  }

  /**
   * Çıkış — yalnızca auth cookie'sini siler. Token stateless olduğu için
   * sunucuda iptal edilmez; elde tutulan bir kopya süresi dolana dek geçerlidir.
   */
  logout(): Observable<boolean> {
    return this.http.post<boolean>(`${this.baseUrl}/logout`, null);
  }

  /**
   * Token'daki kullanıcının bilgileri. Oturum yoksa 401 döner.
   *
   * `silent`: hata kullanıcıya gösterilmez — açılıştaki oturum geri yükleme
   * gibi 401'in olağan olduğu çağrılar için.
   */
  me(options?: { silent?: boolean }): Observable<UserOutputModel> {
    const context = options?.silent ? new HttpContext().set(SILENT_ERRORS, true) : undefined;
    return this.http.get<UserOutputModel>(`${this.baseUrl}/me`, { context });
  }
}
