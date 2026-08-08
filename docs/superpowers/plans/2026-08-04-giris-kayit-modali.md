# Giriş/kayıt modalı ve telefon girişi — uygulama planı

> **Ajan işçiler için:** GEREKLİ ALT BECERİ: bu planı görev görev uygulamak
> için `superpowers:subagent-driven-development` (önerilen) ya da
> `superpowers:executing-plans` kullan. Adımlar `- [ ]` kutucuklarıyla
> izlenir.

**Hedef:** Market header'ındaki placeholder "Giriş" / "Kayıt Ol" butonlarını
gerçek oturum akışına bağlamak: tek AuthModal (login ↔ register geçişli,
mobilde tam ekran), kayıt formundaki telefon için `app-phone-input`
(aranabilir ülke kodu combobox'ı) ve girişli duruma tepki veren header
(masaüstü popover menü, mobil bottom sheet).

**Yaklaşım:** Altyapı hazır — `UserService`, `AuthStore`, `/me` boot
restore, hata toast'ları çalışıyor. Login yanıtı artık kullanıcıyı da
döndürüyor (backend 2026-08-04); önce model güncellenip `me()` giriş
akışından çıkarılır. Modal `HlmDialogService` ile imperatif açılır
(`ConfirmService` kalıbı), formlar Signal Forms (partner-login kalıbı).
Hesap menüsü kurulu `popover` helm'iyle (dashboard-shell kalıbı) —
dropdown-menu KURULMAZ. Auth'a bağlı header parçaları `ngSkipHydration`'lı
iki küçük bileşene çıkarılır (SSR uyuşmazlığı önlemi).

**Teknoloji:** Angular 22 (signals, Signal Forms), spartan/ui helm
(dialog, popover, sheet, field, input, button — kurulu; combobox — bu
planda kurulur), ng-icons lucide, Tailwind v4.

**Tasarım belgesi:** [2026-08-04-giris-kayit-modali-design.md](../specs/2026-08-04-giris-kayit-modali-design.md)

## Global kısıtlar

Her görevin gereksinimleri bunları da içerir:

- **Yeni test yazılmaz** (proje kararı). Plan TDD döngüsü içermiyor; her
  görevin doğrulaması `npm test -- --watch=false` (derleme + regresyon) ve
  belirtilen elle kontroller.
- **Test baseline'ı (2026-08-04, bu iş başlamadan önce):**
  `Test Files 11 passed (11)` / `Tests 90 passed (90)`. Her görev sonunda
  bu sayılar korunmalı.
- **Angular 22 konvansiyonları:** `standalone`/`OnPush` yazma; erişim
  belirteci (`private`/`protected`/`readonly`) yazma; `inject()`;
  `@if`/`@for`; `input()`/`output()`; yeni singleton'larda `@Service()`.
- **Mobile-first:** taban sınıflar mobil düzeni tarif eder, `sm:`/`lg:`
  yalnızca büyütme yönünde. Dokunma hedefleri `h-10` ve üzeri.
- **Beklenen HTTP hataları için try/catch yazma** — mesajı
  `errorInterceptor` gösterir. İstisna: akış kontrolü için partner-login
  kalıbındaki gibi, gövdesi amaç taşıyan ve yorumlanmış `catch`'ler
  (yönlendirme iptali, view geçişi). Boş catch bırakma.
- **Interface/model tanımı bileşen dosyasında olmaz** → `core/models/`.
- **URL segmentleri `routes.const.ts`'ten** — string literal yazma.
- Türkçe kullanıcı metni ve kod yorumu (mevcut dosyalarla tutarlı).
- Commit mesajları İngilizce, kısa emir kipi (mevcut git log stili);
  sonuna `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>` satırı.

---

### Task 1: `LoginOutputModel.user` + giriş sonrası `me()` temizliği

Backend login yanıtına `user` ekledi; model buna uydurulur ve
partner-login'deki fazladan `me()` çağrısı kalkar.

**Dosyalar:**
- Değiştir: `src/app/core/models/user.ts`
- Değiştir: `src/app/features/provider/login/partner-login.ts`

**Arayüzler:**
- Üretir: `LoginOutputModel.user: UserOutputModel` — Task 5'teki modal
  akışları `login()` yanıtından bunu okuyacak.

- [ ] **Adım 1: `user.ts` — güncelliğini yitirmiş dosya yorumunu düzelt**

Dosya başındaki (9-10. satırlar) şu cümleyi:

```
 * Ayrı bir partner login endpoint'i yok: her rol `POST /api/Users/login`
 * üzerinden giriş yapar, rol ayrımı JWT içindeki `UserType` claim'i ile olur.
```

şununla değiştir:

```
 * Partner paneli girişi ayrı adresten yapılır (`POST /api/Users/login/partner`,
 * yalnızca Partner hesapları); market/mobil girişi `POST /api/Users/login`
 * tüm hesap türlerini kabul eder. Rol, JWT içindeki `UserType` claim'indedir.
```

- [ ] **Adım 2: `user.ts` — `LoginOutputModel`'e `user` ekle**

Mevcut tanımı:

```ts
/**
 * `POST /api/Users/login` yanıt gövdesi.
 *
 * Backend token'ı ayrıca HttpOnly cookie olarak da yazıyor; web tarafında
 * asıl taşıyıcı o cookie'dir, gövdedeki token mobil istemciler için duruyor.
 */
export interface LoginOutputModel {
  token: string;
  /** ISO 8601 tarih dizesi (backend `DateTime`). */
  expiresAt: string;
}
```

şununla değiştir:

```ts
/**
 * `POST /api/Users/login` yanıt gövdesi.
 *
 * Backend token'ı ayrıca HttpOnly cookie olarak da yazıyor; web tarafında
 * asıl taşıyıcı o cookie'dir, gövdedeki token mobil istemciler için duruyor.
 *
 * `user` gövdede döner (2026-08-04): web, token'ı cookie'den kullandığı
 * için claim'leri okuyamıyor — aksi hâlde her girişten sonra ayrıca `/me`
 * çağırmak gerekirdi. `me()` artık yalnızca açılıştaki oturum geri
 * yüklemede kullanılır.
 */
export interface LoginOutputModel {
  token: string;
  /** ISO 8601 tarih dizesi (backend `DateTime`). */
  expiresAt: string;
  /** Giriş yapan kullanıcı — `/me` yanıtıyla aynı gövde. */
  user: UserOutputModel;
}
```

Not: `UserOutputModel` aynı dosyada `LoginOutputModel`'den SONRA
tanımlı; interface'ler hoisted olduğu için sıra sorun değil, dosyayı
yeniden düzenleme.

- [ ] **Adım 3: `partner-login.ts` — `me()` çağrısını kaldır**

`signIn()` içindeki şu bloğu:

```ts
        // Partner'a özel adres: hesap Partner değilse backend cookie'yi hiç
        // yazmadan 400 döner, yani müşteri hesabı bu panelden içeri giremez.
        await firstValueFrom(this.userService.loginPartner(this.model()));

        // Login yanıtı yalnızca token taşıyor (o da mobil için) — kullanıcı
        // bilgisi ayrı bir istekle alınıyor.
        this.authStore.setUser(await firstValueFrom(this.userService.me()));
```

şununla değiştir:

```ts
        // Partner'a özel adres: hesap Partner değilse backend cookie'yi hiç
        // yazmadan 400 döner, yani müşteri hesabı bu panelden içeri giremez.
        const login = await firstValueFrom(this.userService.loginPartner(this.model()));

        // Login yanıtı kullanıcıyı da taşıyor — ayrıca `/me` çağrılmaz.
        this.authStore.setUser(login.user);
```

- [ ] **Adım 4: Testleri çalıştır**

Çalıştır: `npm test -- --watch=false`
Beklenen: `Test Files 11 passed (11)` / `Tests 90 passed (90)`

- [ ] **Adım 5: Commit**

```bash
git add src/app/core/models/user.ts src/app/features/provider/login/partner-login.ts
git commit -m "Use the user carried in the login response instead of calling /me"
```

---

### Task 2: spartan `combobox` helm'ini kur

Yaprak değişiklik: yalnızca `@ui/combobox` kullanılabilir hâle gelir.
Hesap menüsü için ek kurulum YOK — kurulu `popover` kullanılacak.

**Dosyalar:**
- Oluştur: `src/app/shared/ui/combobox/**` (generator üretir)
- Değiştir: `tsconfig.json` (generator `@ui/combobox` path'ini ekler)

**Arayüzler:**
- Üretir: `@ui/combobox` yolundan `HlmComboboxImports` (içinde
  `hlm-combobox`, `hlm-combobox-trigger`, `hlm-combobox-content`,
  `hlm-combobox-input`, `hlm-combobox-item`, `hlm-combobox-empty`,
  `hlmComboboxList`, `*hlmComboboxPortal`).

- [ ] **Adım 1: Generator'ı çalıştır**

```bash
npx ng g @spartan-ng/cli:ui combobox
```

Combobox'ın import ettiği `button`, `input-group`, `utils` helm'leri ve
`@spartan-ng/brain` zaten projede — generator bunları yeniden üretmek
isterse izin verme / üzerine yazma sorusuna hayır de.

- [ ] **Adım 2: `tsconfig.json` yolunu doğrula**

`compilerOptions.paths` içinde şu girdinin olduğunu doğrula (generator
eklemiş olmalı; eksikse mevcut girdilerin biçimine uyarak elle ekle):

```json
"@ui/combobox": ["./src/app/shared/ui/combobox/src/index.ts"]
```

- [ ] **Adım 3: Üretilen API'yi doğrula**

`src/app/shared/ui/combobox/src/index.ts` dosyasını aç ve
`HlmComboboxImports` dizisinin export edildiğini gör. Trigger-modlu
kompozisyonun beklenen şekli (Task 4 bu şablonu kullanacak — üretilen
seçici adları farklıysa Task 4'teki şablonu üretilene uyarla):

```html
<hlm-combobox [value]="..." (valueChange)="..." [itemToString]="...">
  <hlm-combobox-trigger>seçili değer</hlm-combobox-trigger>
  <hlm-combobox-content *hlmComboboxPortal>
    <hlm-combobox-input showTrigger="false" placeholder="Ara" />
    <hlm-combobox-empty>Sonuç yok.</hlm-combobox-empty>
    <div hlmComboboxList>
      <hlm-combobox-item [value]="item">…</hlm-combobox-item>
    </div>
  </hlm-combobox-content>
</hlm-combobox>
```

- [ ] **Adım 4: Testleri çalıştır**

Çalıştır: `npm test -- --watch=false`
Beklenen: 11 dosya / 90 test yeşil (kurulum mevcut kodu etkilemez).

- [ ] **Adım 5: Commit**

```bash
git add src/app/shared/ui/combobox tsconfig.json
git commit -m "Install the spartan combobox component"
```

---

### Task 3: `DialCodeOption` modeli ve ülke kodu verisi

**Dosyalar:**
- Oluştur: `src/app/core/models/dial-code.ts`
- Değiştir: `src/app/core/models/index.ts` (barrel satırı)
- Oluştur: `src/app/shared/forms/dial-codes.const.ts`

**Arayüzler:**
- Üretir: `DialCodeOption { iso2: string; dialCode: string }` (`@models`),
  `DIAL_CODES_SORTED: DialCodeOption[]`, `TURKEY_DIAL_CODE: DialCodeOption`,
  `countryName(iso2: string): string`, `flagEmoji(iso2: string): string`
  (hepsi `shared/forms/dial-codes.const.ts`'ten). Task 4 bunları tüketir.

- [ ] **Adım 1: `core/models/dial-code.ts` dosyasını oluştur**

```ts
/**
 * Telefon ülke kodu seçeneği (`app-phone-input`).
 *
 * Ülke ADI burada tutulmaz: Türkçe adlar çalışma anında
 * `Intl.DisplayNames('tr', { type: 'region' })` ile iso2'den üretilir —
 * 240 ülke adını elle yazmak hem hacim hem bakım yükü olurdu.
 */
export interface DialCodeOption {
  /** ISO 3166-1 alpha-2 bölge kodu (`Intl.DisplayNames` girdisi). */
  iso2: string;
  /** E.164 ülke kodu, `+` önekiyle (örn. `+90`). */
  dialCode: string;
}
```

- [ ] **Adım 2: Barrel'a ekle**

`src/app/core/models/index.ts` içine, alfabetik sıraya uyarak
(`./confirm` satırından sonra):

```ts
export * from './dial-code';
```

- [ ] **Adım 3: `shared/forms/dial-codes.const.ts` dosyasını oluştur**

```ts
import { DialCodeOption } from '@models';

/**
 * E.164 ülke kodları (ITU) — `app-phone-input`'un veri kaynağı.
 *
 * Sıralı DEĞİL: görünen sıra `DIAL_CODES_SORTED`'da Türkçe ada göre
 * kurulur. Bazı kodlar paylaşımlıdır (+1 ABD/Kanada/Karayipler, +7
 * Rusya/Kazakistan, +44 BK/adalar) — model yalnızca kodu sakladığı için
 * bu bir sorun değil; ekranda ülke seçimi bileşen içi durumda tutulur.
 */
export const DIAL_CODES: DialCodeOption[] = [
  // Avrupa
  { iso2: 'AL', dialCode: '+355' }, { iso2: 'AD', dialCode: '+376' },
  { iso2: 'AT', dialCode: '+43' }, { iso2: 'BA', dialCode: '+387' },
  { iso2: 'BE', dialCode: '+32' }, { iso2: 'BG', dialCode: '+359' },
  { iso2: 'BY', dialCode: '+375' }, { iso2: 'CH', dialCode: '+41' },
  { iso2: 'CY', dialCode: '+357' }, { iso2: 'CZ', dialCode: '+420' },
  { iso2: 'DE', dialCode: '+49' }, { iso2: 'DK', dialCode: '+45' },
  { iso2: 'EE', dialCode: '+372' }, { iso2: 'ES', dialCode: '+34' },
  { iso2: 'FI', dialCode: '+358' }, { iso2: 'FR', dialCode: '+33' },
  { iso2: 'GB', dialCode: '+44' }, { iso2: 'GR', dialCode: '+30' },
  { iso2: 'HR', dialCode: '+385' }, { iso2: 'HU', dialCode: '+36' },
  { iso2: 'IE', dialCode: '+353' }, { iso2: 'IS', dialCode: '+354' },
  { iso2: 'IT', dialCode: '+39' }, { iso2: 'LI', dialCode: '+423' },
  { iso2: 'LT', dialCode: '+370' }, { iso2: 'LU', dialCode: '+352' },
  { iso2: 'LV', dialCode: '+371' }, { iso2: 'MC', dialCode: '+377' },
  { iso2: 'MD', dialCode: '+373' }, { iso2: 'ME', dialCode: '+382' },
  { iso2: 'MK', dialCode: '+389' }, { iso2: 'MT', dialCode: '+356' },
  { iso2: 'NL', dialCode: '+31' }, { iso2: 'NO', dialCode: '+47' },
  { iso2: 'PL', dialCode: '+48' }, { iso2: 'PT', dialCode: '+351' },
  { iso2: 'RO', dialCode: '+40' }, { iso2: 'RS', dialCode: '+381' },
  { iso2: 'RU', dialCode: '+7' }, { iso2: 'SE', dialCode: '+46' },
  { iso2: 'SI', dialCode: '+386' }, { iso2: 'SK', dialCode: '+421' },
  { iso2: 'SM', dialCode: '+378' }, { iso2: 'UA', dialCode: '+380' },
  { iso2: 'VA', dialCode: '+39' }, { iso2: 'XK', dialCode: '+383' },
  // Asya
  { iso2: 'AE', dialCode: '+971' }, { iso2: 'AF', dialCode: '+93' },
  { iso2: 'AM', dialCode: '+374' }, { iso2: 'AZ', dialCode: '+994' },
  { iso2: 'BD', dialCode: '+880' }, { iso2: 'BH', dialCode: '+973' },
  { iso2: 'BN', dialCode: '+673' }, { iso2: 'BT', dialCode: '+975' },
  { iso2: 'CN', dialCode: '+86' }, { iso2: 'GE', dialCode: '+995' },
  { iso2: 'HK', dialCode: '+852' }, { iso2: 'ID', dialCode: '+62' },
  { iso2: 'IL', dialCode: '+972' }, { iso2: 'IN', dialCode: '+91' },
  { iso2: 'IQ', dialCode: '+964' }, { iso2: 'IR', dialCode: '+98' },
  { iso2: 'JO', dialCode: '+962' }, { iso2: 'JP', dialCode: '+81' },
  { iso2: 'KG', dialCode: '+996' }, { iso2: 'KH', dialCode: '+855' },
  { iso2: 'KP', dialCode: '+850' }, { iso2: 'KR', dialCode: '+82' },
  { iso2: 'KW', dialCode: '+965' }, { iso2: 'KZ', dialCode: '+7' },
  { iso2: 'LA', dialCode: '+856' }, { iso2: 'LB', dialCode: '+961' },
  { iso2: 'LK', dialCode: '+94' }, { iso2: 'MM', dialCode: '+95' },
  { iso2: 'MN', dialCode: '+976' }, { iso2: 'MO', dialCode: '+853' },
  { iso2: 'MV', dialCode: '+960' }, { iso2: 'MY', dialCode: '+60' },
  { iso2: 'NP', dialCode: '+977' }, { iso2: 'OM', dialCode: '+968' },
  { iso2: 'PH', dialCode: '+63' }, { iso2: 'PK', dialCode: '+92' },
  { iso2: 'PS', dialCode: '+970' }, { iso2: 'QA', dialCode: '+974' },
  { iso2: 'SA', dialCode: '+966' }, { iso2: 'SG', dialCode: '+65' },
  { iso2: 'SY', dialCode: '+963' }, { iso2: 'TH', dialCode: '+66' },
  { iso2: 'TJ', dialCode: '+992' }, { iso2: 'TL', dialCode: '+670' },
  { iso2: 'TM', dialCode: '+993' }, { iso2: 'TR', dialCode: '+90' },
  { iso2: 'TW', dialCode: '+886' }, { iso2: 'UZ', dialCode: '+998' },
  { iso2: 'VN', dialCode: '+84' }, { iso2: 'YE', dialCode: '+967' },
  // Afrika
  { iso2: 'AO', dialCode: '+244' }, { iso2: 'BF', dialCode: '+226' },
  { iso2: 'BI', dialCode: '+257' }, { iso2: 'BJ', dialCode: '+229' },
  { iso2: 'BW', dialCode: '+267' }, { iso2: 'CD', dialCode: '+243' },
  { iso2: 'CF', dialCode: '+236' }, { iso2: 'CG', dialCode: '+242' },
  { iso2: 'CI', dialCode: '+225' }, { iso2: 'CM', dialCode: '+237' },
  { iso2: 'CV', dialCode: '+238' }, { iso2: 'DJ', dialCode: '+253' },
  { iso2: 'DZ', dialCode: '+213' }, { iso2: 'EG', dialCode: '+20' },
  { iso2: 'EH', dialCode: '+212' }, { iso2: 'ER', dialCode: '+291' },
  { iso2: 'ET', dialCode: '+251' }, { iso2: 'GA', dialCode: '+241' },
  { iso2: 'GH', dialCode: '+233' }, { iso2: 'GM', dialCode: '+220' },
  { iso2: 'GN', dialCode: '+224' }, { iso2: 'GQ', dialCode: '+240' },
  { iso2: 'GW', dialCode: '+245' }, { iso2: 'KE', dialCode: '+254' },
  { iso2: 'KM', dialCode: '+269' }, { iso2: 'LR', dialCode: '+231' },
  { iso2: 'LS', dialCode: '+266' }, { iso2: 'LY', dialCode: '+218' },
  { iso2: 'MA', dialCode: '+212' }, { iso2: 'MG', dialCode: '+261' },
  { iso2: 'ML', dialCode: '+223' }, { iso2: 'MR', dialCode: '+222' },
  { iso2: 'MU', dialCode: '+230' }, { iso2: 'MW', dialCode: '+265' },
  { iso2: 'MZ', dialCode: '+258' }, { iso2: 'NA', dialCode: '+264' },
  { iso2: 'NE', dialCode: '+227' }, { iso2: 'NG', dialCode: '+234' },
  { iso2: 'RE', dialCode: '+262' }, { iso2: 'RW', dialCode: '+250' },
  { iso2: 'SC', dialCode: '+248' }, { iso2: 'SD', dialCode: '+249' },
  { iso2: 'SL', dialCode: '+232' }, { iso2: 'SN', dialCode: '+221' },
  { iso2: 'SO', dialCode: '+252' }, { iso2: 'SS', dialCode: '+211' },
  { iso2: 'ST', dialCode: '+239' }, { iso2: 'SZ', dialCode: '+268' },
  { iso2: 'TD', dialCode: '+235' }, { iso2: 'TG', dialCode: '+228' },
  { iso2: 'TN', dialCode: '+216' }, { iso2: 'TZ', dialCode: '+255' },
  { iso2: 'UG', dialCode: '+256' }, { iso2: 'YT', dialCode: '+262' },
  { iso2: 'ZA', dialCode: '+27' }, { iso2: 'ZM', dialCode: '+260' },
  { iso2: 'ZW', dialCode: '+263' },
  // Amerika
  { iso2: 'AG', dialCode: '+1' }, { iso2: 'AI', dialCode: '+1' },
  { iso2: 'AR', dialCode: '+54' }, { iso2: 'AW', dialCode: '+297' },
  { iso2: 'BB', dialCode: '+1' }, { iso2: 'BM', dialCode: '+1' },
  { iso2: 'BO', dialCode: '+591' }, { iso2: 'BQ', dialCode: '+599' },
  { iso2: 'BR', dialCode: '+55' }, { iso2: 'BS', dialCode: '+1' },
  { iso2: 'BZ', dialCode: '+501' }, { iso2: 'CA', dialCode: '+1' },
  { iso2: 'CL', dialCode: '+56' }, { iso2: 'CO', dialCode: '+57' },
  { iso2: 'CR', dialCode: '+506' }, { iso2: 'CU', dialCode: '+53' },
  { iso2: 'CW', dialCode: '+599' }, { iso2: 'DM', dialCode: '+1' },
  { iso2: 'DO', dialCode: '+1' }, { iso2: 'EC', dialCode: '+593' },
  { iso2: 'GD', dialCode: '+1' }, { iso2: 'GF', dialCode: '+594' },
  { iso2: 'GP', dialCode: '+590' }, { iso2: 'GT', dialCode: '+502' },
  { iso2: 'GY', dialCode: '+592' }, { iso2: 'HN', dialCode: '+504' },
  { iso2: 'HT', dialCode: '+509' }, { iso2: 'JM', dialCode: '+1' },
  { iso2: 'KN', dialCode: '+1' }, { iso2: 'KY', dialCode: '+1' },
  { iso2: 'LC', dialCode: '+1' }, { iso2: 'MQ', dialCode: '+596' },
  { iso2: 'MS', dialCode: '+1' }, { iso2: 'MX', dialCode: '+52' },
  { iso2: 'NI', dialCode: '+505' }, { iso2: 'PA', dialCode: '+507' },
  { iso2: 'PE', dialCode: '+51' }, { iso2: 'PM', dialCode: '+508' },
  { iso2: 'PR', dialCode: '+1' }, { iso2: 'PY', dialCode: '+595' },
  { iso2: 'SR', dialCode: '+597' }, { iso2: 'SV', dialCode: '+503' },
  { iso2: 'SX', dialCode: '+1' }, { iso2: 'TC', dialCode: '+1' },
  { iso2: 'TT', dialCode: '+1' }, { iso2: 'US', dialCode: '+1' },
  { iso2: 'UY', dialCode: '+598' }, { iso2: 'VC', dialCode: '+1' },
  { iso2: 'VE', dialCode: '+58' }, { iso2: 'VG', dialCode: '+1' },
  { iso2: 'VI', dialCode: '+1' },
  // Okyanusya
  { iso2: 'AS', dialCode: '+1' }, { iso2: 'AU', dialCode: '+61' },
  { iso2: 'CK', dialCode: '+682' }, { iso2: 'FJ', dialCode: '+679' },
  { iso2: 'FM', dialCode: '+691' }, { iso2: 'GU', dialCode: '+1' },
  { iso2: 'KI', dialCode: '+686' }, { iso2: 'MH', dialCode: '+692' },
  { iso2: 'MP', dialCode: '+1' }, { iso2: 'NC', dialCode: '+687' },
  { iso2: 'NF', dialCode: '+672' }, { iso2: 'NR', dialCode: '+674' },
  { iso2: 'NU', dialCode: '+683' }, { iso2: 'NZ', dialCode: '+64' },
  { iso2: 'PF', dialCode: '+689' }, { iso2: 'PG', dialCode: '+675' },
  { iso2: 'PW', dialCode: '+680' }, { iso2: 'SB', dialCode: '+677' },
  { iso2: 'TK', dialCode: '+690' }, { iso2: 'TO', dialCode: '+676' },
  { iso2: 'TV', dialCode: '+688' }, { iso2: 'VU', dialCode: '+678' },
  { iso2: 'WF', dialCode: '+681' }, { iso2: 'WS', dialCode: '+685' },
  // Kuzey Atlantik / diğer bölgeler
  { iso2: 'AX', dialCode: '+358' }, { iso2: 'BL', dialCode: '+590' },
  { iso2: 'FK', dialCode: '+500' }, { iso2: 'FO', dialCode: '+298' },
  { iso2: 'GG', dialCode: '+44' }, { iso2: 'GI', dialCode: '+350' },
  { iso2: 'GL', dialCode: '+299' }, { iso2: 'IM', dialCode: '+44' },
  { iso2: 'JE', dialCode: '+44' }, { iso2: 'MF', dialCode: '+590' },
  { iso2: 'SH', dialCode: '+290' },
];

/** Varsayılan seçim. Diziden REFERANS — combobox eşitliği `Object.is`. */
export const TURKEY_DIAL_CODE = DIAL_CODES.find((c) => c.iso2 === 'TR')!;

/*
 * Türkçe bölge adları. Modül yüklenirken bir kez kurulur; `Intl.DisplayNames`
 * hem tarayıcıda hem SSR'daki Node'da (full-icu) var. Yoksa (çok eski
 * ortam) adlar iso2 koduna düşer — bileşen yine çalışır.
 */
let regionNames: Intl.DisplayNames | undefined;
try {
  regionNames = new Intl.DisplayNames(['tr'], { type: 'region' });
} catch {
  regionNames = undefined;
}

/** iso2 → Türkçe ülke adı (bulunamazsa iso2'nin kendisi). */
export function countryName(iso2: string): string {
  return regionNames?.of(iso2) ?? iso2;
}

/** iso2 → bayrak emojisi (regional indicator çifti; asset yok). */
export function flagEmoji(iso2: string): string {
  return [...iso2].map((ch) => String.fromCodePoint(0x1f1a5 + ch.charCodeAt(0))).join('');
}

const collator = new Intl.Collator('tr');

/** Combobox'ta gösterilen liste — Türkçe ada göre sıralı. */
export const DIAL_CODES_SORTED: DialCodeOption[] = [...DIAL_CODES].sort((a, b) =>
  collator.compare(countryName(a.iso2), countryName(b.iso2)),
);
```

- [ ] **Adım 4: Testleri çalıştır**

Çalıştır: `npm test -- --watch=false`
Beklenen: 11 dosya / 90 test yeşil.

- [ ] **Adım 5: Commit**

```bash
git add src/app/core/models/dial-code.ts src/app/core/models/index.ts src/app/shared/forms/dial-codes.const.ts
git commit -m "Add the dial code model and country data"
```

---

### Task 4: `AppInput`'a `autocomplete` + `AppPhoneInput` bileşeni

**Dosyalar:**
- Değiştir: `src/app/shared/forms/app-input.ts`
- Oluştur: `src/app/shared/forms/app-phone-input.ts`

**Arayüzler:**
- Tüketir: Task 3'ün `DIAL_CODES_SORTED`, `TURKEY_DIAL_CODE`,
  `countryName`, `flagEmoji`; Task 2'nin `HlmComboboxImports`.
- Üretir: `AppInput.autocomplete?: string` girdisi;
  `AppPhoneInput` — girdiler: `label: string` (required),
  `dialCodeField: FieldTree<string | undefined>` (required),
  `numberField: FieldTree<string | undefined>` (required),
  `optional: boolean`. Task 5 kayıt formunda kullanır.

- [ ] **Adım 1: `app-input.ts`'e `autocomplete` girdisi ekle**

Şablondaki input satırını:

```ts
      <input hlmInput [type]="type()" [attr.step]="step()" [formField]="field()" />
```

şununla değiştir:

```ts
      <input
        hlmInput
        [type]="type()"
        [attr.step]="step()"
        [attr.autocomplete]="autocomplete()"
        [formField]="field()"
      />
```

Sınıfa, `step` girdisinin altına ekle:

```ts
  /** Tarayıcı otomatik doldurması (`email`, `new-password` …); verilmezse basılmaz. */
  autocomplete = input<string>();
```

- [ ] **Adım 2: `app-phone-input.ts` dosyasını oluştur**

```ts
import { booleanAttribute, Component, computed, input, signal } from '@angular/core';
import { FieldTree, FormField } from '@angular/forms/signals';
import { HlmComboboxImports } from '@ui/combobox';
import { HlmFieldImports } from '@ui/field';
import { HlmInput } from '@ui/input';
import { DialCodeOption } from '@models';
import { DIAL_CODES_SORTED, TURKEY_DIAL_CODE, countryName, flagEmoji } from './dial-codes.const';

let nextId = 0;

/**
 * Signal Forms'a bağlı telefon girişi: solda aranabilir ülke kodu
 * combobox'ı, sağda yalnız-rakam telefon girişi. API'deki
 * `phoneNumberDialCode` / `phoneNumber` ikilisine iki ayrı alanla bağlanır:
 * `<app-phone-input label="Telefon" [dialCodeField]="f.phoneNumberDialCode" [numberField]="f.phoneNumber" />`
 *
 * `app-select`'teki gibi elle `inputId`: etiketin `for`'u telefon
 * input'una bağlanır; combobox trigger'ı buton olduğu için kendi
 * `aria-label`'ını taşır.
 */
@Component({
  selector: 'app-phone-input',
  imports: [FormField, HlmComboboxImports, HlmFieldImports, HlmInput],
  template: `
    <div hlmField>
      <label hlmFieldLabel [for]="inputId()">
        {{ label() }}
        @if (optional()) {
          <span class="font-normal text-muted-foreground">(isteğe bağlı)</span>
        }
      </label>
      <div class="flex gap-2">
        <hlm-combobox
          [value]="selected()"
          (valueChange)="selectCountry($event)"
          [itemToString]="itemToString"
        >
          <hlm-combobox-trigger class="w-28 shrink-0 justify-between" aria-label="Ülke kodu">
            <span>{{ flagEmoji(selected().iso2) }} {{ selected().dialCode }}</span>
          </hlm-combobox-trigger>
          <hlm-combobox-content *hlmComboboxPortal class="min-w-72">
            <hlm-combobox-input showTrigger="false" placeholder="Ülke ara…" />
            <hlm-combobox-empty>Ülke bulunamadı.</hlm-combobox-empty>
            <div hlmComboboxList class="max-h-64">
              @for (country of countries; track country.iso2) {
                <hlm-combobox-item [value]="country">
                  <span class="me-2">{{ flagEmoji(country.iso2) }}</span>
                  {{ countryName(country.iso2) }}
                  <span class="ms-auto ps-4 text-muted-foreground">{{ country.dialCode }}</span>
                </hlm-combobox-item>
              }
            </div>
          </hlm-combobox-content>
        </hlm-combobox>
        <input
          hlmInput
          type="tel"
          inputmode="tel"
          autocomplete="tel-national"
          class="min-w-0 flex-1"
          [id]="inputId()"
          [formField]="numberField()"
          (input)="sanitize($event)"
        />
      </div>
      @if (numberState().touched()) {
        @for (error of numberState().errors(); track error.kind) {
          <hlm-field-error forceShow>{{ error.message }}</hlm-field-error>
        }
      }
    </div>
  `,
})
export class AppPhoneInput {
  label = input.required<string>();

  /** API'deki `phoneNumberDialCode` alanı (örn. `+90`). */
  dialCodeField = input.required<FieldTree<string | undefined>>();

  /** API'deki `phoneNumber` alanı — yalnız rakam tutulur. */
  numberField = input.required<FieldTree<string | undefined>>();

  /** Etiketin yanına "(isteğe bağlı)" notunu ekler. */
  optional = input(false, { transform: booleanAttribute });

  inputId = input(`app-phone-input-${nextId++}`);

  countries = DIAL_CODES_SORTED;
  countryName = countryName;
  flagEmoji = flagEmoji;

  /**
   * Ekranda gösterilen ülke. Kod paylaşımlı olduğu için (+1 gibi) son
   * SEÇİLEN ülke burada tutulur; alan değeri dışarıdan geldiyse (profil
   * doldurma gibi) koda göre ilk eşleşmeye, o da yoksa TR'ye düşülür.
   */
  chosen = signal<DialCodeOption | null>(null);
  selected = computed(() => {
    const dial = this.dialCodeField()().value();
    const chosen = this.chosen();
    if (chosen && chosen.dialCode === dial) return chosen;
    return DIAL_CODES_SORTED.find((c) => c.dialCode === dial) ?? TURKEY_DIAL_CODE;
  });

  /** Arama bu metinde yapılır: ad + kod ("alm" de "+49" da bulur). */
  itemToString = (c: DialCodeOption): string => `${countryName(c.iso2)} ${c.dialCode}`;

  selectCountry(country: DialCodeOption | null): void {
    if (!country) return;
    this.chosen.set(country);
    this.dialCodeField()().value.set(country.dialCode);
  }

  /** Rakam dışı her şeyi anında temizler (yapıştırma dahil). */
  sanitize(event: Event): void {
    const el = event.target as HTMLInputElement;
    const clean = el.value.replace(/\D/g, '');
    if (clean !== el.value) {
      el.value = clean;
      this.numberField()().value.set(clean);
    }
  }

  numberState = computed(() => this.numberField()());
}
```

- [ ] **Adım 3: Testleri çalıştır**

Çalıştır: `npm test -- --watch=false`
Beklenen: 11 dosya / 90 test yeşil. (Bileşenin görsel doğrulaması Task
7'de, modal içinde yapılır — şu an tüketicisi yok.)

- [ ] **Adım 4: Commit**

```bash
git add src/app/shared/forms/app-input.ts src/app/shared/forms/app-phone-input.ts
git commit -m "Add a phone input with a searchable dial code combobox"
```

---

### Task 5: `AuthModal` bileşeni + `AuthModalService`

**Dosyalar:**
- Oluştur: `src/app/core/models/auth-modal.ts`
- Değiştir: `src/app/core/models/index.ts` (barrel satırı)
- Oluştur: `src/app/features/market/auth-modal/auth-modal.ts`
- Oluştur: `src/app/features/market/auth-modal/auth-modal.html`
- Oluştur: `src/app/features/market/auth-modal/auth-modal.service.ts`

**Arayüzler:**
- Tüketir: Task 1'in `LoginOutputModel.user`; Task 4'ün `AppInput`
  (`autocomplete` dahil) ve `AppPhoneInput`; mevcut `UserService`,
  `AuthStore`, `ToastService`, `HlmDialogService`.
- Üretir: `AuthView = 'login' | 'register'` ve `AuthModalContext` (`@models`);
  `AuthModalService.open(view: AuthView): void` — Task 6'nın iki layout
  bileşeni bunu çağırır.

- [ ] **Adım 1: `core/models/auth-modal.ts` dosyasını oluştur**

```ts
/** Auth modalının görünümleri. */
export type AuthView = 'login' | 'register';

/** `AuthModalService.open` → `AuthModal` diyalog context'i. */
export interface AuthModalContext {
  /** Modalın açılış görünümü. */
  view: AuthView;
}
```

- [ ] **Adım 2: Barrel'a ekle**

`src/app/core/models/index.ts` içine, alfabetik sıraya uyarak
(`export * from './amenity';` satırından sonra):

```ts
export * from './auth-modal';
```

- [ ] **Adım 3: `auth-modal.ts` dosyasını oluştur**

```ts
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
  RegisterUserInputModel,
  UserOutputModel,
} from '@models';
import { ToastService, UserService } from '@services';

/**
 * Market giriş/kayıt modalı. `AuthModalService.open(view)` ile açılır;
 * iki görünüm arasında alttaki link geçirir — formlar ayrı ve geçişte
 * sıfırlanmaz (yanlış sekmede yazılan e-posta kaybolmasın).
 *
 * Backend kayıtta cookie yazmadığı için kayıt sonrası aynı bilgilerle
 * otomatik giriş yapılır; login yanıtı kullanıcıyı taşıdığından `me()`
 * çağrılmaz.
 */
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

  registerModel = signal<RegisterUserInputModel>({
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
```

- [ ] **Adım 4: `auth-modal.html` dosyasını oluştur**

```html
<hlm-dialog-header>
  <h2 hlmDialogTitle>{{ view() === 'login' ? 'Giriş yap' : 'Kayıt ol' }}</h2>
  <p hlmDialogDescription>
    {{
      view() === 'login'
        ? 'Rezervasyonlarını görmek ve tekne kiralamak için giriş yap.'
        : 'Tekne kiralamak için ücretsiz hesap oluştur.'
    }}
  </p>
</hlm-dialog-header>

@if (view() === 'login') {
  <!-- novalidate: Signal Forms native `required` attribute'unu da basıyor;
       onsuz tarayıcı submit olayını yutup signIn()'i hiç çağırmıyor. -->
  <form class="flex flex-col gap-4" novalidate (submit)="$event.preventDefault(); signIn()">
    <app-input label="E-posta" type="email" autocomplete="email" [field]="loginForm.email" />
    <app-input
      label="Şifre"
      type="password"
      autocomplete="current-password"
      [field]="loginForm.password"
    />
    <button hlmBtn type="submit" class="h-10" [disabled]="loginForm().submitting()">
      {{ loginForm().submitting() ? 'Giriş yapılıyor…' : 'Giriş yap' }}
    </button>
  </form>
  <p class="text-center text-sm text-muted-foreground">
    Hesabın yok mu?
    <button
      type="button"
      class="font-medium text-primary-deep hover:underline"
      (click)="view.set('register')"
    >
      Kayıt ol
    </button>
  </p>
} @else {
  <form class="flex flex-col gap-4" novalidate (submit)="$event.preventDefault(); signUp()">
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <app-input label="Ad" autocomplete="given-name" [field]="registerForm.name" />
      <app-input label="Soyad" autocomplete="family-name" [field]="registerForm.surname" />
    </div>
    <app-input label="E-posta" type="email" autocomplete="email" [field]="registerForm.email" />
    <app-input
      label="Şifre"
      type="password"
      autocomplete="new-password"
      [field]="registerForm.password"
    />
    <app-phone-input
      label="Telefon"
      optional
      [dialCodeField]="registerForm.phoneNumberDialCode"
      [numberField]="registerForm.phoneNumber"
    />
    <button hlmBtn type="submit" class="h-10" [disabled]="registerForm().submitting()">
      {{ registerForm().submitting() ? 'Kayıt yapılıyor…' : 'Kayıt ol' }}
    </button>
  </form>
  <p class="text-center text-sm text-muted-foreground">
    Zaten hesabın var mı?
    <button
      type="button"
      class="font-medium text-primary-deep hover:underline"
      (click)="view.set('login')"
    >
      Giriş yap
    </button>
  </p>
}
```

- [ ] **Adım 5: `auth-modal.service.ts` dosyasını oluştur**

```ts
import { Service, inject } from '@angular/core';
import { HlmDialogService } from '@ui/dialog';
import { AuthModalContext, AuthView } from '@models';
import { AuthModal } from './auth-modal';

/**
 * Giriş/kayıt modalını açan tek nokta — masaüstü menü ve mobil sekme
 * bileşenleri (ileride rezervasyon akışı) bunu çağırır.
 *
 * `@services` barrel'ında DEĞİL: bileşene referans veren servis barrel'a
 * girerse dialog helm'i barrel'ı import eden herkese bulaşır
 * (`ConfirmService` kuralının aynısı). Tüketici doğrudan dosyadan import eder.
 */
@Service()
export class AuthModalService {
  dialogService = inject(HlmDialogService);

  open(view: AuthView): void {
    this.dialogService.open(AuthModal, {
      context: { view } satisfies AuthModalContext,
      // Mobile-first: tabanda tam ekran (alttan kayar), sm üstünde ortalanmış
      // kart. contentClass, helm varsayılanlarının üzerine tailwind-merge ile
      // biner — max-w/rounded çakışmalarında buradaki kazanır.
      contentClass:
        'fixed inset-0 max-w-none content-start overflow-y-auto rounded-none ' +
        'data-open:slide-in-from-bottom-8 data-closed:slide-out-to-bottom-8 ' +
        'sm:static sm:inset-auto sm:max-w-md sm:content-normal sm:rounded-xl',
    });
  }
}
```

- [ ] **Adım 6: Testleri çalıştır**

Çalıştır: `npm test -- --watch=false`
Beklenen: 11 dosya / 90 test yeşil. (Modal henüz hiçbir yerden
açılmıyor; görsel doğrulama Task 6-7'de.)

- [ ] **Adım 7: Commit**

```bash
git add src/app/core/models/auth-modal.ts src/app/core/models/index.ts src/app/features/market/auth-modal
git commit -m "Add the market auth modal with login and register views"
```

---

### Task 6: Layout bağlama — `MarketUserMenu`, `MarketAccountTab`, `MarketLayout`

Auth'a bağlı iki header parçası `ngSkipHydration`'lı bileşenlere çıkar:
sunucu her zaman misafir hâlini basar; bu parçalar hydrate edilmeyip
istemcide store'un güncel hâliyle yeniden çizilir (NG0500 önlemi).

**Dosyalar:**
- Oluştur: `src/app/layouts/market-layout/market-user-menu.ts`
- Oluştur: `src/app/layouts/market-layout/market-account-tab.ts`
- Değiştir: `src/app/layouts/market-layout/market-layout.ts`
- Değiştir: `src/app/layouts/market-layout/market-layout.html`

**Arayüzler:**
- Tüketir: Task 5'in `AuthModalService.open(view)`; mevcut `AuthStore`,
  `UserService`, `ROUTE_MARKET.myReservations`, `@ui/popover`, `@ui/sheet`,
  `@ui/button`.
- Üretir: `<app-market-user-menu />` (masaüstü sağ alan) ve
  `<app-market-account-tab />` (mobil sekme hücresi) — yalnız
  `MarketLayout` kullanır, girdileri yok.

- [ ] **Adım 1: `market-user-menu.ts` dosyasını oluştur**

```ts
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideUser } from '@ng-icons/lucide';
import { HlmButton } from '@ui/button';
import { HlmPopoverImports } from '@ui/popover';
import { AuthStore } from '../../core/auth/auth-store';
import { ROUTE_MARKET } from '../../core/routes.const';
import { AuthModalService } from '../../features/market/auth-modal/auth-modal.service';
import { UserService } from '@services';

/**
 * Masaüstü header'ın sağ alanı: misafirde "Giriş / Kayıt Ol", girişlide
 * ikon + popover hesap menüsü (dashboard-shell kalıbı; navbar'da isim
 * yazmaz — kullanıcı kararı, 2026-08-04).
 *
 * ngSkipHydration: SSR'da store hep boş olduğundan sunucu misafir hâlini
 * basar; girişli istemcide fark NG0500 üretirdi. Bu parça hydrate
 * edilmez, istemcide güncel store'la yeniden çizilir.
 */
@Component({
  selector: 'app-market-user-menu',
  imports: [RouterLink, NgIcon, HlmButton, HlmPopoverImports],
  providers: [provideIcons({ lucideUser })],
  host: { ngSkipHydration: '' },
  template: `
    @if (authStore.isAuthenticated()) {
      <hlm-popover #accountMenu="brnPopover" align="end" sideOffset="8">
        <button
          hlmPopoverTrigger
          hlmBtn
          variant="outline"
          size="icon"
          class="rounded-full"
          aria-label="Hesap menüsü"
        >
          <ng-icon name="lucideUser" size="20" />
        </button>
        <hlm-popover-content *hlmPopoverPortal class="w-64">
          <div class="px-1.5 py-1">
            <p class="text-sm font-medium">{{ displayName() }}</p>
            @if (authStore.user(); as user) {
              <p class="text-sm text-muted-foreground">{{ user.email }}</p>
            }
          </div>
          <div class="border-t border-border"></div>
          <a
            hlmBtn
            variant="ghost"
            class="w-full justify-start"
            [routerLink]="['/', route.myReservations]"
            (click)="accountMenu.close()"
          >
            Rezervasyonlarım
          </a>
          <button
            hlmBtn
            variant="ghost"
            class="w-full justify-start"
            (click)="accountMenu.close(); signOut()"
          >
            Çıkış yap
          </button>
        </hlm-popover-content>
      </hlm-popover>
    } @else {
      <button
        type="button"
        class="text-sm text-slate-600 hover:text-slate-900"
        (click)="authModal.open('login')"
      >
        Giriş
      </button>
      <button
        type="button"
        class="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
        (click)="authModal.open('register')"
      >
        Kayıt Ol
      </button>
    }
  `,
})
export class MarketUserMenu {
  authStore = inject(AuthStore);
  userService = inject(UserService);
  authModal = inject(AuthModalService);

  route = ROUTE_MARKET;

  displayName = computed(() => {
    const user = this.authStore.user();
    return user ? `${user.name} ${user.surname}` : 'Hesap';
  });

  /**
   * Çıkış: istek başarısız olsa bile lokal oturum düşürülür — cookie
   * silinememiş olabilir ama istemci tarafında oturum bitmiştir
   * (dashboard-shell kalıbı). Market'te guard'lı sayfa yok; yerinde kalınır.
   */
  signOut(): void {
    this.userService.logout().subscribe({
      next: () => this.authStore.setUser(null),
      error: () => this.authStore.setUser(null),
    });
  }
}
```

- [ ] **Adım 2: `market-account-tab.ts` dosyasını oluştur**

```ts
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideUser } from '@ng-icons/lucide';
import { HlmButton } from '@ui/button';
import { HlmSheetImports } from '@ui/sheet';
import { AuthStore } from '../../core/auth/auth-store';
import { ROUTE_MARKET } from '../../core/routes.const';
import { AuthModalService } from '../../features/market/auth-modal/auth-modal.service';
import { UserService } from '@services';

/**
 * Mobil alt çubuğun hesap sekmesi: misafirde "Giriş yap" (modal açar),
 * girişlide "Hesabım" — alttan sheet ile masaüstü popover'daki öğelerin
 * aynısı. ngSkipHydration gerekçesi `MarketUserMenu` ile aynı.
 */
@Component({
  selector: 'app-market-account-tab',
  imports: [RouterLink, NgIcon, HlmButton, HlmSheetImports],
  providers: [provideIcons({ lucideUser })],
  host: { ngSkipHydration: '', class: 'block' },
  template: `
    @if (authStore.isAuthenticated()) {
      <hlm-sheet #accountSheet="hlmSheet">
        <button
          hlmSheetTrigger
          side="bottom"
          class="flex w-full flex-col items-center gap-1 py-2 text-slate-500"
        >
          <ng-icon name="lucideUser" size="22" />
          <span class="text-[11px]">Hesabım</span>
        </button>
        <hlm-sheet-content *hlmSheetPortal class="pb-[env(safe-area-inset-bottom)]">
          <div hlmSheetHeader>
            <h2 hlmSheetTitle>{{ displayName() }}</h2>
            @if (authStore.user(); as user) {
              <p class="text-sm text-muted-foreground">{{ user.email }}</p>
            }
          </div>
          <div class="flex flex-col gap-1 p-4 pt-0">
            <a
              hlmBtn
              variant="ghost"
              class="h-10 justify-start"
              [routerLink]="['/', route.myReservations]"
              (click)="accountSheet.close()"
            >
              Rezervasyonlarım
            </a>
            <button
              hlmBtn
              variant="ghost"
              class="h-10 justify-start"
              (click)="accountSheet.close(); signOut()"
            >
              Çıkış yap
            </button>
          </div>
        </hlm-sheet-content>
      </hlm-sheet>
    } @else {
      <button
        type="button"
        class="flex w-full flex-col items-center gap-1 py-2 text-slate-500"
        (click)="authModal.open('login')"
      >
        <ng-icon name="lucideUser" size="22" />
        <span class="text-[11px]">Giriş yap</span>
      </button>
    }
  `,
})
export class MarketAccountTab {
  authStore = inject(AuthStore);
  userService = inject(UserService);
  authModal = inject(AuthModalService);

  route = ROUTE_MARKET;

  displayName = computed(() => {
    const user = this.authStore.user();
    return user ? `${user.name} ${user.surname}` : 'Hesap';
  });

  /** Gerekçe `MarketUserMenu.signOut` ile aynı — hatada da oturum düşer. */
  signOut(): void {
    this.userService.logout().subscribe({
      next: () => this.authStore.setUser(null),
      error: () => this.authStore.setUser(null),
    });
  }
}
```

- [ ] **Adım 3: `market-layout.ts`'i güncelle**

Dosyanın tamamını şununla değiştir (lucideUser çocuk bileşenlere taşındı):

```ts
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideCompass,
  lucideEllipsis,
  lucideHeart,
  lucideInbox,
  lucideSearch,
} from '@ng-icons/lucide';
import { ROUTE_MARKET } from '../../core/routes.const';
import { MarketAccountTab } from './market-account-tab';
import { MarketUserMenu } from './market-user-menu';

@Component({
  selector: 'app-market-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgIcon, MarketAccountTab, MarketUserMenu],
  providers: [
    provideIcons({
      lucideCompass,
      lucideEllipsis,
      lucideHeart,
      lucideInbox,
      lucideSearch,
    }),
  ],
  templateUrl: './market-layout.html',
})
export class MarketLayout {
  route = ROUTE_MARKET;
}
```

- [ ] **Adım 4: `market-layout.html`'de masaüstü alanını değiştir**

Şu bloğu:

```html
      <!-- Giriş/kayıt modal üzerinden açılacak; henüz bağlanmadı.
           Mobilde bu işler alt çubukta — burada yalnızca masaüstünde görünür. -->
      <div class="ml-auto hidden items-center gap-4 lg:flex">
        <button type="button" class="text-sm text-slate-600 hover:text-slate-900">Giriş</button>
        <button
          type="button"
          class="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
        >
          Kayıt Ol
        </button>
      </div>
```

şununla değiştir:

```html
      <!-- Misafir/girişli dallanması bileşenin içinde; ngSkipHydration'ı da
           o taşıyor. Mobilde bu işler alt çubukta — burada yalnız masaüstü. -->
      <app-market-user-menu class="ml-auto hidden items-center gap-4 lg:flex" />
```

- [ ] **Adım 5: `market-layout.html`'de mobil sekmeyi değiştir**

Alt navigasyondaki şu bloğu:

```html
      <button type="button" class="flex flex-col items-center gap-1 py-2 text-slate-500">
        <ng-icon name="lucideUser" size="22" />
        <span class="text-[11px]">Giriş yap</span>
      </button>
```

şununla değiştir:

```html
      <app-market-account-tab />
```

Alt navigasyonun üstündeki yorumdan "giriş modalı bekliyor" ifadesini
düşür — yeni hâli:

```html
  <!-- Mobil alt navigasyon. `env(safe-area-inset-bottom)`: Capacitor/iOS'ta home
       çubuğunun altında kalmasın (webde 0'a düşer, zararsız). Favoriler ve
       gelen kutusu henüz bağlı değil — backend bekliyor. -->
```

- [ ] **Adım 6: Testleri çalıştır**

Çalıştır: `npm test -- --watch=false`
Beklenen: 11 dosya / 90 test yeşil.

- [ ] **Adım 7: Elle hızlı kontrol (dev server)**

Çalıştır: `npm start`, `http://localhost:4200` aç.
- Masaüstü genişlikte "Giriş" → modal login görünümüyle, "Kayıt Ol" →
  register görünümüyle açılmalı; alttaki link görünümler arasında
  geçirmeli.
- DevTools mobil emülasyonda alt çubuktaki "Giriş yap" → modal TAM EKRAN
  açılmalı (alttan kayarak).
- Backend ayakta değilse form submit'i toast hatası göstermeli, modal
  açık kalmalı.

- [ ] **Adım 8: Commit**

```bash
git add src/app/layouts/market-layout
git commit -m "Wire the market header and bottom tab to the auth modal"
```

---

### Task 7: Uçtan uca doğrulama (backend + SSR + görsel ince ayar)

**Dosyalar:**
- Gerekirse ince ayar: Task 4-6'nın dosyaları (sınıf düzeltmeleri)

**Ön koşul:** Backend ayakta olmalı — `D:\Tekne\Tekne.Project.Api`
dizininde çalıştırılıyor, `http://localhost:5188` yanıt veriyor.

- [ ] **Adım 1: Dev server ile akış testleri**

`npm start` açıkken:

1. **Kayıt:** "Kayıt Ol" → formu doldur (telefonsuz) → "Kayıt ol":
   modal kapanmalı, "Hesabın oluşturuldu, hoş geldin" toast'ı gelmeli,
   header'da ikon görünmeli.
2. **Çıkış → giriş:** ikon → popover → "Çıkış yap" → misafir butonları
   dönmeli. "Giriş" → aynı hesapla gir: "Hoş geldin, {ad}" toast'ı,
   header yine girişli.
3. **Telefonlu kayıt:** yeni bir e-postayla, telefon alanına `5551112233`
   yaz; combobox'ı aç, "alm" yazınca Almanya süzülmeli, `49` yazınca da
   bulunmalı; Almanya'yı seç (+49 görünmeli) → kayıt tamamlanmalı.
   (İstersen DB'den/Swagger'dan `phoneNumberDialCode: +49` doğrula.)
4. **Yanlış şifre:** login'de bilerek yanlış şifre → hata toast'ı, modal
   açık kalmalı.
5. **Görünüm geçişi:** login'de e-posta yaz → "Kayıt ol" linki → geri
   "Giriş yap": yazılan e-posta durmalı (formlar sıfırlanmıyor).
6. **Mobil emülasyon:** tam ekran modal içinde klavyeyle form rahat
   kullanılabilmeli; girişli hâlde "Hesabım" → alttan sheet: öğeler
   `h-10`, "Rezervasyonlarım" sayfaya gidip sheet'i kapatmalı, "Çıkış
   yap" oturumu düşürmeli.
7. **Popover davranışı:** "Rezervasyonlarım" tıklanınca popover kapanmalı
   (açık kalıyorsa `accountMenu.close()` bağlanmamış demektir).

Görsel bozukluk varsa (combobox popup genişliği, tam ekran animasyonu,
trigger sıkışması) ilgili sınıfları düzelt — yapıyı değiştirme.

- [ ] **Adım 2: Prod build + SSR kontrolü**

```bash
npm run build
npm run serve:ssr:tekne-web
```

Beklenen: build hatasız ve `initial` budget (500 kB) aşılmamış.
`http://localhost:4000` aç:

- Misafirken anasayfa: konsolda NG0500 YOK.
- Giriş yap → sayfayı YENİLE: header girişli gelmeli (kısa misafir
  parlaması normal), konsolda NG0500 YOK (ngSkipHydration işini yapıyor).
- Kaynağı görüntüle: sunucu HTML'inde misafir butonları olmalı (sunucu
  oturum bilmez — beklenen).

- [ ] **Adım 3: Son test turu**

Çalıştır: `npm test -- --watch=false`
Beklenen: 11 dosya / 90 test yeşil.

- [ ] **Adım 4: İnce ayar olduysa commit**

```bash
git add -A src/app
git commit -m "Polish the auth modal visuals after end-to-end testing"
```

(İnce ayar çıkmadıysa bu adım atlanır.)

---

## Plan öz-denetimi (yazım sonrası)

- **Spec kapsaması:** spec'in 6 parçası → Task 1 (model + me temizliği),
  Task 2 (combobox), Task 3 (ülke verisi), Task 4 (app-phone-input),
  Task 5 (AuthModal + servis), Task 6 (MarketLayout + iki bileşen +
  ngSkipHydration), Task 7 (SSR/NG0500 doğrulaması, akış testleri). Toast
  gereksinimleri Task 5'te (`finishSignIn`); "kayıt düştüyse login'e dön"
  uç durumu Task 5 `signUp` catch'inde.
- **Tip tutarlılığı:** `AuthView`/`AuthModalContext` Task 5 Adım 1'de
  tanımlanıp servis ve modalda aynı adla kullanılıyor;
  `FieldTree<string | undefined>` telefon alanlarında iki tarafta da aynı;
  `TURKEY_DIAL_CODE` diziden referans (combobox `Object.is` eşitliği).
- **Placeholder taraması:** tüm kod blokları tam içerik; "TBD/benzeri"
  yok. Task 2 Adım 3'teki uyarlama notu placeholder değil, generator
  çıktısı şablonlardan saparsa izlenecek yol.
