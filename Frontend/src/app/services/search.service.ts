import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { Procedure } from '../models/procedure.model';

export interface SearchFilters {
  keyword?: string;
  statut?: string[];
  departement_id?: number;
  processus?: string;
  norme?: string;
  redacteur_id?: number;
  dateDebut?: string;
  dateFin?: string;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class SearchService {
  private apiUrl = `${environment.apiUrl}/search`;

  constructor(private http: HttpClient) {}

  advancedSearch(filters: SearchFilters): Observable<Procedure[]> {
    let params = new HttpParams();
    
    if (filters.keyword) params = params.set('keyword', filters.keyword);
    if (filters.statut?.length) params = params.set('statut', filters.statut.join(','));
    if (filters.departement_id) params = params.set('departement_id', filters.departement_id.toString());
    if (filters.processus) params = params.set('processus', filters.processus);
    if (filters.norme) params = params.set('norme', filters.norme);
    if (filters.redacteur_id) params = params.set('redacteur_id', filters.redacteur_id.toString());
    if (filters.dateDebut) params = params.set('dateDebut', filters.dateDebut);
    if (filters.dateFin) params = params.set('dateFin', filters.dateFin);
    if (filters.limit) params = params.set('limit', filters.limit.toString());

    return this.http.get<Procedure[]>(`${this.apiUrl}/advanced`, { params });
  }

  searchAttachments(keyword: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/attachments`, {
      params: { keyword }
    });
  }
}
