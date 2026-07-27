import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormField, email, form, minLength, required, submit } from '@angular/forms/signals';
import { ROUTE_PARTNER } from '../../../core/routes.const';

interface PartnerLoginModel {
  email: string;
  password: string;
}

@Component({
  selector: 'app-partner-login',
  imports: [FormField],
  templateUrl: './partner-login.html',
})
export class PartnerLogin {
  private readonly router = inject(Router);

  private readonly model = signal<PartnerLoginModel>({ email: '', password: '' });

  protected readonly loginForm = form(this.model, (path) => {
    required(path.email, { message: 'E-posta adresi gerekli.' });
    email(path.email, { message: 'Geçerli bir e-posta adresi girin.' });
    required(path.password, { message: 'Şifre gerekli.' });
    minLength(path.password, 6, { message: 'Şifre en az 6 karakter olmalı.' });
  });

  protected readonly serverError = signal<string | null>(null);

  protected async signIn(): Promise<void> {
    this.serverError.set(null);

    await submit(this.loginForm, async () => {
      // TODO: Backend bağlanınca AuthStore üzerinden gerçek kimlik doğrulama yapılacak,
      // ardından ROUTE_PARTNER.dashboard'a yönlendirilecek.
      this.serverError.set('Giriş servisi henüz bağlanmadı.');
    });
  }

  protected goToDashboard(): void {
    this.router.navigate(['/', ROUTE_PARTNER.main]);
  }
}
