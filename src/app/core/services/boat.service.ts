import { Service, inject } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SILENT_ERRORS } from '@interceptors/error.interceptor';
import { API_BASE_URL } from '../api/api.config';
import {
  BoatCardOutputModel,
  BoatInputModel,
  BoatListFilterInputModel,
  BoatModelOutputModel,
  BoatOutputModel,
  BoatQuoteInputModel,
  BoatQuoteOutputModel,
  BrandOutputModel,
  PagedOutputModel,
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
   * Pazar yeri listesi — sayfalı. Filtre alanlarının hepsi opsiyonel; hiç
   * gönderilmezse kart teknenin en düşük saat ücretini gösterir. Boş alanlar
   * sorgu dizesine hiç yazılmaz — backend "alan yok" ile "alan boş"u ayırıyor.
   *
   * Sayfa boyutunu sunucu belirler; istemci yalnızca `pageNumber` gönderir ve
   * sayfa bilgisini yanıttan okur.
   */
  getList(filter?: BoatListFilterInputModel): Observable<PagedOutputModel<BoatCardOutputModel>> {
    const params: Record<string, string | number> = {};

    for (const [key, value] of Object.entries(filter ?? {})) {
      if (value != null && value !== '') params[key] = value;
    }

    return this.http.get<PagedOutputModel<BoatCardOutputModel>>(this.baseUrl, { params });
  }

  getMine(): Observable<BoatOutputModel[]> {
    return this.http.get<BoatOutputModel[]>(`${this.baseUrl}/mine`);
  }

  getById(id: number): Observable<BoatOutputModel> {
    return this.http.get<BoatOutputModel>(`${this.baseUrl}/${id}`);
  }

  /**
   * Seçilen tarih/saat/süre için fiyat teklifi. Üçü de zorunlu; eksik istek
   * 422 döner, bu yüzden çağıran seçim tamamlanmadan uğramaz.
   *
   * SILENT_ERRORS: kullanıcı süreyi adım adım değiştirirken tarifeye uymayan
   * her seçim için toast çıkmasın — kart hatayı kendi metniyle anlatıyor.
   */
  getQuote(id: number, input: BoatQuoteInputModel): Observable<BoatQuoteOutputModel> {
    return this.http.get<BoatQuoteOutputModel>(`${this.baseUrl}/${id}/quote`, {
      params: { ...input },
      context: new HttpContext().set(SILENT_ERRORS, true),
    });
  }

  getBrands(): Observable<BrandOutputModel[]> {
    return this.http.get<BrandOutputModel[]>(`${this.baseUrl}/brands`);
  }

  /** Markanın modelleri. Katalogda olmayan marka 404 döner. */
  getModels(brandId: number): Observable<BoatModelOutputModel[]> {
    return this.http.get<BoatModelOutputModel[]>(`${this.baseUrl}/brands/${brandId}/models`);
  }
}
