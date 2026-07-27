import { InjectionToken } from '@angular/core';

/**
 * API kök adresi. Backend belli olduğunda `app.config.ts` içinden override edilir;
 * sunucu tarafında mutlak, tarayıcıda göreli adres kullanılabilir.
 */
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  providedIn: 'root',
  factory: () => '/api',
});
