import { Service, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api/api.config';
import { UsageTermInputModel, UsageTermOutputModel } from '@models';
import { RentalType } from '@enums';

/**
 * `UsageTermsController` (`/api/UsageTerms`) karşılığı. Liste ucu oturum ister,
 * yazma uçlarının tamamı yalnızca `Admin` politikasına açık.
 */
@Service()
export class UsageTermService {
  http = inject(HttpClient);
  baseUrl = `${inject(API_BASE_URL)}/UsageTerms`;

  /**
   * Aktif kullanım şartları, `order` sırasında.
   *
   * `rentalType` verilirse yalnızca o tipe ait ve her iki tipte geçerli
   * şartlar döner (tekne formu); verilmezse katalogun tamamı döner
   * (admin ekranı).
   */
  getList(rentalType?: RentalType): Observable<UsageTermOutputModel[]> {
    const params = rentalType ? new HttpParams().set('rentalType', rentalType) : undefined;
    return this.http.get<UsageTermOutputModel[]>(this.baseUrl, { params });
  }

  /** Yeni kullanım şartı — yalnızca `Admin`. Yanıt oluşan kaydın id'sidir. */
  create(model: UsageTermInputModel): Observable<number> {
    return this.http.post<number>(this.baseUrl, model);
  }

  /** Kullanım şartını günceller — yalnızca `Admin`. */
  update(id: number, model: UsageTermInputModel): Observable<boolean> {
    return this.http.put<boolean>(`${this.baseUrl}/${id}`, model);
  }

  /**
   * Şartı pasifleştirir — yalnızca `Admin`. Gerçek silme değil: şart
   * katalogdan düşer ama onu işaretlemiş tekneler etkilenmez.
   */
  delete(id: number): Observable<boolean> {
    return this.http.delete<boolean>(`${this.baseUrl}/${id}`);
  }
}
