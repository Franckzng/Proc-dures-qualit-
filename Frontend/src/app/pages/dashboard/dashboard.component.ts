//frontend/src/app/pages/dashboard/dashboard.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { DashboardService, DashboardSummary } from '../../services/dashboard.service';
import { AuthService } from '../../services/auth.service';
import { ROLE_REDACTEUR } from '../../config/roles';

type StatusBucket = { key: string; label: string; color: string; icon: string };

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private authService = inject(AuthService);
  private router = inject(Router);

  loading = true;
  summary: DashboardSummary | null = null;
  recentProcedures: Array<any> = [];

  totalProcedures = 0;
  countApproved = 0;
  countPublished = 0;
  countDraft = 0;
  countRejected = 0;

  // ordre & meta pour l'affichage (utilisé dans template)
  statusOrder: StatusBucket[] = [
    { key: 'APPROUVEE', label: 'Approuvée', color: '#198754', icon: 'bi-check-circle' },
    { key: 'PUBLIEE',   label: 'Publiée',   color: '#0d6efd', icon: 'bi-bookmark-check' },
    { key: 'BROUILLON', label: 'Brouillon', color: '#6c757d', icon: 'bi-pencil-square' },
    { key: 'REJETEE',   label: 'Rejetée',   color: '#dc3545', icon: 'bi-x-circle' }
  ];

  ngOnInit(): void {
    this.loadSummary();
  }

  isRedacteur(): boolean {
    return this.authService.currentUser()?.role_id === ROLE_REDACTEUR;
  }

  onAddNorme(): void {
    // navigation vers la page de création de norme (à créer si pas encore)
    this.router.navigate(['/dashboard/normes/new']);
  }

  private loadSummary(): void {
    this.loading = true;
    this.dashboardService.getSummary().subscribe({
      next: (s) => {
        this.summary = s || null;
        this.recentProcedures = this.summary?.recent || [];
        this.computeCounts();
        this.loading = false;
      },
      error: () => {
        this.summary = null;
        this.recentProcedures = [];
        this.resetCounts();
        this.loading = false;
      }
    });
  }

  private resetCounts() {
    this.totalProcedures = 0;
    this.countApproved = this.countPublished = this.countDraft = this.countRejected = 0;
  }

  private computeCounts() {
    this.resetCounts();
    const byStatus = this.summary?.byStatus || [];

    const get = (key: string) => {
      const f = byStatus.find(x => x.statut === key);
      return f ? Number(f.count) : 0;
    };

    this.countApproved  = get('APPROUVEE');
    this.countPublished = get('PUBLIEE');
    this.countDraft     = get('BROUILLON');
    this.countRejected  = get('REJETEE');

    if (typeof this.summary?.total === 'number') {
      this.totalProcedures = this.summary!.total;
    } else {
      this.totalProcedures = byStatus.reduce((acc, b) => acc + (Number(b.count) || 0), 0);
    }
  }

  // pour la largeur des barres
  percent(count: number): string {
    if (!this.totalProcedures) return '0%';
    return Math.round((count / this.totalProcedures) * 100) + '%';
  }

  niceNumber(n: number) {
    return n.toLocaleString();
  }
}
