import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api/api.config';
import {
  BoatCardOutputModel,
  BoatInputModel,
  BoatListFilterInputModel,
  BoatModelOutputModel,
  BoatOutputModel,
  BrandOutputModel,
} from '@models';

@Service()
export class BoatService {
  http = inject(HttpClient);
  baseUrl = `${inject(API_BASE_URL)}/Boats`;

  create(model: BoatInputModel): Observable<number> {
    return this.http.post<number>(this.baseUrl, model);
  }

  update(id: number, model: BoatInputModel): Observable<boolean> {
    return this.http.put<boolean>(`${this.baseUrl}/${id}`, model);
  }

  /**
   * Pazar yeri listesi. Filtre alanlarının hepsi opsiyonel; hiç gönderilmezse
   * kart teknenin en düşük saat ücretini gösterir. Boş alanlar sorgu dizesine
   * hiç yazılmaz — backend "alan yok" ile "alan boş"u ayırıyor.
   */
  getList(filter?: BoatListFilterInputModel): Observable<BoatCardOutputModel[]> {
    const params: Record<string, string | number> = {};

    for (const [key, value] of Object.entries(filter ?? {})) {
      if (value != null && value !== '') params[key] = value;
    }

    return this.http.get<BoatCardOutputModel[]>(this.baseUrl, { params });
  }

  getMine(): Observable<BoatOutputModel[]> {
    return this.http.get<BoatOutputModel[]>(`${this.baseUrl}/mine`);
  }

  getById(id: number): Observable<BoatOutputModel> {
    return this.http.get<BoatOutputModel>(`${this.baseUrl}/${id}`);
  }

  getBrands(): Observable<BrandOutputModel[]> {
    return this.http.get<BrandOutputModel[]>(`${this.baseUrl}/brands`);
  }

  /** Markanın modelleri. Katalogda olmayan marka 404 döner. */
  getModels(brandId: number): Observable<BoatModelOutputModel[]> {
    return this.http.get<BoatModelOutputModel[]>(`${this.baseUrl}/brands/${brandId}/models`);
  }
}
