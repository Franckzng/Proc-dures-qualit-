// src/app/pages/workflows/pending-tasks/pending-tasks.component.ts
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { WorkflowService, Step } from '../../../services/workflow.service';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-pending-tasks',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pending-tasks.component.html',
  styleUrls: ['./pending-tasks.component.css']
})
export class PendingTasksComponent implements OnInit {
  pending = signal<Step[]>([]);

  constructor(
    private workflowService: WorkflowService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadPendingSteps();
  }

  private loadPendingSteps() {
    this.workflowService.getPendingSteps().subscribe({
      next: steps => this.pending.set(steps),
      error: () => this.pending.set([])
    });
  }

  /**
   * Ouvre la page de détail de la procédure.
   * Le traitement (validation/approbation) est intégré à cette page.
   */
  viewProcedure(step: Step) {
    if (step.procedure_id) {
      this.router.navigate(['/dashboard/procedures', step.procedure_id]);
    }
  }
}