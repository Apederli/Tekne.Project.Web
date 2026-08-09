import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api/api.config';
import {
  BoatCardOutputModel,
  BoatInputModel,
  BoatListFilterInputModel,
  BoatOutputModel,
} from '@models';

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

  /**
   * Partner kendi teknesini günceller — yalnızca `Partner` rolü.
   *
   * Uç henüz backend'de yok (2026-08-01); eklendiğinde çalışacak şekilde
   * `create` ile aynı gövde şeması varsayılıyor.
   */
  update(id: number, model: BoatInputModel): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, model);
  }

  /**
   * Pazar yeri kartları — yalnızca yayında olan tekneler, kart alanlarıyla sınırlı.
   * Dolu filtre alanları sorgu parametresi olarak gider; boş alanlar hiç yazılmaz.
   */
  getList(filter?: BoatListFilterInputModel): Observable<BoatCardOutputModel[]> {
    const params: Record<string, string | number> = {};
    if (filter?.harborId != null) params['harborId'] = filter.harborId;
    return this.http.get<BoatCardOutputModel[]>(this.baseUrl, { params });
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
