import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api/api.config';

/**
 * `BoatFavoritesController` (`/api/Boats/{boatId}/favorite`) karşılığı.
 * Oturum ister; iki uç da idempotenttir — zaten favorideyken `add` veya
 * favoride değilken `remove` sessizce başarılı döner.
 */
@Service()
export class BoatFavoriteService {
  http = inject(HttpClient);
  baseUrl = inject(API_BASE_URL);

  add(boatId: number): Observable<boolean> {
    return this.http.post<boolean>(`${this.baseUrl}/Boats/${boatId}/favorite`, null);
  }

  remove(boatId: number): Observable<boolean> {
    return this.http.delete<boolean>(`${this.baseUrl}/Boats/${boatId}/favorite`);
  }
}
