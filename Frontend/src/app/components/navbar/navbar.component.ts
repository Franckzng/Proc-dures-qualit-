// src/app/components/navbar/navbar.component.ts
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { NgbCollapseModule } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from '../../services/auth.service';
import { WorkflowService, Step } from '../../services/workflow.service';
import {
  ROLE_APPROBATEUR,
  ROLE_VERIFICATEUR,
  ROLE_ADMIN
} from '../../config/roles';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, NgbCollapseModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  public authService = inject(AuthService);
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
  }

  canSeeTasks(): boolean {
    const u = this.authService.currentUser();
    if (!u) return false;
    return u.role_id === ROLE_VERIFICATEUR
        || u.role_id === ROLE_APPROBATEUR
        || this.isAdmin;
  }

  private loadPendingTasksCount(): void {
    this.workflowService.getPendingSteps().subscribe({
      next: (steps: Step[]) => this.pendingTasksCount.set(steps.length),
      error: () => this.pendingTasksCount.set(0)
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
