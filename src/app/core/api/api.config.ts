import { InjectionToken } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * API kök adresi.
 *
 * Varsayılan değer ortam dosyasından gelir (`development` build'inde
 * `fileReplacements` devreye girer). Token olarak durmasının sebebi: SSR'da
 * sunucu bundle'ının tarayıcıdan farklı bir adrese ihtiyaç duyabilmesi —
 * `app.config.server.ts` içinden override edilebilir, ortam dosyası ise
 * build başına sabittir.
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => environment.apiBaseUrl,
});
