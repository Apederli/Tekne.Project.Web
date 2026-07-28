import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideRouter, withComponentInputBinding, withInMemoryScrolling } from '@angular/router';
import { provideClientHydration } from '@angular/platform-browser';

import { routes } from './app.routes';
import { authInterceptor } from '@interceptors/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(
      routes,
      // Route parametrelerini bileşen input'larına bağlar (BoatDetail.slug gibi)
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }),
    ),
    // `withFetch()` yok: v22'de FetchBackend zaten varsayılan HttpBackend,
    // fonksiyon deprecate edildi. authInterceptor API isteklerine auth
    // cookie'sinin gidip gelmesi için withCredentials ekliyor.
    provideHttpClient(withInterceptors([authInterceptor])),
    provideClientHydration(),
  ],
};
