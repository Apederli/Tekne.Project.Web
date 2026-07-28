import { Service, computed, signal } from '@angular/core';

export type UserRole = 'customer' | 'provider' | 'admin';

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  roles: readonly UserRole[];
}

/**
 * Oturum durumunun tek kaynağı. Backend bağlanana kadar sadece bellekte tutuluyor;
 * login/logout akışı API katmanı hazır olduğunda buraya eklenecek.
 */
@Service()
export class AuthStore {
  currentUser = signal<AuthUser | null>(null);

  user = this.currentUser.asReadonly();
  isAuthenticated = computed(() => this.currentUser() !== null);

  hasRole(role: UserRole): boolean {
    return this.currentUser()?.roles.includes(role) ?? false;
  }

  setUser(user: AuthUser | null): void {
    this.currentUser.set(user);
  }
}
