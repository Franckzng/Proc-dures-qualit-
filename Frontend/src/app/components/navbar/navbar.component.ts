// src/app/components/navbar/navbar.component.ts
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { NgbCollapseModule, NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from '../../services/auth.service';
import { WorkflowService, Step } from '../../services/workflow.service';
import { NotificationService } from '../../services/notification.service';
import {
  ROLE_APPROBATEUR,
  ROLE_VERIFICATEUR,
  ROLE_ADMIN
} from '../../config/roles';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, NgbCollapseModule, NgbDropdownModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  public authService = inject(AuthService);
  public notificationService = inject(NotificationService);
  private workflowService = inject(WorkflowService);
  private router = inject(Router);

  isCollapsed = true;
  pendingTasksCount = signal<number>(0);

  get isAdmin(): boolean {
    return this.authService.currentUser()?.role_id === ROLE_ADMIN;
  }

  get currentUserEmail(): string | undefined {
    return this.authService.currentUser()?.email;
  }

  ngOnInit(): void {
    if (this.canSeeTasks()) {
      this.loadPendingTasksCount();
    }
    this.notificationService.loadNotifications().subscribe();
  }

  canSeeTasks(): boolean {
    const u = this.authService.currentUser();
    if (!u) return false;
    return u.role_id === ROLE_VERIFICATEUR
        || u.role_id === ROLE_APPROBATEUR
        || this.isAdmin;
  }

  canCreateProcedure(): boolean {
    const u = this.authService.currentUser();
    if (!u) return false;
    return u.role_id === ROLE_ADMIN || u.role_id === 4; // ROLE_REDACTEUR = 4
  }

  private loadPendingTasksCount(): void {
    this.workflowService.getPendingSteps().subscribe({
      next: (steps: Step[]) => this.pendingTasksCount.set(steps.length),
      error: () => this.pendingTasksCount.set(0)
    });
  }

  markAsRead(id: number): void {
    this.notificationService.markAsRead(id).subscribe();
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe();
  }

  getNotificationIcon(type: string): string {
    const icons: Record<string, string> = {
      'workflow': 'bi-arrow-repeat',
      'approval': 'bi-check-circle',
      'rejection': 'bi-x-circle',
      'info': 'bi-info-circle'
    };
    return icons[type] || 'bi-bell';
  }

  formatDate(date: string): string {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'A l\'instant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    return d.toLocaleDateString('fr-FR');
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}