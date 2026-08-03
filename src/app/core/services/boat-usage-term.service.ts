import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api/api.config';
import { BoatUsageTermInputModel } from '@models';

/**
 * `BoatUsageTermsController` (`/api/Boats/{boatId}/usage-terms`) karşılığı.
 * `Partner` politikasına bağlı; tekne sahipliği backend'de doğrulanıyor.
 */
@Service()
export class BoatUsageTermService {
  http = inject(HttpClient);
  baseUrl = inject(API_BASE_URL);

  /**
   * İşaretli şartları gönderilen listeye eşitler — tam liste gönder, boş liste
   * hepsini kaldırır.
   *
   * Backend iki kuralı reddeder: aynı gruptan birden çok şart, ve teknenin
   * kiralama tipine uymayan şart. İkisi de listenin tamamına uygulanır;
   * "eskiden işaretlenmiş ama artık uymayan" diye bir muafiyet yok, çünkü
   * katalog değişince backend geçersiz kalan işaretleri kendisi temizliyor.
   */
  set(boatId: number, usageTermIds: number[]): Observable<boolean> {
    const body: BoatUsageTermInputModel = { usageTermIds };
    return this.http.put<boolean>(`${this.baseUrl}/Boats/${boatId}/usage-terms`, body);
  }
}
