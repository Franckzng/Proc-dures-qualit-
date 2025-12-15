//src/app/sercices/auth.service.ts
import { Injectable, computed, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { User, UserWithPermissions } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private user = signal<UserWithPermissions | null>(null);
  currentUser = computed(this.user);
  isAdmin = computed(() => this.user()?.role_id === 1);
  permissions = computed(() => this.user()?.permissions || {});

  constructor(private http: HttpClient) {
    this.initializeFromStorage();
  }

  private initializeFromStorage() {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        // Convertir les permissions en objet
        user.permissions = this.parsePermissions(user.permissions_str);
        this.user.set(user);
      } catch (e) {
        console.error('Error parsing user data', e);
        this.clearStorage();
      }
    }
  }

  login(email: string, password: string) {
    return this.http.post<{ token: string; user: User }>(
      `${environment.apiUrl}/auth/login`, 
      { email, password }
    ).pipe(
      tap(res => {
        // Convertir les permissions
        const permissions = this.parsePermissions(res.user.permissions_str);
        
        // Créer l'objet utilisateur complet
        const userWithPermissions: UserWithPermissions = {
          ...res.user,
          permissions
        };

        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(userWithPermissions));
        this.user.set(userWithPermissions);
      })
    );
  }

  private parsePermissions(permissionsStr?: string): Record<string, string[]> {
    if (!permissionsStr) return {};
    
    return permissionsStr.split(',').reduce((acc: Record<string, string[]>, perm) => {
      const [action, resource] = perm.split(':');
      if (action && resource) {
        if (!acc[resource]) acc[resource] = [];
        acc[resource].push(action);
      }
      return acc;
    }, {});
  }

  logout() {
    this.clearStorage();
    this.user.set(null);
  }

  private clearStorage() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  hasPermission(action: string, resource: string): boolean {
    const userPerms = this.permissions();
    return userPerms[resource]?.includes(action) || false;
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }
}