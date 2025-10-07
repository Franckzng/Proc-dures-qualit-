// src/app/services/department.service.ts
/*import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Department } from '../models/user.model';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DepartmentService {
  private apiBase: string;

  constructor(private http: HttpClient) {
    // normalize base so we can safely append /api/whatever
    const base = (environment.apiUrl || '').replace(/\/$/, '');
    this.apiBase = base.endsWith('/api') ? base : `${base}/api`;
  }

  private url(path: string) {
    return `${this.apiBase}/${path.replace(/^\/+/, '')}`;
  }

  getDepartments(): Observable<Department[]> {
    // ex: http://localhost:5000/api/departments
    return this.http.get<Department[]>(this.url('departments'));
  }
}*/
