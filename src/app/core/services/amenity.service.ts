import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api/api.config';
import { AmenityInputModel, AmenityOutputModel } from '@models';

/**
 * `AmenitiesController` (`/api/Amenities`) karşılığı. Liste ucu oturum ister,
 * yazma uçlarının tamamı yalnızca `Admin` politikasına açık.
 */
@Service()
export class AmenityService {
  http = inject(HttpClient);
  baseUrl = `${inject(API_BASE_URL)}/Amenities`;

  /**
   * İmkan katalogu, `order` sırasında. Kullanım şartlarının aksine
   * kiralama tipine göre süzülmez — imkanlar tipten bağımsızdır.
   */
  getList(): Observable<AmenityOutputModel[]> {
    return this.http.get<AmenityOutputModel[]>(this.baseUrl);
  }

  /** Yeni imkan — yalnızca `Admin`. Yanıt oluşan kaydın id'sidir. */
  create(model: AmenityInputModel): Observable<number> {
    return this.http.post<number>(this.baseUrl, model);
  }

  /** İmkanı günceller — yalnızca `Admin`. */
  update(id: number, model: AmenityInputModel): Observable<boolean> {
    return this.http.put<boolean>(`${this.baseUrl}/${id}`, model);
  }

  // Silme metodu yok: API'de DELETE ucu yok. Katalog durağan referans verisidir,
  // bir madde kalkacaksa veritabanından kontrollü olarak silinir.
}
