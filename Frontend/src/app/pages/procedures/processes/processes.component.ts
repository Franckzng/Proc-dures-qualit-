// src/app/pages/procedures/processes/processes.component.ts
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { ProcedureService } from '../../../services/procedure.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './processes.component.html',
  styleUrls: ['./processes.component.css']
})
export class ProcessesComponent implements OnInit {
  private procSvc = inject(ProcedureService);
  private router = inject(Router);
  private toastr = inject(ToastrService);

  public processes = signal<Array<{ processus: string; procedures_count: number }>>([]);

  ngOnInit() {
    this.load();
  }

  private load() {
    this.procSvc.getAllProcesses().subscribe({
      next: ps => this.processes.set(ps || []),
      error: (err) => {
        console.error('getAllProcesses error', err);
        this.toastr.error('Erreur chargement des processus');
      }
    });
  }

  /**
   * Navigate to the procedure list for the selected process.
   * - For "non-classé" or empty values we navigate to /process (no param).
   * - DO NOT pre-encode the param — let Angular handle encoding.
   */
  public openProcess(process: string | null) {
    const value = (process || '').trim();
    if (!value || value.toLowerCase() === 'non-classé' || value.toLowerCase() === 'non-class') {
      // navigate to /procedures/process (non-classé)
      this.router.navigate(['/dashboard', 'procedures', 'process']);
      return;
    }

    // navigate with raw string as route param
    this.router.navigate(['/dashboard', 'procedures', 'process', value]);
  }
}
