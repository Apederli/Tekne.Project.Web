import { Service, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../api/api.config';
import { BoatPhotoOutputModel, ReorderPhotosInputModel } from '@models';

/**
 * `BoatPhotosController` (`/api/Boats/{boatId}/photos`) karşılığı.
 * Uçların tamamı `Partner` politikasına bağlı; tekne sahipliği backend'de
 * doğrulanıyor, istemci ayrıca kontrol etmez.
 */
@Service()
export class BoatPhotoService {
  http = inject(HttpClient);
  baseUrl = inject(API_BASE_URL);

  /**
   * Fotoğraf yükleme — `multipart/form-data`, alan adı **`files`**
   * (controller'daki `[FromForm] List<IFormFile> files` ile birebir).
   *
   * `Content-Type` başlığı elle yazılmıyor: `FormData` verildiğinde tarayıcı
   * onu `boundary` ile birlikte kendisi üretir, elle yazmak gövdeyi bozar.
   *
   * Backend sınırı dosya başına 10MB ve yalnızca izinli görsel tipleri;
   * aşan istek `400` döner ve mesajı interceptor gösterir.
   */
  upload(boatId: number, files: File[]): Observable<BoatPhotoOutputModel[]> {
    const body = new FormData();
    for (const file of files) body.append('files', file, file.name);
    return this.http.post<BoatPhotoOutputModel[]>(this.photosUrl(boatId), body);
  }

  delete(boatId: number, photoId: number): Observable<boolean> {
    return this.http.delete<boolean>(`${this.photosUrl(boatId)}/${photoId}`);
  }

  /**
   * Sıralama — gövdedeki dizinin sırası `sortOrder` olur, kısmi liste gönderme.
   * Kapak fotoğrafı da buradan belirlenir: başa taşınan fotoğraf kapaktır.
   */
  reorder(boatId: number, photoIdsInOrder: number[]): Observable<boolean> {
    const body: ReorderPhotosInputModel = { photoIdsInOrder };
    return this.http.put<boolean>(`${this.photosUrl(boatId)}/order`, body);
  }

  photosUrl(boatId: number): string {
    return `${this.baseUrl}/Boats/${boatId}/photos`;
  }
}
