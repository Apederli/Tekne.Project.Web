import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api/api.config';
import { CityHarborsOutputModel } from '@models';

/** `HarborsController` (`/api/Harbors`) karşılığı. */
@Service()
export class HarborService {
  http = inject(HttpClient);
  baseUrl = `${inject(API_BASE_URL)}/Harbors`;

  /**
   * Limanı olan şehirler, limanları gömülü — cascading dropdown tek
   * istekle doldurulur.
   */
  getAll(): Observable<CityHarborsOutputModel[]> {
    return this.http.get<CityHarborsOutputModel[]>(this.baseUrl);
  }
}
