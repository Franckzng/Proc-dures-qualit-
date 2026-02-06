import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ReportService {
  private apiUrl = `${environment.apiUrl}/reports`;

  constructor(private http: HttpClient) {}

  getApprovalRate(startDate: string, endDate: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/approval-rate`, {
      params: { startDate, endDate }
    });
  }

  getApprovalTimeStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/approval-time`);
  }

  getRejectionByUser(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/rejection-by-user`);
  }

  getProceduresByDepartment(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/by-department`);
  }

  getProceduresByNorme(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/by-norme`);
  }

  getObsoleteProcedures(months = 12): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/obsolete`, {
      params: { months: months.toString() }
    });
  }

  getWorkflowPerformance(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/workflow-performance`);
  }
}
