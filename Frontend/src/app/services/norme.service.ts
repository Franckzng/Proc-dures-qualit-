//src/app/services/norme.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface Norme {
  id: number;
  titre: string;
  description?: string;
  date_creation?: string;
}

@Injectable({ providedIn: 'root' })
export class NormeService {
  private api = `${environment.apiUrl}/normes`;

  constructor(private http: HttpClient) {}

  listByUser(): Observable<Norme[]> {
    return this.http.get<Norme[]>(this.api);
  }

  create(payload: { titre: string; description?: string }) {
    return this.http.post<Norme>(this.api, payload);
  }
}
