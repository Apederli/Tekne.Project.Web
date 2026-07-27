import { inject } from '@angular/core';
import { CanMatchFn, Router } from '@angular/router';
import { AuthStore, UserRole } from './auth-store';

/**
 * Rol taşımayan kullanıcıyı `redirectTo`'ya yönlendirir.
 *
 * `canMatch` kullanıyoruz (`canActivate` değil): eşleşme başarısız olduğunda Angular
 * o route'un lazy chunk'ını hiç indirmez.
 *
 * TODO: Yönlendirme `returnUrl` taşımıyor — giriş sonrası kullanıcı gitmek
 * istediği sayfaya değil, panelin köküne düşüyor.
 */
export function roleGuard(role: UserRole, redirectTo: readonly string[] = ['/']): CanMatchFn {
  return () => {
    const auth = inject(AuthStore);
    const router = inject(Router);

    return auth.hasRole(role) ? true : router.createUrlTree([...redirectTo]);
  };
}
