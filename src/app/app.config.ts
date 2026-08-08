import {
  ApplicationConfig,
  PLATFORM_ID,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { provideClientHydration } from '@angular/platform-browser';
import { catchError, of, tap } from 'rxjs';
import { provideSpartanHlm } from '@ui/utils';

import { routes } from './app.routes';
import { AuthStore } from './core/auth/auth-store';
import { authInterceptor } from '@interceptors/auth.interceptor';
import { errorInterceptor } from '@interceptors/error.interceptor';
import { pendingRequestsInterceptor } from '@interceptors/pending-requests.interceptor';
import { UserService } from '@services';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // CDK overlay'in v21+ Popover API davranışını kapatır: top layer her
    // z-index'in üstünde olduğundan toast'lar dialog'un arkasında kalıyordu.
    provideSpartanHlm(),
    // Oturum geri yükleme: auth cookie'si hâlâ geçerliyse kullanıcıyı açılışta
    // hatırla. Bu, ilk yönlendirmeden ÖNCE bitmek zorunda — yoksa roleGuard boş
    // store'u görüp login'e atar (sayfa yenilemede yaşanan sorun buydu).
    // 401 = oturum yok, olağan durum: silent bayrağıyla alert'siz, catchError
    // ile bootstrap'i kırmadan anonim devam edilir.
    provideAppInitializer(() => {
      if (!isPlatformBrowser(inject(PLATFORM_ID))) return;

      const authStore = inject(AuthStore);
      return inject(UserService)
        .me({ silent: true })
        .pipe(
          tap((user) => authStore.setUser(user)),
          catchError(() => of(null)),
        );
    }),
    provideRouter(
      routes,
      // Route parametrelerini bileşen input'larına bağlar (BoatDetail.slug gibi)
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }),
    ),
    // `withFetch()` yok: v22'de FetchBackend zaten varsayılan HttpBackend,
    // fonksiyon deprecate edildi. authInterceptor API isteklerine auth
    // cookie'sinin gidip gelmesi için withCredentials ekliyor.
    // Sıra anlamlı: authInterceptor isteği hazırlar, errorInterceptor onun
    // dışında kalır ki yanıt yolunda hatayı en son o görsün.
    // pendingRequestsInterceptor üstteki ilerleme barının sayacını tutar.
    provideHttpClient(
      withInterceptors([pendingRequestsInterceptor, errorInterceptor, authInterceptor]),
    ),
    provideClientHydration(),
  ],
};
