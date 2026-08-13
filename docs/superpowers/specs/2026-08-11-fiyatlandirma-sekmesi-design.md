# Fiyatlandırma Sekmesi — Tasarım

**Tarih:** 2026-08-11
**Kapsam:** Tekne düzenleme sayfasına beşinci sekme: partner'ın teknesinin saatlik fiyat matrisini girdiği, açıklamalı ve canlı örnek hesaplı ekran.

## Amaç

Backend'e eklenen fiyatlandırma uçlarını partner arayüzüne bağlamak:

- `GET /Boats/{id}/pricing` — teknenin fiyat kaydı. **Kayıt yoksa backend 404
  döner** (`Result.ToActionResult` null değerli başarıyı 404'e çevirir);
  serviste 404 → `null` eşlenir ve istek `SILENT_ERRORS` ile gider — ilk
  giriş beklenen durumdur, toast çıkmaz. (Uygulama sırasında bulundu,
  2026-08-11.)
- `PUT /Boats/{id}/pricing` — upsert

Fiyat modeli: zorunlu **temel saat ücreti** (`baseRate`) + 6 opsiyonel dilim ücreti
(**Hafta içi / Hafta sonu × Sabah / Akşam / Gece**). Boş dilim temel ücrete düşer
(`rate ?? baseRate` — bkz. backend `PricingCalculator.Resolve`).

Dilim sınırları backend `PricingOptions` config'inden: **Gece 00–08, Sabah 08–18,
Akşam 18–24** (`MorningStartHour=8`, `EveningStartHour=18`).

## Kararlar (kullanıcıyla netleşti)

| Konu | Karar |
|---|---|
| Gecelik (Nightly) tekne | Form yerine bilgi notu: "Gecelik fiyatlandırma henüz hazır değil." Backend'de gecelik hesap yok, odak saatlik. |
| Sekme adı / slug | **Fiyatlandırma** / `fiyatlandirma` |
| Kaydetme | **Kaydet butonu**, tek `PUT`. Otomatik kayıt yok — yarım yazılmış sayı sunucuya gitmesin. |
| Açıklama içeriği | Dilim saatleri + "boş hücre temel ücrete düşer" kuralı + **canlı örnek hesap**. Ön ödeme / komisyon oranı ekranda **gösterilmez**. |
| Düzen | **Tek matris tablosu**: satırlar dilimler (saat aralıklarıyla), sütunlar hafta içi/sonu. Boş hücrenin placeholder'ı canlı temel ücret. |

## Dosyalar

| Dosya | İş |
|---|---|
| `src/app/core/routes.const.ts` | `BOAT_EDIT_TABS`'e `pricing: 'fiyatlandirma'` |
| `src/app/core/models/boat-pricing.ts` (yeni) | `BoatPricingInputModel`, `BoatPricingOutputModel` — Swagger'la birebir 7 alan (`baseRate: number`, 6 × `number \| null`) |
| `src/app/core/services/boat-pricing.service.ts` (yeni) | `BoatPricingService`: `getPricing(boatId)`, `upsert(boatId, model)`. Mevcut `boat-photo` / `boat-usage-term` servis deseni. |
| `src/app/features/provider/boats/boat-pricing/` (yeni) | Sekme bileşeni `BoatPricing` (`boat-pricing.ts` + `.html`) |
| `src/app/features/provider/boats/boat-edit/*` | Beşinci trigger "Fiyatlandırma" + `hlmTabsContentLazy` içerik |

Barrel'lar (`@models`, `@services`) yeni dosyaları export eder.

## Bileşen davranışı

- `boatId` route `paramMap`'ten okunur (boat-terms deseni — sekme bileşenine
  `withComponentInputBinding` işlemez).
- İki `rxResource`: tekne (`rentalType` için `GET /Boats/{id}`) ve fiyat kaydı
  (`GET /Boats/{id}/pricing`). Sekmeler kapsayıcıdan bağımsız veri çeker
  (mevcut tasarım kararı).
- **Gecelik teknede** yalnızca bilgi notu; form render edilmez.
- **Saatlik teknede** Signal Forms (`@angular/forms/signals`) ile form:
  - `baseRate`: zorunlu, > 0
  - 6 dilim alanı: opsiyonel; doluysa > 0 (backend validator'la aynı kural)
  - Boş dilim input'unun `placeholder`'ı canlı `baseRate` değeri — "boş = temel
    ücret" kuralı görsel olarak da okunur.
- Kaydet → `PUT`; başarıda toast ("Fiyatlar kaydedildi" vb.), kaynak yeniden
  yüklenmez (sunucu yanıtı `bool`; form zaten güncel hâli gösteriyor).
  Hata mesajını interceptor gösterir; bileşen hata mesajı üretmez.
- Fiyat kaydı `null` gelirse boş form (ilk giriş senaryosu).

### Dilim sınırı sabitleri

`MorningStartHour=8` / `EveningStartHour=18` endpoint'le servis edilmiyor;
bileşende (veya matris tanım sabitinde) yorum satırıyla işaretlenmiş sabit
tutulur: *backend `PricingOptions` ile elle senkron*. Backend bu değerleri
değiştirirse ekrandaki saat aralıkları elle güncellenmeli. (İleride uç açılırsa
kaldırılacak bilinçli bir bağ.)

## Ekran düzeni (mobile-first)

```
Temel saat ücreti *  [ 1500 ] TL

Kısa açıklama: dilim saatleri + boş hücre kuralı.

                 Hafta içi    Hafta sonu
Sabah 08–18      [ ⁘1500 ]    [ 2000  ]
Akşam 18–24      [ 1800  ]    [ ⁘1500 ]
Gece  00–08      [ ⁘1500 ]    [ ⁘1500 ]

── Örnek hesap ───────────────────────
Çarşamba 10:00–14:00 (4 saat)
  4 saat × 1500 (hafta içi sabah) = 6.000 TL
Cumartesi 16:00–20:00 (4 saat)
  2 saat × 2000 (hafta sonu sabah) = 4.000
  2 saat × 1500 (hafta sonu akşam) = 3.000
  Toplam                           = 7.000 TL

[ Kaydet ]
```

- Matris 3 sütunlu grid (satır etiketi + 2 input); taban sınıflar mobil,
  `sm:`+ yalnızca genişletir. Dokunma hedefleri parmak boyunda.
- `⁘` = boş hücre; placeholder soluk temel ücreti gösterir.

## Örnek hesap (canlı)

- Backend `PricingCalculator.Breakdown`'ın istemci kopyası: her saat için dilim
  belirle, ücreti çöz (`dilim ?? temel`), ardışık aynı-ücretli saatleri grupla.
- İki sabit senaryo:
  1. **Çarşamba 10:00–14:00** — tek dilim, hafta içi (basit durum)
  2. **Cumartesi 16:00–20:00** — sabah→akşam dilim geçişi, hafta sonu (matrisin
     hesaba nasıl döndüğünü gösteren durum)
- `computed()` ile form değerlerinden türetilir; kullanıcı yazdıkça güncellenir.
- `baseRate` geçersizken (boş/≤0) örnek hesap bölümü gizlenir.
- Ön ödeme / komisyon satırı yok.

## Durumlar

- **Yükleme:** iskelet (boat-terms kalıbı; matris boyutlarına yakın yer tutucu).
- **Hata:** "Fiyat bilgisi yüklenemedi. Sayfayı yenileyip tekrar deneyin."
  (lazy sekme yeniden istek atmadığı için yenileme yönlendirmesi).

## Test

Proje kuralı: özellik geliştirmede yeni test yazılmıyor; mevcut süit yeşil
tutulur (`npm test -- --watch=false`).
