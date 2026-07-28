# DashboardShell — Provider paneli için Spartan tabanlı layout iskeleti

**Tarih:** 2026-07-29
**Durum:** Onaylandı
**Kapsam:** Bu işte yalnızca provider-layout shell'e bağlanır; admin-layout sonraki işte geçer.

## Amaç

Provider (partner) panelinin layout'u şu an düz Tailwind (`slate-*`) ile yazılmış basit
bir sidebar. Spartan UI projeye eklendiğine göre layout tam bir "panel shell"ine
dönüştürülecek: sidebar + topbar + kullanıcı menüsü + çıkış. Shell, admin panelinde de
kullanılacak şekilde parametrik yazılır ama admin bu işin kapsamı dışındadır.

## Yapı

Yeni bileşen: `src/app/layouts/dashboard-shell/`

- `dashboard-shell.ts` + `dashboard-shell.html`
- `nav-item.ts` — `NavItem` tipi (`path`, `label`, `exact`). `core/models/` Swagger
  kaynaklı API modellerine ayrıldığı için bu saf UI tipi shell'in yanında yaşar.

Input'lar:

| Input | Tip | Açıklama |
|---|---|---|
| `title` | `string` | Sidebar başlığı (ör. "Tekne Sahibi") |
| `navItems` | `NavItem[]` | Sidebar linkleri |
| `loginPath` | `string` | Çıkış sonrası yönlendirilecek adres |

Routed içerik `<ng-content />` ile projekte edilir; `<router-outlet />` layout
bileşenlerinde kalır. `provider-layout` incelir: shell'i sarar, kendi nav listesini ve
`/partner/login` yolunu verir.

## Görünüm

- `slate-*` renkleri yerine Spartan tema token'ları: `bg-background`, `bg-muted/40`,
  `border-border`, `text-muted-foreground`, `text-foreground`. İleride tema/dark mode
  değişikliği bedavaya gelir.
- Nav linkleri `hlmBtn` ghost varyantıyla giydirilir; aktif link `routerLinkActive`
  üzerinden `bg-accent text-accent-foreground` alır.
- Topbar: `h-14`, `border-b`. Sol taraf şimdilik boş (breadcrumb bilinçli olarak
  kapsam dışı), sağda kullanıcı menüsü.

## Kullanıcı menüsü ve çıkış

- Spartan popover; trigger, kullanıcının adını gösteren ghost buton.
- Ad-soyad `AuthStore.user`'dan okunur. Store boşsa (sayfa yenilenmesi sonrası) buton
  "Hesap" yazar — `me()` ile oturum geri yükleme bilinçli olarak kapsam dışı.
- Popover içeriği: ad-soyad + e-posta, ayraç, "Çıkış yap" butonu.
- Çıkış akışı: `UserService.logout()` çağrılır; başarılı ya da başarısız fark etmeksizin
  `AuthStore.setUser(null)` yapılır ve `loginPath`'e yönlendirilir. Cookie silinemese
  bile lokal oturum düşürülür.

## Test

Shell için tek Vitest dosyası:

1. Verilen `navItems` render ediliyor mu?
2. Çıkış, `UserService.logout`'u çağırıp store'u temizliyor ve `loginPath`'e
   yönlendiriyor mu (hata durumunda da)?

## Kapsam dışı

- Admin layout'un shell'e bağlanması (sonraki iş)
- Breadcrumb / sayfa başlığı (topbar solu boş)
- `me()` ile oturum geri yükleme
- Mobil responsive sidebar (iskelet aşamasında masaüstü yeterli)
