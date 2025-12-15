// src/app/services/procedure.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { Procedure } from '../models/procedure.model';

@Injectable({ providedIn: 'root' })
export class ProcedureService {
  private apiUrl = `${environment.apiUrl}/procedures`;

  constructor(private http: HttpClient) {}

  getProcedures(): Observable<Procedure[]> {
    return this.http.get<Procedure[]>(`${this.apiUrl}`);
  }

  getProcedure(id: number): Observable<Procedure> {
    return this.http.get<Procedure>(`${this.apiUrl}/${id}`);
  }

  createProcedure(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}`, payload);
  }
  updateProcedure(id: number, payload: any) {
    return this.http.put(`${this.apiUrl}/${id}`, payload);
  }
  deleteProcedure(id: number) {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  getAllProcesses(): Observable<Array<{ processus: string; procedures_count: number }>> {
    return this.http.get<Array<{ processus: string; procedures_count: number }>>(`${this.apiUrl}/processes`);
  }

  getByProcess(process: string | null, keyword?: string | null): Observable<Procedure[]> {
    const url = process ? `${this.apiUrl}/process/${encodeURIComponent(process)}` : `${this.apiUrl}/process`;
    let params = new HttpParams();
    if (keyword) params = params.set('keyword', keyword);
    return this.http.get<Procedure[]>(url, { params });
  }

  searchByProcess(process: string | null, keyword: string) {
    return this.getByProcess(process, keyword);
  }

  getSteps(procedureId: number) {
    return this.http.get<any[]>(`${this.apiUrl}/${procedureId}/steps`);
  }
  createStep(procedureId: number, payload: any) {
    return this.http.post<any>(`${this.apiUrl}/${procedureId}/steps`, payload);
  }
  updateStep(stepId: number, payload: any) {
    return this.http.put<any>(`${this.apiUrl}/steps/${stepId}`, payload);
  }
  deleteStep(stepId: number) {
    return this.http.delete<any>(`${this.apiUrl}/steps/${stepId}`);
  }

  startApprovalWorkflow(procId: number) {
    return this.http.post<any>(`${this.apiUrl}/${procId}/workflow/start`, {});
  }
}
