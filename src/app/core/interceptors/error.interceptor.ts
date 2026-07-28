import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

/**
 * HTTP hatalarını tek yerden kullanıcıya gösterir.
 *
 * Hata **yutulmuyor**, gösterildikten sonra yeniden fırlatılıyor: bileşen
 * hâlâ başarısızlığı görmek zorunda (login'de yönlendirmeyi iptal etmek gibi).
 *
 * Auth interceptor'dan ayrı duruyor — onun işi kimlik bilgisi taşımak, bunun
 * işi hata sunmak. İkisini aynı dosyaya koymak dosyayı hızla şişiriyor.
 *
 * TODO: `alert` geçici. Tarayıcıyı kilitliyor, arka arkaya gelen hatalarda
 * kutular sıraya giriyor ve stil verilemiyor — bir toast bileşeniyle
 * değiştirilmeli.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (isBrowser) {
        alert(toMessage(error));
      } else {
        console.error('SSR HTTP hatası:', error.status, error.message);
      }

      return throwError(() => error);
    }),
  );
};

/**
 * Backend `Result<T>` hatalarını düz metin gövdeyle döner (400 iş kuralı,
 * 422 doğrulama, 403 yetki) — o durumda gövdenin kendisi mesajdır.
 */
function toMessage(error: HttpErrorResponse): string {
  if (typeof error.error === 'string' && error.error.trim().length > 0) {
    return error.error;
  }

  switch (error.status) {
    case 0:
      return 'Sunucuya ulaşılamadı. Bağlantınızı kontrol edin.';
    case 401:
      return 'Oturumunuz sona ermiş. Lütfen tekrar giriş yapın.';
    case 403:
      return 'Bu işlem için yetkiniz yok.';
    case 404:
      return 'Kayıt bulunamadı.';
    default:
      return 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.';
  }
}
