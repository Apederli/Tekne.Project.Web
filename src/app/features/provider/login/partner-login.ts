import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormField, email, form, minLength, required, submit } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { ROUTE_PARTNER } from '../../../core/routes.const';
import { AuthStore } from '../../../core/auth/auth-store';
import { LoginInputModel } from '@models';
import { UserService } from '@services';

@Component({
  selector: 'app-partner-login',
  imports: [FormField],
  templateUrl: './partner-login.html',
})
export class PartnerLogin {
  router = inject(Router);
  userService = inject(UserService);
  authStore = inject(AuthStore);

  model = signal<LoginInputModel>({ email: '', password: '' });

  loginForm = form(this.model, (path) => {
    required(path.email, { message: 'E-posta adresi gerekli.' });
    email(path.email, { message: 'Geçerli bir e-posta adresi girin.' });
    required(path.password, { message: 'Şifre gerekli.' });
    minLength(path.password, 6, { message: 'Şifre en az 6 karakter olmalı.' });
  });

  async signIn(): Promise<void> {
    await submit(this.loginForm, async () => {
      try {
        // Partner'a özel adres: hesap Partner değilse backend cookie'yi hiç
        // yazmadan 400 döner, yani müşteri hesabı bu panelden içeri giremez.
        await firstValueFrom(this.userService.loginPartner(this.model()));

        // Login yanıtı yalnızca token taşıyor (o da mobil için) — kullanıcı
        // bilgisi ayrı bir istekle alınıyor.
        this.authStore.setUser(await firstValueFrom(this.userService.me()));

        await this.router.navigate(['/', ROUTE_PARTNER.main, ROUTE_PARTNER.dashboard]);
      } catch {
        // Mesajı errorInterceptor gösterdi; burada sadece yönlendirmeyi iptal
        // edip oturumu temiz bırakıyoruz.
        this.authStore.setUser(null);
      }
    });
  }
}
