import { Service, inject } from '@angular/core';
import { HttpClient, HttpContext, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, of, throwError } from 'rxjs';
import { API_BASE_URL } from '../api/api.config';
import { SILENT_ERRORS } from '@interceptors/error.interceptor';
import { BoatPricingInputModel, BoatPricingOutputModel, PricingPreviewOutputModel } from '@models';

/**
 * `BoatsController`'ın fiyatlandırma uçları (`/api/Boats/{id}/pricing` ve
 * `/api/Boats/pricing/preview`). Hepsi `Partner` politikasına bağlı; tekne
 * sahipliği backend'de doğrulanır.
 */
@Service()
export class BoatPricingService {
  http = inject(HttpClient);
  baseUrl = inject(API_BASE_URL);

  /**
   * Teknenin fiyat kaydı; hiç girilmemişse `null`.
   *
   * Backend null değerli başarıyı 404'e çevirir (`Result.ToActionResult`) —
   * ilk girişte kayıt yokluğu beklenen durum, hata değil. Bu yüzden 404
   * burada `null`'a eşlenir ve "Kayıt bulunamadı" toast'ı çıkmasın diye
   * istek SILENT_ERRORS ile gider. Diğer hatalar aynen fırlatılır; sekme
   * kendi hata durumunu gösterir.
   */
  getPricing(boatId: number): Observable<BoatPricingOutputModel | null> {
    return this.http
      .get<BoatPricingOutputModel>(`${this.baseUrl}/Boats/${boatId}/pricing`, {
        context: new HttpContext().set(SILENT_ERRORS, true),
      })
      .pipe(
        catchError((error: HttpErrorResponse) =>
          error.status === 404 ? of(null) : throwError(() => error),
        ),
      );
  }

  /** Tam model gönderilir — upsert; `null` dilim o dilimi temel ücrete düşürür. */
  upsert(boatId: number, model: BoatPricingInputModel): Observable<boolean> {
    return this.http.put<boolean>(`${this.baseUrl}/Boats/${boatId}/pricing`, model);
  }

  /**
   * Kaydedilmemiş matrisin örnek hesabı. Tekne id'si yok — hesap kayda değil
   * gövdedeki değerlere bakıyor.
   *
   * SILENT_ERRORS: kullanıcı sayı yazarken uçan her başarısız istek için toast
   * basmak gürültüden ibaret olurdu; ekran son iyi sonucu göstermeye devam eder.
   */
  preview(model: BoatPricingInputModel): Observable<PricingPreviewOutputModel> {
    return this.http.post<PricingPreviewOutputModel>(
      `${this.baseUrl}/Boats/pricing/preview`,
      model,
      { context: new HttpContext().set(SILENT_ERRORS, true) },
    );
  }
}
