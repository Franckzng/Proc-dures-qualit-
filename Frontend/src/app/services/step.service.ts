// src/app/services/step.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { Step } from '../models/step.model';

@Injectable({ providedIn: 'root' })
export class StepService {
  private apiUrl = `${environment.apiUrl}/procedures`;

  constructor(private http: HttpClient) {}

  // récupérer les étapes d'une procédure
  getSteps(procedureId: number): Observable<Step[]> {
    return this.http.get<Step[]>(`${this.apiUrl}/${procedureId}/steps`);
  }

  /**
   * createStep : 2 formes supportées
   * - createStep(step)   -> step.procedure_id must be present
   * - createStep(procId, step)
   *
   * This helper normalizes parent_id: if zero/empty -> it will not be sent
   * (backend will treat missing parent_id as null).
   */
  createStep(step: Omit<Step, 'id'>): Observable<Step>;
  createStep(procedureId: number, step: Omit<Step, 'id'>): Observable<Step>;
  createStep(p1: any, p2?: any): Observable<Step> {
    let procedureId: number;
    let payload: any;

    if (typeof p1 === 'number') {
      procedureId = p1;
      payload = { ...p2 };
    } else {
      payload = { ...p1 };
      procedureId = payload.procedure_id;
      if (!procedureId) {
        throw new Error('createStep(step) : step.procedure_id is required');
      }
    }

    // Normalize parent_id: remove if falsy/zero/empty string – backend treats absence as NULL
    if (payload.parent_id === 0 || payload.parent_id === '0' || payload.parent_id === '' || payload.parent_id === undefined || payload.parent_id === null) {
      delete payload.parent_id;
    } else if (typeof payload.parent_id === 'string') {
      // cast numeric strings to number
      const n = parseInt(payload.parent_id, 10);
      if (!isNaN(n)) payload.parent_id = n;
      else delete payload.parent_id;
    }

    // Ensure procedure_id set
    payload.procedure_id = Number(procedureId);

    return this.http.post<Step>(`${this.apiUrl}/${procedureId}/steps`, payload);
  }

  // updateStep expects backend route PUT /api/procedures/steps/:id
  updateStep(id: number, step: Partial<Step>): Observable<Step> {
    // Normalize parent_id same as create
    const payload: any = { ...step };
    if (payload.parent_id === 0 || payload.parent_id === '0' || payload.parent_id === '' || payload.parent_id === undefined || payload.parent_id === null) {
      delete payload.parent_id;
    } else if (typeof payload.parent_id === 'string') {
      const n = parseInt(payload.parent_id, 10);
      if (!isNaN(n)) payload.parent_id = n;
      else delete payload.parent_id;
    }

    return this.http.put<Step>(`${this.apiUrl}/steps/${id}`, payload);
  }

  // deleteStep expects backend route DELETE /api/procedures/steps/:id
  deleteStep(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/steps/${id}`);
  }
}
