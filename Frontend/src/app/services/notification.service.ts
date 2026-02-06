import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { tap } from 'rxjs';

export interface Notification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  entity_type?: string;
  entity_id?: number;
  is_read: boolean;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private apiUrl = `${environment.apiUrl}/notifications`;
  notifications = signal<Notification[]>([]);
  unreadCount = signal(0);

  constructor(private http: HttpClient) {}

  loadNotifications(unreadOnly = false) {
    let params: any = {};
    if (unreadOnly) {
      params = { unreadOnly: 'true' };
    }
    return this.http.get<Notification[]>(this.apiUrl, { params }).pipe(
      tap(notifications => {
        this.notifications.set(notifications);
        this.unreadCount.set(notifications.filter(n => !n.is_read).length);
      })
    );
  }

  markAsRead(id: number) {
    return this.http.put(`${this.apiUrl}/${id}/read`, {}).pipe(
      tap(() => {
        const current = this.notifications();
        const updated = current.map(n => n.id === id ? { ...n, is_read: true } : n);
        this.notifications.set(updated);
        this.unreadCount.set(updated.filter(n => !n.is_read).length);
      })
    );
  }

  markAllAsRead() {
    return this.http.put(`${this.apiUrl}/read-all`, {}).pipe(
      tap(() => {
        const updated = this.notifications().map(n => ({ ...n, is_read: true }));
        this.notifications.set(updated);
        this.unreadCount.set(0);
      })
    );
  }
}
