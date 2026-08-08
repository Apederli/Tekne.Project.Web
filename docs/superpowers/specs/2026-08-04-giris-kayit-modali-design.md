# Giriş/kayıt modalı ve telefon girişi — tasarım

Tarih: 2026-08-04
Durum: onaylandı, uygulanmadı

## Amaç

Market alanındaki placeholder "Giriş" / "Kayıt Ol" butonlarını gerçek bir
oturum akışına bağlamak: tek bir auth modalı (login ↔ register geçişli),
kayıt formunun önkoşulu olan telefon numarası form bileşeni ve girişli
duruma tepki veren header.

Altyapının tamamı hazır ve bu iş yalnızca UI katmanı ekler: `UserService`
(register/login/logout/me), `AuthStore`, açılışta `/me` ile oturum geri
yükleme ve hata toast'ları çalışır durumda. Backend kayıtta cookie yazmaz
(otomatik giriş yok); login yanıtı token'ın yanında **giriş yapan
kullanıcıyı da döner** (backend değişikliği, 2026-08-04) — giriş sonrası
`me()` çağrılmaz, `me()` yalnızca açılıştaki oturum geri yüklemede kalır.

## Kullanıcı kararları (2026-08-04)

- Mobilde modal **tam ekran** açılır (alttan kayarak); masaüstünde ortalanmış kart.
- Kayıtta **telefon alanı olacak** (isteğe bağlı) — önce `app-phone-input`
  bileşeni yapılır, sıra: kurulumlar → telefon bileşeni → modal.
- Ülke kodu **aranabilir combobox, tam ülke listesi**, varsayılan +90
  (spartan combobox bu vesileyle kurulur — zaten planlıydı).
- Kayıt sonrası **otomatik giriş** (aynı bilgilerle arka planda login).
- Girişli header'da **navbar'da isim yazmaz**; yuvarlak kullanıcı ikonu →
  açılır menü (isim menünün içinde görünür). Uygulama, kurulu `popover`
  helm'iyle — dashboard-shell'deki hesap menüsü kalıbının aynısı; ayrıca
  `dropdown-menu` bileşeni kurulmaz (plan aşaması keşfi, 2026-08-04).
- **Login yanıtı kullanıcıyı taşıyor** (backend'e eklendi, 2026-08-04):
  giriş akışlarında `me()` çağrılmaz, `LoginOutputModel.user` kullanılır.
- Tek modal / iki modal seçimi teknik karar olarak bırakıldı → tek modal,
  içinde görünüm geçişi.

## Kapsam

Dahil:

1. `LoginOutputModel`'e `user` alanı + partner login sayfasındaki `me()`
   çağrısının kaldırılması.
2. spartan `combobox` helm kurulumu (`shared/ui/`).
3. `app-phone-input` (shared/forms) + ülke kodu verisi.
4. `AuthModal` (`features/market/auth-modal/`).
5. `MarketLayout`: buton bağlama, girişli durum (masaüstü dropdown, mobil
   sheet), çıkış.

Hariç (bilinçli):

- **Şifremi unuttum / e-posta doğrulama (`isValid`) / sosyal login** —
  backend'de karşılığı yok, ayrı işler.
- **Market sayfalarına guard** — `rezervasyonlarim` korumasız kalır; guard
  + "girişsizken modal aç" davranışı ayrı bir karar.
- **Partner login validation'ı** — oradaki `minLength(6)` login kuralı bu
  işte elleşmez; sayfaya yalnızca `me()` temizliği için dokunulur
  (aşağıda, parça 1).
- **Telefon maskeleme/formatlama** (5xx xxx xx xx) — v1 yalnızca rakam
  kabul eder, biçimlendirme yapmaz.
- Yeni test yazımı (proje kararı); mevcut suite yeşil kalır.

## Parçalar

### 1. Model güncellemesi ve `me()` temizliği

- `core/models/user.ts`: `LoginOutputModel`'e `user: UserOutputModel`
  eklenir (backend'le birebir); dosya başındaki güncelliğini yitirmiş
  yorumlar ("login yanıtı yalnızca token taşıyor" vb.) düzeltilir.
- `partner-login.ts`: girişten sonraki `me()` çağrısı kalkar —
  `setUser(yanıt.user)`.
- `me()` servis metodu kalır; tek tüketicisi açılıştaki oturum geri
  yükleme (`app.config.ts`) olur.

### 2. Spartan kurulumu

`combobox` helm'i spartan CLI ile `shared/ui/` altına, mevcut bileşenlerle
aynı düzende (`src/index.ts` + `lib/`). Yeni npm bağımlılığı yok (brain
kurulu; combobox'ın kullandığı `button` ve `input-group` helm'leri de
zaten projede). Hesap menüsü için ayrıca bileşen kurulmaz — kurulu
`popover` helm'i, dashboard-shell'deki hesap menüsüyle aynı kalıpla
kullanılır.

### 3. Ülke kodu verisi

- Tip: `core/models/phone.ts` → `DialCodeOption { iso2: string; dialCode: string }`
  (kural: interface bileşen dosyasında yaşamaz).
- Veri: `shared/forms/dial-codes.const.ts` — tam liste (~240 girdi), yalnız
  `iso2 + dialCode`. **Ülke adları elle yazılmaz:** çalışma anında
  `Intl.DisplayNames('tr', { type: 'region' })` ile üretilir (SSR'daki
  Node'da da mevcut); API yoksa iso2 gösterilir.
- Bayrak: iso2 → regional-indicator emoji dönüşümü (küçük fonksiyon,
  asset yok).

### 4. `app-phone-input` — `shared/forms/app-phone-input.ts`

`app-input` konvansiyonunda Signal Forms bileşeni:

- Girdiler: `label` (required), `dialCodeField` ve `numberField`
  (`FieldTree` — API'deki `phoneNumberDialCode` / `phoneNumber` ikilisine
  birebir), `optional` (etikete "(isteğe bağlı)" ekler).
- Görünüm: flex tek satır — solda combobox trigger butonu (bayrak + `+90`),
  tıklayınca içinde arama girişi olan liste açılır; sağda `type="tel"` input.
- Filtre: Türkçe ülke adına ve koda göre (`"alm"` → Almanya, `"49"` → +49),
  TR-locale karşılaştırma.
- Rakam dışı karakterler girişte temizlenir.
- Hata gösterimi `app-input` gibi: `touched` + `errors` → `hlm-field-error`.

### 5. `AuthModal` — `features/market/auth-modal/`

- Açılış: `HlmDialogService.open(AuthModal, { context: { view }, contentClass })`;
  `view: 'login' | 'register'`. Context okuma `ConfirmDialog`'daki mevcut
  kalıpla aynı.
- İçeride `view` signal'ı; alttaki "Hesabın yok mu? Kayıt ol" /
  "Zaten hesabın var mı? Giriş yap" linki görünümü değiştirir (modal
  kapanmaz, formlar sıfırlanmaz).
- İki ayrı Signal Forms formu, kurallar backend doğrulayıcısıyla birebir:
  - **Login** (`LoginInputModel`): e-posta (required + email),
    şifre (required — backend login'de uzunluk kuralı yok, burada da yok).
  - **Register** (`RegisterUserInputModel`): ad, soyad (required, ≤50),
    e-posta (required + email, ≤300), şifre (required, 6–100),
    telefon (`app-phone-input`, isteğe bağlı; girildiyse numara ≤14,
    kod ≤5). Numara boşsa **iki alan da** (`phoneNumber` ve
    `phoneNumberDialCode`) API'ye gönderilmez — tek başına alan kodu
    anlamsızdır.
- Akışlar (partner-login kalıbı: `submit()`, `firstValueFrom`, hatada
  interceptor toast'ı gösterir, modal açık kalır):
  - **Giriş:** `login()` → `setUser(yanıt.user)` → modal kapanır +
    success toast (örn. "Hoş geldin, Atilla" — yanıttaki `name` ile).
  - **Kayıt:** `register()` → aynı bilgilerle `login()` →
    `setUser(yanıt.user)` → modal kapanır + success toast
    ("Hesabın oluşturuldu, hoş geldin").
  - **Kayıt başarılı ama otomatik giriş düştü** (uç durum): modal login
    görünümüne döner, e-posta dolu kalır — hesap yaratıldığı için tekrar
    register denenmez.
- Submit butonu `submitting()`'de disabled + metin değişimi; dokunma
  hedefleri `h-10` (proje kararı).
- `autocomplete` öznitelikleri: `email`, `current-password` /
  `new-password`, `given-name`, `family-name`, `tel`.
- **Mobil tam ekran** `contentClass` ile: mobilde ekranı kaplar (radius
  yok, alttan kayma animasyonu), `sm:` üstünde ortalanmış kart. Ezilecek
  helm default'ları (max-w, rounded, translate animasyonları) plan
  aşamasında `hlm-dialog-content` okunarak yazılır.

### 6. `MarketLayout` güncellemesi

- `AuthStore` inject edilir; header ve alt çubuk `@if (authStore.isAuthenticated())`
  ile dallanır.
- **SSR/hydration:** sunucuda oturum bilinemez (cookie HttpOnly, store
  SSR'da boş) → SSR'lı sayfalarda sunucu hep misafir header'ı basar,
  girişli kullanıcıda istemci farklı render edince NG0500 doğardı. Bu
  yüzden auth'a bağlı iki parça (masaüstü aksiyon alanı, mobil hesap
  sekmesi) küçük bileşenlere çıkarılır ve `ngSkipHydration` ile
  işaretlenir: sunucu çıktısı hydrate edilmez, istemcide store'un güncel
  hâliyle yeniden çizilir. Girişli kullanıcı hydration'a kadar kısaca
  misafir halini görür — cookie sunucuda doğrulanmadığı sürece bu her
  çözümde kaçınılmaz.
- **Misafir:** masaüstü "Giriş" → `openAuthModal('login')`, "Kayıt Ol" →
  `openAuthModal('register')`; mobil "Giriş yap" sekmesi → `openAuthModal('login')`.
- **Girişli masaüstü:** sağda yuvarlak buton (lucideUser) → popover menü
  (dashboard-shell kalıbı): başlıkta ad-soyad + e-posta, "Rezervasyonlarım"
  (routerLink), ayraç, "Çıkış". Menü öğeleri tıklanınca popover kapatılır.
- **Girişli mobil:** sekme "Hesabım" olur → alttan sheet (`side="bottom"`),
  aynı öğeler.
- **Çıkış:** dashboard-shell'in `signOut` kalıbı — istek başarısız olsa
  bile lokal oturum düşürülür (`setUser(null)`); menü/sheet kapanır,
  sayfada kalınır (market'te guard'lı sayfa yok).
- **Modal açma `AuthModalService.open(view)` ile** — masaüstü ve mobil
  parça ayrı bileşenler olduğu için açma noktası tekilleşiyor. Servis
  bileşenin yanında yaşar ve `@services` barrel'ına GİRMEZ (bileşene
  referans veren servis barrel'a girerse dialog helm'i barrel'ı import
  eden herkese bulaşır — `ConfirmService` kuralının aynısı).
- `AuthModal` statik import edilir → market layout chunk'ında kalır,
  admin/partner chunk'larına bulaşmaz.

## Veri akışı

```
"Giriş"/"Kayıt Ol"/sekme → HlmDialogService.open(AuthModal, {view})
AuthModal giriş: login() → AuthStore.setUser(yanıt.user) → close() + toast
AuthModal kayıt: register() → login() → setUser(yanıt.user) → close() + toast
MarketLayout: authStore.isAuthenticated() → header/sekme görünümü değişir
Dropdown/sheet "Çıkış" → logout() → setUser(null)
```

## Riskler

- Kopyalanan `combobox` helm'inin gerçek API'si — plan, CLI'nin şablon
  dosyaları ve resmi kullanım örnekleri okunarak yazıldı; kurulum çıktısı
  şablonlardan saparsa plan koduna uyarlanır.
- Dialog içinde combobox popup'ı: brain dialog'un focus trap'i ile
  combobox portal'ının etkileşimi denenerek doğrulanır (spartan ikisi de
  CDK overlay kullandığı için beklenti sorunsuz).
- `Intl.DisplayNames` SSR'da Node ICU'ya dayanır; modal yalnız tarayıcı
  etkileşimiyle açıldığı için pratikte CSR — yine de bileşen SSR'lı bir
  sayfada kullanılırsa fallback (iso2) devrede.
- Signal Forms'ta opsiyonel alanlar (`phoneNumber?`): form modeli `''`
  ile başlar, submit'te boş → `undefined` dönüşümü; `FieldTree` tip uyumu
  plan aşamasında doğrulanır.
- Header'ın hydration davranışı gerçek SSR ile doğrulanır
  (`npm run build` + `serve:ssr`, girişli kullanıcıyla sayfa yenileme —
  konsolda NG0500 olmamalı).
