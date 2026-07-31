import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api/api.config';
import { BoatInputModel, BoatOutputModel } from '@models';

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

  /** Tüm tekneler — market listelemesinin kaynağı, sahibe göre süzülmez. */
  getList(): Observable<BoatOutputModel[]> {
    return this.http.get<BoatOutputModel[]>(this.baseUrl);
  }

  /**
   * Oturumdaki partner'ın kendi tekneleri — yalnızca `Partner` rolü.
   * Süzme backend'de `OwnerId` claim'i üzerinden yapılır.
   */
  getMine(): Observable<BoatOutputModel[]> {
    return this.http.get<BoatOutputModel[]>(`${this.baseUrl}/mine`);
  }

  /** Tek tekne — fotoğraf yönetimi gibi tek ilana bakan sayfaların kaynağı. */
  getById(id: number): Observable<BoatOutputModel> {
    return this.http.get<BoatOutputModel>(`${this.baseUrl}/${id}`);
  }
}
