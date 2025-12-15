import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { WorkflowService, Step } from '../../../services/workflow.service';

@Component({
  selector: 'app-process-step',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './process-step.component.html',
  styleUrls: ['./process-step.component.css']
})
export class ProcessStepComponent implements OnInit {
  @Input() step!: Step;  // on récupère l'étape à traiter
  @Input() procedureTitle = '';      // titre passé par le parent
  @Input() procedureDescription = ''; // description passée par le parent

  commentaire = '';
  action: 'VALIDE' | 'REJETE' = 'VALIDE';

  constructor(
    private router: Router,
    private workflowService: WorkflowService
  ) {}

  ngOnInit(): void {
    if (!this.step) {
      // si jamais aucun step n'est passé, on retourne à la liste des tâches
      this.router.navigate(['/dashboard/workflows/pending']);
    }
  }

  process(action: 'VALIDE' | 'REJETE'): void {
    if (!this.commentaire.trim()) return;

    this.workflowService
      .processStep(
        this.step.workflow_id,
        this.step.etape_id,
        action,
        this.commentaire
      )
      .subscribe({
        next: () => this.router.navigate(['/dashboard/workflows/pending']),
        error: () => alert('Erreur lors du traitement')
      });
  }
}
