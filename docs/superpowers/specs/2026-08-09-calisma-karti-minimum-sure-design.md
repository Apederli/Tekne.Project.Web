# Çalışma kartı: kiralama tipi + minimum süre — tasarım

**Tarih:** 2026-08-09
**Kapsam:** Partner tekne formu (Genel sekmesi). Market tarafında gösterim ve `/api/Tours` uçları kapsam dışı.

## Amaç

Partner, teknesinin **saatlik mi gecelik mi** çalıştığını ve kabul ettiği **minimum süreyi** tek yerden yönetsin. Backend bu alanları hazır sunuyor: `BoatInputModel.minimumRentalDuration` (nullable int) ve `BoatOutputModel.minimumRentalDuration` (her zaman dolu, ≥ 1).

## Arka plan — backend kuralları (kaynak: API spec + `BoatValidators.cs`)

- `RentalType` enum'u **`Hourly = 1, Nightly = 2`** — eski `Daily` üyesi `Nightly` olarak yeniden adlandırıldı. Frontend'in `Daily` göndermesi artık geçersiz (parse edilemez); bu tasarım o kırığı da kapatır.
- `minimumRentalDuration` null gönderilirse backend **1** kaydeder; girilirse **≥ 1** olmalı.
- Kiralama tipi **Saatlik** iken tavan **12**; **Gecelik**te tavan yok.
- Birim tipten gelir: saatlik teknede **saat**, gecelik teknede **gece**.

## Değişiklikler

### 1. Model/enum güncellemeleri (`core/`)

- `enums/rental-type.ts`: `Daily = 'Daily'` → `Nightly = 'Nightly'`; yorum backend'in yeni enum'una göre güncellenir.
- `models/boat.ts`:
  - `BoatInputModel.minimumRentalDuration?: number` — Swagger'da nullable, ama form her zaman değer gönderir.
  - `BoatOutputModel.minimumRentalDuration: number` — backend her zaman doldurur.
  - `BoatFormModel.minimumRentalDuration: number | null` — sayısal input'un boş hâlini taşıyabilir.
- `util/boat-form-model.ts`: `emptyBoatForm()` alanı **1** ile başlatır (ürün kararı: default 1 gitsin); `toBoatFormModel()` tekneden okur.

### 2. Yeni "Çalışma" kartı (boat-form)

- Genel sekmesindeki forma yeni bir **Çalışma** kartı eklenir. Başlık: "Çalışma", açıklama: "Teknenin kiralama modeli ve kabul ettiği minimum süre."
- **Kiralama tipi** toggle'ı "Temel bilgiler" kartından bu karta taşınır. Seçenek etiketi "Günlük" → **"Gecelik"** olur (`RentalType.Nightly`).
- Yanına **Minimum süre** sayı alanı (`app-input type="number"`) gelir. Etiket seçime göre `computed` ile değişir:
  - Saatlik → "Minimum süre (saat)"
  - Gecelik → "Minimum süre (gece)"
  - Henüz seçim yok → "Minimum süre"
- Kiralama tipi değiştirilince girilen sayı **korunur**; yalnızca birim etiketi değişir.

### 3. Doğrulama (backend `BoatInputModelValidator` ile birebir)

- Zorunlu: "Minimum süre gerekli."
- En az 1: "Minimum süre en az 1 olmalı."
- Kiralama tipi Saatlik iken en fazla 12: "Saatlik teknede minimum süre en fazla 12 saat olabilir." — koşullu `validate()` ile, `valueOf(path.rentalType)` üzerinden. Gecelik→Saatlik geçişte 12'den büyük değer kalırsa hata görünür, kayıt engellenir.

### 4. Gönderim

`save()` içinde `minimumRentalDuration: m.minimumRentalDuration ?? 1` olarak `BoatInputModel`'e yazılır (doğrulama boş bırakmayı zaten engeller; `?? 1` yalnızca tip daraltmadır).

## Kapsam dışı

- Market tarafında gösterim (`BoatCardOutputModel` alanı taşımıyor; detay sayfası gösterimi istenirse ayrı iş).
- `/api/Tours` uçları ve Tour modelleri.
- `BoatType`'a backend'de eklenen yeni tipler (Yat, Sürat teknesi, Davet teknesi, Tekne).
- Yeni test yazılmaz (proje sonu kuralı); yalnızca `Daily` → `Nightly` değişiminden etkilenen mevcut spec'ler yeşil tutulur.

## Hata yönetimi

Mevcut kalıp korunur: beklenen HTTP hataları için try/catch yazılmaz, mesajı `errorInterceptor` gösterir.
