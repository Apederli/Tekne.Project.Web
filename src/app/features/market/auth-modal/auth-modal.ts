import { Component, inject, signal } from '@angular/core';
import {
  email,
  form,
  maxLength,
  minLength,
  required,
  submit,
  validate,
} from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideChevronLeft, lucideX } from '@ng-icons/lucide';
import { BrnDialogRef, injectBrnDialogContext } from '@spartan-ng/brain/dialog';
import { HlmButton } from '@ui/button';
import { HlmCheckboxImports } from '@ui/checkbox';
import { HlmDialogTitle } from '@ui/dialog';
import { AuthStore } from '../../../core/auth/auth-store';
import { AppInput, AppPasswordInput, AppPhoneInput } from '@forms';
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
  imports: [
    AppInput,
    AppPasswordInput,
    AppPhoneInput,
    HlmButton,
    HlmCheckboxImports,
    HlmDialogTitle,
    NgIcon,
  ],
  viewProviders: [provideIcons({ lucideChevronLeft, lucideX })],
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
    passwordRepeat: '',
    name: '',
    surname: '',
    phoneNumber: '',
    phoneNumberDialCode: '+90',
    termsAccepted: false,
  });
  // Kayıt kuralları backend'in register doğrulayıcısıyla birebir;
  // passwordRepeat ve termsAccepted yalnız formda yaşar, API'ye gitmez.
  // Yerleşik doğrulayıcılara mesaj yazılmaz — varsayılan metni gösterim
  // anında ErrorMessagePipe üretir; yalnız custom kurallar mesaj taşır.
  registerForm = form(this.registerModel, (path) => {
    required(path.name);
    maxLength(path.name, 50);
    required(path.surname);
    maxLength(path.surname, 50);
    required(path.email);
    email(path.email);
    maxLength(path.email, 300);
    required(path.password);
    minLength(path.password, 6);
    maxLength(path.password, 100);
    required(path.passwordRepeat);
    validate(path.passwordRepeat, ({ value, valueOf }) =>
      value() && value() !== valueOf(path.password)
        ? { kind: 'passwordMismatch', message: 'Şifreler eşleşmiyor.' }
        : undefined,
    );
    required(path.phoneNumber);
    maxLength(path.phoneNumber, 14);
    // Frontend'e özgü ek kural (backend'de karşılığı yok): +90 numarası
    // girildiyse tam 10 hane olmalı — maske eksik bırakılmışsa submit'te yakala.
    validate(path.phoneNumber, ({ value, valueOf }) =>
      value() && valueOf(path.phoneNumberDialCode) === '+90' && value().length < 10
        ? { kind: 'phoneIncomplete', message: 'Telefon numarası eksik — 10 hane olmalı.' }
        : undefined,
    );
    validate(path.termsAccepted, ({ value }) =>
      value()
        ? undefined
        : { kind: 'termsRequired', message: 'Devam etmek için sözleşmeleri kabul etmelisin.' },
    );
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
      // Form-only alanlar (passwordRepeat, termsAccepted) API'ye taşınmaz.
      const input: RegisterUserInputModel = {
        email: model.email,
        password: model.password,
        name: model.name,
        surname: model.surname,
        phoneNumber: model.phoneNumber,
        phoneNumberDialCode: model.phoneNumberDialCode,
      };

      // Kayıt başarıda giriş yapılmış döner (cookie + oturum) — ayrı login yok.
      // try/catch bilinçli yok: mesajı errorInterceptor gösterir; başarısızlıkta
      // finishSignIn'e ulaşılmaz, modal açık kalır.
      const session = await firstValueFrom(this.userService.register(input));
      this.finishSignIn(session.user, 'Hesabın oluşturuldu, hoş geldin');
    });
  }

  // Backend'de OAuth ucu yok — butonlar görsel yer tutucu (sözleşme
  // linkleriyle aynı yaklaşım); uçlar gelince gerçek akış bağlanacak.
  socialSignIn(provider: 'Google' | 'Apple'): void {
    void this.toastService.info(`${provider} ile giriş yakında aktif olacak.`);
  }

  finishSignIn(user: UserOutputModel, message: string): void {
    this.authStore.setUser(user);
    void this.toastService.success(message);
    this.ref.close();
  }
}
