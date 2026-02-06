import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditService } from '../../services/audit.service';

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './audit.component.html',
  styleUrls: ['./audit.component.css']
})
export class AuditComponent implements OnInit {
  private auditService = inject(AuditService);

  logs = signal<any[]>([]);
  loading = signal(false);
  
  filters = {
    entityType: '',
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    limit: 100
  };

  entityTypes = ['procedure', 'workflow', 'user', 'attachment'];

  ngOnInit() {
    this.loadLogs();
  }

  loadLogs() {
    this.loading.set(true);
    this.auditService.getLogs(this.filters).subscribe({
      next: (logs) => {
        this.logs.set(logs);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  getActionBadge(action: string): string {
    const badges: Record<string, string> = {
      'CREATE': 'bg-success',
      'UPDATE': 'bg-info',
      'DELETE': 'bg-danger',
      'APPROVE': 'bg-primary',
      'REJECT': 'bg-warning'
    };
    return badges[action] || 'bg-secondary';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleString('fr-FR');
  }
}
