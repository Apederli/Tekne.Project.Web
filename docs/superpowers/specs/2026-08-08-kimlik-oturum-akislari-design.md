# Kimlik ve oturum akışları — tasarım

Tarih: 2026-08-08
Durum: onaylandı. Parça A uygulandı (2026-08-08, e-posta index düzeltmesi
hariç); Parça B ertelendi (kullanıcı kararı: "bugün değil"); Parça C
rezervasyon özelliğini bekliyor.

Kapsadığı kararlar: kayıt sonrası otomatik giriş, Google/Apple ile
kayıt/giriş, kimlik alanı (e-posta vs telefon) ve rezervasyon öncesi
telefon doğrulama. [2026-08-04 giriş/kayıt modalı spec'inin](2026-08-04-giris-kayit-modali-design.md)
üstüne oturur; oradaki UI kalıpları (modal, toast, interceptor) değişmez.

## Temel kararlar (2026-08-08)

1. **Kimlik = e-posta.** Giriş e-posta + şifre ile yapılır; unique alan
   e-postadır (DB'de zaten öyle). Telefon kimlik değil, iletişim alanıdır.
   Gerekçe: Google/Apple doğrulanmış *e-posta* verir, telefon vermez —
   sosyal hesap eşleştirmesinin ortak anahtarı e-postadır.
2. **Kayıt sonrası otomatik giriş, tek istekle.** `register` başarıda
   `login` ile birebir aynı davranır: auth cookie yazar,
   `LoginOutputModel` döner. Frontend'deki iki istekli zincir
   (register → login) ve "hesap oluştu ama giriş düştü" uç durumu kalkar.
3. **Google/Apple = find-or-create, ayrı kayıt akışı yok.** İlk geliş
   hesabı oluşturur, sonrakiler giriş yapar; her iki durumda da yanıt
   sözleşmesi login ile aynıdır. Sosyal kayıt her zaman `Customer` tipi
   hesap açar; `/login/partner` şifreli kalır, sosyal butonlar yalnız
   market modalında yaşar.
4. **Telefon doğrulama kayıtta değil, rezervasyon kapısında.** Kayıtta
   OTP çalışmaz; telefon opsiyonel ve doğrulamasızdır. Rezervasyon
   komutu sunucu tarafında doğrulanmış telefon şartı arar — yanlış veya
   doğrulanmamış numarayla işlem, frontend atlansa bile mümkün değildir.
5. **Telefon unique değildir.** Doğrulamanın amacı numaranın hesap
   sahibinin elinde olduğunu kanıtlamak; aynı numarayı birden çok hesabın
   doğrulatması (aile içi paylaşım) meşrudur. Uniqueness ancak telefonla
   giriş gelirse gerekir — o gün kısıt + tek seferlik veri temizliğiyle
   eklenir, bugünden taşınmaz.

## Yanıt sözleşmesi — üç kapı, tek çıktı

| Uç | Girdi | Başarı çıktısı |
|---|---|---|
| `POST /api/Users/register` | e-posta, şifre, ad, soyad, telefon? | Set-Cookie + `LoginOutputModel` |
| `POST /api/Users/login` | e-posta, şifre | Set-Cookie + `LoginOutputModel` |
| `POST /api/Users/login/google` · `/login/apple` | `idToken` | Set-Cookie + `LoginOutputModel` |

Frontend hangi kapıdan girilirse girilsin `finishSignIn(yanıt.user, …)`
çalıştırır; auth-modal'ın mevcut yapısı üçünü de taşır.

## Parça A — register'ın session dönmesi

Backend (`UserCommandHandler`):

- `RegisterUserCommand` dönüş tipi `Result<bool>` → `Result<LoginOutputModel>`.
- `LoginCommand`'in kuyruğu (token üret → cookie yaz → `LoginOutputModel`
  kur) private bir `SignIn(user)` yardımcısına çekilir; register kayıttan
  sonra, login doğrulamadan sonra aynı yardımcıyı çağırır.
- Girdi modeli ve hata kalıbı (400 düz metin) değişmez. `IsValid = false`
  girişe engel değildir — e-posta doğrulaması lazy'dir ve bu spec'in
  kapsamı dışındadır.

Frontend:

- `UserService.register` dönüş tipi `Observable<LoginOutputModel>`.
- `AuthModal.signUp`: zincir yerine tek çağrı —
  `register()` → `finishSignIn(yanıt.user, 'Hesabın oluşturuldu, hoş geldin')`.
  "Kayıt başarılı ama otomatik giriş düştü" dalı ve login görünümüne
  düşme davranışı silinir.

Yan düzeltme (aynı elde): `Users.Email` unique index'i koşulsuz, ama
handler `!IsDeleted` filtresiyle kontrol ediyor — soft-delete edilmiş
hesabın e-postasıyla yeniden kayıt, uygulama kontrolünü geçip DB
constraint'ine çarpar (500). Index'e `NOT "IsDeleted"` filtresi eklenir
ki davranış uygulama kuralıyla aynılaşsın.

## Parça B — Google ve Apple ile kayıt/giriş

Akış modeli: **id-token POST** — redirect'li tam OAuth kurulmaz.
Frontend sağlayıcının SDK'sıyla (Google Identity Services; Sign in with
Apple JS) kimlik token'ı alır, backend'e gönderir; backend token'ı
doğrular, kullanıcıyı bulur/oluşturur, kendi cookie'sini yazar. Cookie
tabanlı SPA için en basit ve yeterli model budur.

Backend:

- `User`'a iki nullable kolon: `GoogleSubject`, `AppleSubject` —
  sağlayıcının token'daki değişmez kullanıcı ID'si (`sub`); her birine
  unique index (PostgreSQL'de NULL'lar çakışmaz, filtre gerekmez).
  Sosyal hesap eşleşmesinin birincil anahtarı bu değerdir, e-posta değil
  (e-posta sağlayıcıda değişebilir). Ayrı bir `UserExternalLogin`
  tablosu **açılmaz** — iki sabit sağlayıcı için normalize tablo
  taşımaya değmez (2026-08-08 kararı); üçüncü bir sağlayıcı (örn.
  Facebook) gelirse bir kolon + bir handler dalı eklenir.
- `POST /api/Users/login/google` ve `/login/apple` (`{ idToken }`):
  1. Token imza + audience doğrulaması (Google: Google sertifikaları;
     Apple: Apple JWKS).
  2. Subject ilgili kolonda kayıtlıysa → o kullanıcıyla `SignIn`.
  3. Değilse, token'daki **doğrulanmış** e-posta mevcut bir hesaba aitse →
     o hesabın subject kolonu doldurulur **ve `PasswordHash = null`
     yapılır**, `SignIn`. (Ayrı hesap açılmaz — hesap birleştirme kuralı.)
     Şifre iptalinin sebebi: formdaki e-postalar doğrulanmıyor; başkasının
     e-postasıyla önceden hesap açıp, gerçek sahibi Google ile gelince
     onun hesabına şifreyle ortak olma saldırısı bu satırla kapanır —
     sağlayıcının e-posta kanıtı, doğrulanmamış şifre iddiasını ezer.
  4. Hiçbiri yoksa → `UserType.Customer` hesap oluşturulur
     (`PasswordHash = null`, telefon boş), `SignIn`.
- Şifresiz (yalnız sosyal) hesapla şifreli giriş denemesi
  `InvalidCredentials` döner; şifre belirleme ("şifremi unuttum" ailesi)
  kapsam dışıdır.
- Apple özellikleri: ad-soyad id token'da değil, yalnız **ilk**
  yetkilendirme yanıtında gelir — bu yüzden `/login/apple` girdisi
  `{ idToken, name?, surname? }` şeklindedir ve alanlar yalnız hesap ilk
  oluşturulurken kullanılır. "Hide My Email" relay adresi normal e-posta
  gibi saklanır.

Frontend:

- `AuthModal.socialSignIn` yer tutucusu gerçek akışa bağlanır: SDK'dan
  token al → ilgili ucu çağır → `finishSignIn(yanıt.user, …)`.
- SDK script'leri yalnız modal açıldığında ve tarayıcıda yüklenir
  (SSR'da dokunulmaz).
- **Gömülü tarayıcı (in-app browser) tespiti:** Instagram/Facebook
  reklam trafiği siteyi uygulama içi webview'da açar ve Google, OAuth'u
  webview'da engeller (`disallowed_useragent`); Apple girişi de
  sorunludur. User-agent'tan webview tespit edilir ve sosyal butonlar
  gizlenir — bu kanaldan gelen kullanıcının yolu form ile kayıt +
  otomatik giriştir (Parça A). Instagram reklamları Türk kitleye
  verileceği için bu dal ana funnel'lardan biridir; bozuk butona
  basılmaması ürün gereğidir.

Operasyonel önkoşullar (kod dışı): Google Cloud'da OAuth client ID;
Apple Developer hesabı + Services ID + key. Apple tarafı ücretli üyelik
gerektirir — hazır olmadan Parça B'nin Apple yarısı başlatılmaz.
Not: iOS'ta Google girişi sunan uygulamaya Apple, Sign in with Apple'ı
zorunlu tutar — RN uygulaması planı nedeniyle ikisi birlikte kurulur.

## Parça C — rezervasyon öncesi telefon doğrulama

Rezervasyon özelliği henüz yok; bu parça sözleşmeyi şimdiden sabitler,
uygulaması rezervasyon işiyle birlikte yapılır.

Backend:

- `User`'a `PhoneVerifiedAt (timestamp?)` eklenir. Telefon veya alan
  kodu **değiştiğinde null'a döner** — "doğrulat, sonra numarayı değiştir"
  açığı kapalıdır.
- `POST /api/Users/phone/verification-request` — girişli kullanıcının
  kayıtlı numarasına 6 haneli kod gönderir. Rate limit zorunludur
  (numara + kullanıcı başına; örn. 3/saat) — SMS ucu korumasız bırakılmaz.
- `POST /api/Users/phone/verify { code }` — kod doğruysa
  `PhoneVerifiedAt = now`. Numara başka hesaplarda da kayıtlı/doğrulanmış
  olabilir — kısıt yok (temel karar 5).
- Numara normalize saklanır (yalnız rakam, baştaki sıfırsız) — aynı
  numaranın iki formatta iki kez "unique" olması engellenir.
- Rezervasyon command'i `PhoneVerifiedAt == null` ise
  `PhoneVerificationRequired` ile 400 döner — kontrol sunucudadır.
- SMS gönderimi `ISmsService` arkasına soyutlanır; sağlayıcı seçimi
  (Netgsm, İleti Merkezi, Twilio…) operasyonel karardır ve bu spec'te
  verilmez. Geliştirmede log'a yazan sahte implementasyon kullanılır.

Frontend:

- Rezervasyon akışının içine koşullu adım: `user.phoneVerifiedAt` boşsa
  "numaranı doğrula" ekranı — numara yoksa orada istenir, varsa kod
  onaylatılır. Doğrulama bir kez yapılır; numara değişmedikçe tekrar
  sorulmaz.
- `UserOutputModel`'e `phoneVerifiedAt` alanı eklenir (Swagger'dan
  doğrulanarak).

## Kapsam dışı (bilinçli)

- E-posta doğrulama — **planlanmıyor** (2026-08-08 kararı): önemli olan
  telefon doğrulaması; kullanıcı e-postayı yanlış verdiyse ona
  ulaşamayız, kabul edilmiş risk. `IsValid` hiçbir kapıda kullanılmaz
  (bilgi amaçlı durur); doğrulama maili altyapısı kurulmaz. Bunun tek
  güvenlik bedeli hesap birleştirmedeki şifre iptali kuralıyla ödenir
  (Parça B, adım 3).
- "Şifremi unuttum" — ayrı iş.
- Telefon-OTP ile giriş — **planlanmıyor** (2026-08-08 kararı): şifresiz
  düşük sürtünmeli girişi Google/Apple zaten sağlıyor, telefon girişi
  aynı probleme üçüncü çözüm olurdu. Bu karar telefonun unique
  olmamasını da (temel karar 5) kalıcılaştırır.
- Partner tarafına sosyal giriş — partner hesapları şifreli kalır.
- SMS sağlayıcı seçimi ve sözleşmesi.
- Yeni test yazımı (proje kararı); mevcut suite yeşil kalır.

## Uygulama sırası

Parçalar bağımsızdır ve ayrı ayrı planlanıp uygulanır:

1. **A** — küçük, önkoşulsuz; hemen yapılabilir.
2. **B** — operasyonel önkoşullara (client ID'ler) bağlı; Google ve
   Apple yarıları ayrı da gidebilir.
3. **C** — rezervasyon özelliğiyle birlikte; şimdilik yalnız sözleşme.

## Riskler

- Apple JS akışının `form_post` varyantı ve popup davranışı — Parça B
  planlanırken güncel Apple dokümantasyonuyla doğrulanır.
- Google One Tap'in modal dışında da görünmesi istenirse (dönüşüm için
  yaygın) SSR sayfalarında script yükleme stratejisi ayrıca düşünülür;
  v1'de yalnız modal içi buton.
- Parça A'daki filtreli e-posta index'i PostgreSQL'de sorunsuz (partial
  index) — EF Core migration'da `HasFilter` ile yazılır.
- `PasswordHash = null` sosyal hesaplar: mevcut login yolu null hash'le
  `VerifyHashedPassword` çağırmamalı — null kontrolü `InvalidCredentials`
  dönerek eklenir.
