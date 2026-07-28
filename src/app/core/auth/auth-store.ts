import { Service, computed, signal } from '@angular/core';
import { UserType } from '@enums/user-type';
import { UserOutputModel } from '@models/user';

/**
 * Uygulamanın erişim alanları. Backend'in `UserType`'ı ile birebir değil:
 * `Partner` burada `provider` olarak geçiyor (klasör ve guard adlandırması).
 */
export type UserRole = 'customer' | 'provider' | 'admin';

const ROLE_BY_USER_TYPE: Record<UserType, UserRole> = {
  [UserType.Customer]: 'customer',
  [UserType.Partner]: 'provider',
  [UserType.Admin]: 'admin',
};

/**
 * Oturum durumunun tek kaynağı — yalnızca bellekte.
 *
 * Token'ı tutmuyoruz: HttpOnly cookie'de duruyor, JS erişemiyor ve zaten
 * her isteğe tarayıcı ekliyor. Burada duran şey sadece kullanıcı bilgisi.
 *
 * Sayfa yenilendiğinde bu store boşalır ve guard kullanıcıyı giriş sayfasına
 * atar — cookie hâlâ geçerli olsa bile. Açılışta `/api/Users/me` ile oturumu
 * geri yüklemek bunu çözer, şimdilik bilinçli olarak kapsam dışı.
 */
@Service()
export class AuthStore {
  currentUser = signal<UserOutputModel | null>(null);

  user = this.currentUser.asReadonly();
  isAuthenticated = computed(() => this.currentUser() !== null);
  role = computed<UserRole | null>(() => {
    const user = this.currentUser();
    return user ? ROLE_BY_USER_TYPE[user.userType] : null;
  });

  hasRole(role: UserRole): boolean {
    return this.role() === role;
  }

  setUser(user: UserOutputModel | null): void {
    this.currentUser.set(user);
  }
}
