import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { API_BASE_URL } from '../api/api.config';

/**
 * API'ye giden isteklere `withCredentials` ekler.
 *
 * Backend girişte token'ı HttpOnly cookie olarak yazıyor ve sonraki isteklerde
 * `Authorization` header'ı yoksa onu okuyor. Cookie farklı origin'den geldiği
 * için bu bayrak olmadan ne yazılır ne de geri gönderilir — yani her servis
 * metodunda tek tek yazmak yerine burada bir kez set ediliyor.
 *
 * Yalnızca `API_BASE_URL` ile başlayan istekler dokunuluyor; üçüncü taraf
 * adreslere kimlik bilgisi sızdırmamak için eşleşmeyenler olduğu gibi geçiyor.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const baseUrl = inject(API_BASE_URL);

  if (!req.url.startsWith(baseUrl)) {
    return next(req);
  }

  return next(req.clone({ withCredentials: true }));
};
