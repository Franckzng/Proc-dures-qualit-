// src/app/services/dashboard.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface DashboardSummary {
  total: number;
  byStatus: { statut: string; count: number }[];
  recent: {
    id: number;
    titre: string;
    statut: string;
    date_creation: string;
  }[];
  workflowsInProgress?: number;
  pendingForUser?: number;
  pendingCountGlobal?: number;
  updated_at?: string;
}

export interface RecentActivity {
  type: string;
  entity_id: number;
  title: string;
  user_id?: number;
  date?: string;
  action?: string | null;
  commentaire?: string | null;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private apiUrl = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  getSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${this.apiUrl}/summary`);
  }

  getRecent(limit = 10): Observable<RecentActivity[]> {
    return this.http.get<RecentActivity[]>(`${this.apiUrl}/recent?limit=${limit}`);
  }

  getByDepartment(): Observable<Array<{ id: number; department_name: string; procedures_count: number }>> {
    return this.http.get<Array<{ id: number; department_name: string; procedures_count: number }>>(`${this.apiUrl}/by-department`);
  }
}
