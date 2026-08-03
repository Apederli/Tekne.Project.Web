import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api/api.config';
import { BoatAmenityInputModel } from '@models';

/**
 * `BoatAmenitiesController` (`/api/Boats/{boatId}/amenities`) karşılığı.
 * `Partner` politikasına bağlı; tekne sahipliği backend'de doğrulanıyor.
 */
@Service()
export class BoatAmenityService {
  http = inject(HttpClient);
  baseUrl = inject(API_BASE_URL);

  /**
   * İşaretli imkanları gönderilen listeye eşitler — tam liste gönder, boş liste
   * hepsini kaldırır.
   *
   * Kullanım şartlarının aksine tek kural id'nin katalogda bulunması: imkanlar
   * birbirini dışlamaz ve kiralama tipinden bağımsızdır.
   */
  set(boatId: number, amenityIds: number[]): Observable<boolean> {
    const body: BoatAmenityInputModel = { amenityIds };
    return this.http.put<boolean>(`${this.baseUrl}/Boats/${boatId}/amenities`, body);
  }
}
