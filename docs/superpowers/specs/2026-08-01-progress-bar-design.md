# Üst ilerleme barı — tasarım

Tarih: 2026-08-01
Durum: onaylandı, uygulanmadı

## Amaç

Site genelinde, uçan HTTP isteği varken ekranın en üstünde akan ince bir
ilerleme barı (YouTube / native uygulama deseni). İçeriği örtmez, dokunmayı
engellemez — mobil öncelikli kullanım için overlay spinner yerine bilinçli
tercih. Sayfa içi iskeletler ve buton bekleme durumları **kalır**; bar
onların yerine değil, üstüne gelen ortak geri bildirimdir.

## Kapsam

Dahil: istek sayacı servisi, sayan interceptor, bar bileşeni, App köküne
yerleşim.

Hariç (bilinçli):

- **Determinate yüzde** — istek sayısından gerçek ilerleme çıkmaz;
  indeterminate animasyon yeter.
- **Route geçiş göstergesi** — lazy chunk indirme süresi bugün sorun değil;
  yalnızca HTTP izlenir.
- **Alan bazlı filtre** — bar her alanda (market/admin/partner) görünür;
  "sadece giriş yapılan bölümler" kısıtı değerlendirildi ve gereksiz
  bulundu (market de istek atıyor, gösterge orada da faydalı).
- **Yeni test yazımı** — proje kararı.

## Parçalar

### 1. `PendingRequests` servisi — `src/app/core/services/pending-requests.service.ts`

Uçan istek sayacının tek sahibi:

- `count` signal (number, başlangıç 0); `increment()` / `decrement()`.
- `pending = computed(() => this.count() > 0)`.

### 2. `pendingRequestsInterceptor` — `src/app/core/interceptors/pending-requests.interceptor.ts`

- **Yalnızca tarayıcıda sayar:** platform tarayıcı değilse isteği olduğu
  gibi geçirir. Böylece SSR HTML'inde bar hiç görünmez, hydration
  uyuşmazlığı olmaz (template'te platform dallanması yok — sayaç server'da
  hiç artmadığı için görünürlük zaten false).
- Tarayıcıda: `increment()`, `finalize(() => decrement())` — başarı, hata
  ve iptalde de düşer.
- Tüm HttpClient istekleri sayılır; URL filtresi yok (bugün tüm istekler
  zaten API'ye gidiyor, filtre YAGNI).
- `app.config.ts`'te mevcut interceptor listesine eklenir.

### 3. `ProgressBar` bileşeni — `src/app/shared/progress-bar/`

- `App` kökünde (`app.html`) bir kez, `router-outlet`'in üstünde.
- Görünüm: `position: fixed`, üstte tam genişlik, ~3px yükseklik, `z-50`
  (layout header'larının üstünde), `pointer-events-none`; içinde primary renkte, CSS keyframes ile
  sağa akan indeterminate şerit. Animasyon saf CSS — JS zamanlayıcıyla
  kare üretilmez.
- **Titreme önleme:** `pending` true olunca bar hemen değil, **300ms**
  sonra görünür (istek o sürede bittiyse hiç görünmez); `pending` false
  olunca gizlenir. Gecikme bileşen içinde tek bir `setTimeout`/`effect`
  ile yönetilir, tarayıcıda çalıştığı garanti (sayaç yalnızca tarayıcıda
  artıyor).

## Veri akışı

```
HttpClient isteği → pendingRequestsInterceptor → PendingRequests.count
                                                        ↓ computed
                                            ProgressBar (300ms gecikmeli görünürlük)
```

Hata yönetimi bilinçli olarak yok: bar hatayla ilgilenmez (`finalize`
sayacı her koşulda düşürür), mesaj gösterme işi `errorInterceptor`'da
kalır.
