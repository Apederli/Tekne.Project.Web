# Partner dashboard routing ve panel noindex

**Tarih:** 2026-07-29
**Durum:** Onaylandı

## Amaç

Partner paneli bugün `/partner` kökünde yaşıyor (`/partner/teknelerim` vb.) ve
panel sayfaları arama motorlarına açık. Panel `/partner/dashboard` tabanına
taşınacak ve partner + admin alanlarının tamamı (login dahil) indekslenmeye
kapatılacak.

## URL yapısı

| Eski | Yeni |
|---|---|
| `/partner/login` | `/partner/login` (değişmez, guard dışı) |
| `/partner` (Genel Bakış) | `/partner/dashboard` |
| `/partner/teknelerim` | `/partner/dashboard/teknelerim` |
| `/partner/musaitlik` | `/partner/dashboard/musaitlik` |
| `/partner/rezervasyonlar` | `/partner/dashboard/rezervasyonlar` |
| — | `/partner` → `/partner/dashboard` redirect |

- `ROUTE_PARTNER.dashboard` sabiti `''` → `'dashboard'` olur. Nav linkleri,
  login sonrası yönlendirme ve route tanımları sabitlerden türediği için
  değişiklik tek kaynaktan yayılır.
- `ProviderLayout` (ve `roleGuard`) `path: 'dashboard'` route'una taşınır;
  alt sayfalar onun children'ı olur (Genel Bakış `path: ''`).
- `/partner` çıplak URL'i `dashboard`'a redirect eder; oturum yoksa guard
  login'e atar.
- `app.routes.server.ts`'teki `partner/**` → `RenderMode.Client` kalıbı yeni
  yapıyı zaten kapsıyor; ek girdi gerekmez.

## Login akışı

Başarılı girişte `partner-login`, `/partner/dashboard`'a yönlendirir
(bugün `/partner`).

## Noindex — X-Robots-Tag

`src/server.ts`'e middleware eklenir: path'i `/partner` veya `/admin` ile
başlayan tüm isteklerin yanıtına `X-Robots-Tag: noindex, nofollow` başlığı
konur (login sayfası ve statik dosyalar dahil).

**robots.txt'e `Disallow` bilinçli olarak yazılmaz:** robots.txt engeli
crawler'ın sayfayı hiç görmemesine yol açar; dış link alan URL yine de
"içeriği bilinmeyen sayfa" olarak indekslenebilir. Noindex sinyalinin
görülebilmesi için crawl'a izin verip başlıkla reddetmek tercih edilir.

## Test

1. Provider rolünde kullanıcı varken `/partner` navigasyonu
   `/partner/dashboard`'a düşer (redirect + guard geçişi).
2. Oturumsuz kullanıcı `/partner/dashboard`'a gidemez, `/partner/login`'e
   yönlendirilir.
3. Mevcut 11 test değişmeden geçer.

## Kapsam dışı

- robots.txt / sitemap dosyası oluşturmak
- Admin routing'inde yapısal değişiklik (yalnız noindex başlığı alır)
- Market alanında herhangi bir değişiklik
