// src/app/services/version.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface ProcedureVersion {
  id: number;
  procedure_id: number;
  version_label?: string;
  titre: string;
  description?: string;
  contenu?: string;
  utilisateur_id?: number;
  user_nom?: string;
  user_prenom?: string;
  commentaire?: string;
  date_creation?: string;
}

@Injectable({ providedIn: 'root' })
export class VersionService {
  private apiUrl = `${environment.apiUrl}/procedures`;

  constructor(private http: HttpClient) {}

  listVersions(procId: number): Observable<ProcedureVersion[]> {
    return this.http.get<ProcedureVersion[]>(`${this.apiUrl}/${procId}/versions`);
  }

  getVersion(procId: number, vid: number) {
    return this.http.get<ProcedureVersion>(`${this.apiUrl}/${procId}/versions/${vid}`);
  }

  createSnapshot(procId: number, payload: { version_label?: string, commentaire?: string }) {
    return this.http.post(`${this.apiUrl}/${procId}/versions`, payload);
  }

  restoreVersion(procId: number, vid: number) {
    return this.http.post(`${this.apiUrl}/${procId}/versions/${vid}/restore`, {});
  }
}
