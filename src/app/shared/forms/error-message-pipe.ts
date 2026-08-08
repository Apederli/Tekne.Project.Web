import { Pipe, PipeTransform } from '@angular/core';
import { NgValidationError, ValidationError } from '@angular/forms/signals';

/**
 * Validasyon hatasını kullanıcıya gösterilecek mesaja çevirir.
 *
 * Formda `message` yazılmışsa o kazanır; yazılmamışsa mesaj hatanın
 * `kind`'ı ve parametrelerinden (maxLength limiti gibi) burada üretilir —
 * formların yerleşik doğrulayıcılara mesaj yazması gerekmez, `required(path.x)`
 * yeterlidir. Alan adı mesaja girmez; etiket zaten alanın üstünde durur.
 * Çok dillilik gelirse çeviri tek bu noktaya girer.
 */
@Pipe({ name: 'errorMessage' })
export class ErrorMessagePipe implements PipeTransform {
  transform(error: ValidationError): string {
    if (error.message) return error.message;

    // Yerleşik doğrulayıcı hataları parametrelerini üzerinde taşır; union
    // `kind`'a göre daralır. Custom validate() hataları mesajsız bırakılırsa
    // default'a düşer.
    const e = error as NgValidationError;
    switch (e.kind) {
      case 'required':
        return 'Bu alan gerekli.';
      case 'email':
        return 'Geçerli bir e-posta adresi girin.';
      case 'minLength':
        return `En az ${e.minLength} karakter olmalı.`;
      case 'maxLength':
        return `En fazla ${e.maxLength} karakter olabilir.`;
      case 'min':
        return `En az ${e.min} olmalı.`;
      case 'max':
        return `En fazla ${e.max} olabilir.`;
      default:
        return 'Geçersiz değer.';
    }
  }
}
