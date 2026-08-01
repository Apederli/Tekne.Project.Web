import { PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpInterceptorFn } from '@angular/common/http';
import { finalize } from 'rxjs';
import { PendingRequests } from '@services';

/**
 * Üstteki ilerleme barı için uçan istekleri sayar.
 *
 * Yalnızca tarayıcıda: server render sırasında sayaç hiç artmaz, bar SSR
 * HTML'ine hiç girmez — hydration uyuşmazlığı bu yüzden imkânsız.
 *
 * `finalize` başarıda, hatada ve iptalde de çalışır; sayaç asla asılı kalmaz.
 * Hata mesajıyla ilgilenmez — o iş errorInterceptor'da.
 */
export const pendingRequestsInterceptor: HttpInterceptorFn = (req, next) => {
  if (!isPlatformBrowser(inject(PLATFORM_ID))) return next(req);

  const pending = inject(PendingRequests);
  pending.increment();
  return next(req).pipe(finalize(() => pending.decrement()));
};
