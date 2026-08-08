import { Component, inject, signal } from '@angular/core';
import { email, form, maxLength, minLength, required, submit } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { BrnDialogRef, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { HlmButton } from '@ui/button';
import { HlmDialogDescription, HlmDialogHeader, HlmDialogTitle } from '@ui/dialog';
import { AuthStore } from '../../../core/auth/auth-store';
import { AppInput } from '../../../shared/forms/app-input';
import { AppPhoneInput } from '../../../shared/forms/app-phone-input';
import {
  AuthModalContext,
  LoginInputModel,
  RegisterFormModel,
  RegisterUserInputModel,
  UserOutputModel,
} from '@models';
import { ToastService, UserService } from '@services';

@Component({
  selector: 'app-auth-modal',
  imports: [AppInput, AppPhoneInput, HlmButton, HlmDialogDescription, HlmDialogHeader, HlmDialogTitle],
  templateUrl: './auth-modal.html',
})
export class AuthModal {
  ref = inject<BrnDialogRef<void>>(BrnDialogRef);
  context = injectBrnDialogContext<AuthModalContext>();
  userService = inject(UserService);
  authStore = inject(AuthStore);
  toastService = inject(ToastService);

  view = signal(this.context.view);

  loginModel = signal<LoginInputModel>({ email: '', password: '' });
  // Login kuralları backend'in login doğrulayıcısıyla birebir — uzunluk kuralı yok.
  loginForm = form(this.loginModel, (path) => {
    required(path.email, { message: 'E-posta adresi gerekli.' });
    email(path.email, { message: 'Geçerli bir e-posta adresi girin.' });
    required(path.password, { message: 'Şifre gerekli.' });
  });

  registerModel = signal<RegisterFormModel>({
    email: '',
    password: '',
    name: '',
    surname: '',
    phoneNumber: '',
    phoneNumberDialCode: '+90',
  });
  // Kayıt kuralları backend'in register doğrulayıcısıyla birebir.
  registerForm = form(this.registerModel, (path) => {
    required(path.name, { message: 'Ad gerekli.' });
    maxLength(path.name, 50, { message: 'Ad en fazla 50 karakter olabilir.' });
    required(path.surname, { message: 'Soyad gerekli.' });
    maxLength(path.surname, 50, { message: 'Soyad en fazla 50 karakter olabilir.' });
    required(path.email, { message: 'E-posta adresi gerekli.' });
    email(path.email, { message: 'Geçerli bir e-posta adresi girin.' });
    maxLength(path.email, 300, { message: 'E-posta en fazla 300 karakter olabilir.' });
    required(path.password, { message: 'Şifre gerekli.' });
    minLength(path.password, 6, { message: 'Şifre en az 6 karakter olmalı.' });
    maxLength(path.password, 100, { message: 'Şifre en fazla 100 karakter olabilir.' });
    maxLength(path.phoneNumber, 14, { message: 'Telefon en fazla 14 hane olabilir.' });
  });

  async signIn(): Promise<void> {
    await submit(this.loginForm, async () => {
      try {
        const login = await firstValueFrom(this.userService.login(this.loginModel()));
        this.finishSignIn(login.user, `Hoş geldin, ${login.user.name}`);
      } catch {
        // Mesajı errorInterceptor gösterdi; modal açık kalır, oturum temiz.
        this.authStore.setUser(null);
      }
    });
  }

  async signUp(): Promise<void> {
    await submit(this.registerForm, async () => {
      const model = this.registerModel();
      const input: RegisterUserInputModel = {
        ...model,
        // Numara boşsa iki alan da gönderilmez — tek başına alan kodu anlamsız.
        phoneNumber: model.phoneNumber || undefined,
        phoneNumberDialCode: model.phoneNumber ? model.phoneNumberDialCode : undefined,
      };

      try {
        await firstValueFrom(this.userService.register(input));
      } catch {
        // Kayıt düştü (mesajı interceptor gösterdi) — otomatik girişe geçilmez.
        return;
      }

      try {
        const login = await firstValueFrom(
          this.userService.login({ email: model.email, password: model.password }),
        );
        this.finishSignIn(login.user, 'Hesabın oluşturuldu, hoş geldin');
      } catch {
        // Hesap OLUŞTU ama otomatik giriş düştü (uç durum): tekrar kayıt
        // denenmesin diye login görünümüne e-posta dolu geçilir.
        this.loginModel.update((m) => ({ ...m, email: model.email }));
        this.view.set('login');
      }
    });
  }

  finishSignIn(user: UserOutputModel, message: string): void {
    this.authStore.setUser(user);
    void this.toastService.success(message);
    this.ref.close();
  }
}
