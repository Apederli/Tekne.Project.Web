# Responsive DashboardShell — mobil ve tablet uyumu

**Tarih:** 2026-07-29
**Durum:** Onaylandı
**Önceki spec:** `2026-07-29-dashboard-shell-design.md` (shell'in kendisi)

## Amaç

`DashboardShell` masaüstü odaklı kuruldu: sabit `w-60` sidebar her ekranda görünür ve
dar ekranlarda içeriğe yer bırakmıyor. Shell, lg (1024px) altında drawer'lı bir
düzene geçirilecek.

## Kırılım davranışı

| Aralık | Sidebar | Topbar |
|---|---|---|
| ≥ lg (1024px) | Bugünkü sabit `w-60` sidebar — değişiklik yok | Sağda kullanıcı menüsü (değişiklik yok) |
| < lg | Gizli (`hidden lg:block`); menü soldan Spartan sheet ile drawer olarak açılır | Solda yalnız bu aralıkta görünen (`lg:hidden`) hamburger butonu + sağda kullanıcı menüsü |

İçerik dolgusu mobilde daralır: `main` → `p-4 sm:p-6 lg:p-8`.

## Sheet kurulumu

- Spartan **sheet** bileşeni `npx @spartan-ng/cli` ile `src/app/shared/ui/sheet/`
  altına eklenir (diğer bileşenlerle aynı düzen).
- `tsconfig.json` paths'ine `@ui/sheet` alias'ı yazılır.
- Focus trap, Escape ile kapanma ve backdrop tıklamasıyla kapanma sheet'ten hazır gelir;
  elle yazılmaz.

## Nav'ın tek kaynağı

Nav listesi iki yerde görünür (statik sidebar + drawer) ama markup tek yerde yaşar:
shell template'inde bir `ng-template`'e alınır, iki noktada `ngTemplateOutlet` ile
basılır. Nav markup'ının kopyalanması kabul edilmez.

## Drawer davranışı

- Hamburger'a tıklayınca sheet **soldan** açılır; içinde sidebar'dakiyle aynı başlık
  (`panelTitle`) ve nav linkleri.
- Bir nav linkine tıklanınca drawer kendiliğinden kapanır (yönlendirme + kapama).
- Kullanıcı menüsü (popover) topbar'da kalır, drawer'a taşınmaz — mobilde de sağ
  üstte erişilebilir.

## Test

- Mevcut 6 shell testi değişmeden geçmeli (lg+ davranışı aynı).
- Yeni testler:
  1. Hamburger butonu render ediliyor.
  2. Hamburger'a tıklayınca drawer içeriği (nav linkleri) DOM'a geliyor.
  3. Drawer'daki nav linkine tıklayınca drawer kapanıyor.

## Kapsam dışı

- Tablet için ikonlu/daraltılmış sidebar ve nav item ikonları
- Admin layout'un shell'e bağlanması (ayrı iş)
- Kullanıcı menüsünün mobilde farklı bir yere taşınması
