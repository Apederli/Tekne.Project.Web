import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api/api.config';
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

  /** E-posta + şifre ile giriş. Rol ayrımı yanıtta değil, token claim'lerindedir. */
  login(model: LoginInputModel): Observable<LoginOutputModel> {
    return this.http.post<LoginOutputModel>(`${this.baseUrl}/login`, model);
  }

  /**
   * Çıkış — yalnızca auth cookie'sini siler. Token stateless olduğu için
   * sunucuda iptal edilmez; elde tutulan bir kopya süresi dolana dek geçerlidir.
   */
  logout(): Observable<boolean> {
    return this.http.post<boolean>(`${this.baseUrl}/logout`, null);
  }

  /** Token'daki kullanıcının bilgileri. Oturum yoksa 401 döner. */
  me(): Observable<UserOutputModel> {
    return this.http.get<UserOutputModel>(`${this.baseUrl}/me`);
  }
}
