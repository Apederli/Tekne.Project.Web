import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormField, email, form, minLength, required, submit } from '@angular/forms/signals';
import { ROUTE_PARTNER } from '../../../core/routes.const';
import { LoginInputModel } from '@models/user';

@Component({
  selector: 'app-partner-login',
  imports: [FormField],
  templateUrl: './partner-login.html',
})
export class PartnerLogin {
  router = inject(Router);

  model = signal<LoginInputModel>({ email: '', password: '' });

  loginForm = form(this.model, (path) => {
    required(path.email, { message: 'E-posta adresi gerekli.' });
    email(path.email, { message: 'Geçerli bir e-posta adresi girin.' });
    required(path.password, { message: 'Şifre gerekli.' });
    minLength(path.password, 6, { message: 'Şifre en az 6 karakter olmalı.' });
  });

  serverError = signal<string | null>(null);

  async signIn(): Promise<void> {
    this.serverError.set(null);

    await submit(this.loginForm, async () => {
      // TODO: Backend bağlanınca AuthStore üzerinden gerçek kimlik doğrulama yapılacak,
      // ardından ROUTE_PARTNER.dashboard'a yönlendirilecek.
      this.serverError.set('Giriş servisi henüz bağlanmadı.');
    });
  }

  goToDashboard(): void {
    this.router.navigate(['/', ROUTE_PARTNER.main]);
  }
}
