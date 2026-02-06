import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../services/report.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.css']
})
export class ReportsComponent implements OnInit {
  private reportService = inject(ReportService);

  approvalStats = signal<any>(null);
  timeStats = signal<any>(null);
  rejectionStats = signal<any[]>([]);
  deptStats = signal<any[]>([]);
  normeStats = signal<any[]>([]);
  obsoleteProcedures = signal<any[]>([]);
  workflowPerf = signal<any[]>([]);
  loading = signal(false);

  dateRange = {
    start: new Date(new Date().setMonth(new Date().getMonth() - 6)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  };

  ngOnInit() {
    this.loadAllReports();
  }

  loadAllReports() {
    this.loading.set(true);
    
    this.reportService.getApprovalRate(this.dateRange.start, this.dateRange.end).subscribe(
      stats => this.approvalStats.set(stats)
    );
    
    this.reportService.getApprovalTimeStats().subscribe(
      stats => this.timeStats.set(stats)
    );
    
    this.reportService.getRejectionByUser().subscribe(
      stats => this.rejectionStats.set(stats)
    );
    
    this.reportService.getProceduresByDepartment().subscribe(
      stats => this.deptStats.set(stats)
    );
    
    this.reportService.getProceduresByNorme().subscribe(
      stats => this.normeStats.set(stats)
    );
    
    this.reportService.getObsoleteProcedures(12).subscribe(
      procs => this.obsoleteProcedures.set(procs)
    );
    
    this.reportService.getWorkflowPerformance().subscribe(
      perf => {
        this.workflowPerf.set(perf);
        this.loading.set(false);
      }
    );
  }

  getApprovalRate(): number {
    const stats = this.approvalStats();
    if (!stats || stats.total === 0) return 0;
    return Math.round((stats.approved / stats.total) * 100);
  }

  getRejectionRate(): number {
    const stats = this.approvalStats();
    if (!stats || stats.total === 0) return 0;
    return Math.round((stats.rejected / stats.total) * 100);
  }

  getProgressWidth(value: number, max: number): string {
    return `${Math.min((value / max) * 100, 100)}%`;
  }
}
