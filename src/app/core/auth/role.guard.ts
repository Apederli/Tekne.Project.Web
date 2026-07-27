import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { AuthStore, UserRole } from './auth-store';

/**
 * Rol taşımayan kullanıcıyı giriş sayfasına yönlendirir.
 *
 * `canMatch` kullanıyoruz (`canActivate` değil): eşleşme başarısız olduğunda Angular
 * o route'un lazy chunk'ını hiç indirmez.
 */
export function roleGuard(role: UserRole): CanMatchFn {
  return () => {
    const auth = inject(AuthStore);
    const router = inject(Router);

    return auth.hasRole(role) ? true : router.createUrlTree(['/giris']);
  };
}
