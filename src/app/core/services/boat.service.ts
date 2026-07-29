import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api/api.config';
import { BoatInputModel } from '@models';

/**
 * `BoatsController` (`/api/Boats`) karşılığı. Liste ve detay uçları,
 * onları kullanan sayfalar bağlanırken eklenecek.
 */
@Service()
export class BoatService {
  http = inject(HttpClient);
  baseUrl = `${inject(API_BASE_URL)}/Boats`;

  /**
   * Partner yeni tekne ekler — yalnızca `Partner` rolü. Yanıt oluşan
   * teknenin id'sidir; fotoğraflar bu id ile ayrı uçtan yüklenir.
   */
  create(model: BoatInputModel): Observable<number> {
    return this.http.post<number>(this.baseUrl, model);
  }
}
