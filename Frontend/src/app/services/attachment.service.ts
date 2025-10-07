// src/app/services/attachment.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Attachment } from '../models/attachment.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AttachmentService {
  private readonly url = `${environment.apiUrl}/attachments`;

  constructor(private http: HttpClient) {}

  upload(file: File, procedureId?: number): Observable<Attachment> {
    const form = new FormData();
    form.append('file', file, file.name);
    if (procedureId) {
      form.append('procedureId', procedureId.toString());
    }

    return this.http.post<Attachment>(this.url, form).pipe(
      catchError(err => {
        console.error('Erreur d’upload de pièce jointe', err);
        return throwError(() => err);
      })
    );
  }

  list(procedureId: number): Observable<Attachment[]> {
    return this.http
      .get<Attachment[]>(`${this.url}/procedure/${procedureId}`)
      .pipe(
        catchError(err => {
          console.error('Erreur de récupération des pièces jointes', err);
          return throwError(() => err);
        })
      );
  }
}
