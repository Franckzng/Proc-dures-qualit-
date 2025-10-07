// src/app/pages/procedures/procedure-detail/procedure-detail.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { ProcedureService } from '../../../services/procedure.service';
import { AttachmentService } from '../../../services/attachment.service';
import { WorkflowService, Step as WorkflowStep, Workflow } from '../../../services/workflow.service';
import { AuthService } from '../../../services/auth.service';
import { StepService } from '../../../services/step.service';

import { Procedure, ProcedureStatus } from '../../../models/procedure.model';
import { Attachment } from '../../../models/attachment.model';
import { Department } from '../../../models/user.model';
import { Step } from '../../../models/step.model';

import {
  ROLE_VERIFICATEUR,
  ROLE_APPROBATEUR
} from '../../../config/roles';

// libs pour export pdf
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './procedure-detail.component.html',
  styleUrls: ['./procedure-detail.component.css']
})
export class ProcedureDetailComponent implements OnInit {
  private authService = inject(AuthService);
  private workflowService = inject(WorkflowService);
  private toastr = inject(ToastrService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private procedureService = inject(ProcedureService);
  private attachmentService = inject(AttachmentService);
  private stepService = inject(StepService);

  logoUrl = 'assets/img/sonabhy-logo.png';
  procedure: Procedure | null = null;
  attachments: Attachment[] = [];
  departments: Department[] = [];
  steps: Step[] = [];
  loading = true;

  // workflow / step processing
  currentStep: WorkflowStep | null = null;
  fullWorkflow: Workflow | null = null;
  processComment = '';

  // flag utilisé pour masquer les boutons pendant l'export
  exporting = false;

  readonly editableStatuses = [
    ProcedureStatus.BROUILLON,
    ProcedureStatus.REJETEE,
    ProcedureStatus.PUBLIEE
  ];

  ngOnInit() {
    const id = Number(this.route.snapshot.params['id']);
    if (!id) {
      this.router.navigate(['/dashboard/not-found']);
      return;
    }

    this.procedureService.getProcedure(id).subscribe({
      next: proc => {
        this.procedure = proc;
        this.loadAttachments(id);
        this.loadSteps(id);
        this.loadStepIfNeeded(proc);
        this.loadWorkflowIfPublished(proc);
      },
      error: () => {
        this.router.navigate(['/dashboard/not-found']);
      }
    });
  }

  private loadAttachments(procId: number) {
    this.attachmentService.list(procId).subscribe({
      next: list => {
        this.attachments = list;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.toastr.error('Impossible de charger les pièces jointes');
      }
    });
  }

  private loadSteps(procId: number) {
    this.stepService.getSteps(procId).subscribe({
      next: flatSteps => {
        this.steps = this.buildStepHierarchy(flatSteps);
      },
      error: () => this.toastr.error('Impossible de charger les étapes de la procédure')
    });
  }

  private buildStepHierarchy(flatSteps: Step[]): Step[] {
    const stepMap = new Map<number, Step>();
    flatSteps.forEach(step => {
      step.children = [];
      stepMap.set(step.id, step);
    });

    const roots: Step[] = [];
    flatSteps.forEach(step => {
      if (step.parent_id) {
        const parent = stepMap.get(step.parent_id);
        if (parent) parent.children?.push(step);
      } else {
        roots.push(step);
      }
    });

    return roots;
  }

  private loadStepIfNeeded(proc: Procedure) {
    const role = this.authService.currentUser()?.role_id;
    if (
      (role === ROLE_VERIFICATEUR && proc.statut === ProcedureStatus.EN_REVISION) ||
      (role === ROLE_APPROBATEUR && proc.statut === ProcedureStatus.EN_APPROBATION)
    ) {
      this.workflowService.getStepByProcedure(proc.id!).subscribe({
        next: step => this.currentStep = step,
        error: () => this.toastr.error('Impossible de charger l’étape en cours')
      });
    }
  }

  private loadWorkflowIfPublished(proc: Procedure) {
    if (proc.statut !== ProcedureStatus.PUBLIEE && proc.statut !== ProcedureStatus.APPROUVEE) {
      return;
    }

    const workflowId = proc.workflow?.id;
    if (workflowId) {
      this.workflowService.getWorkflow(workflowId).subscribe({
        next: (workflow) => {
          this.fullWorkflow = workflow;
        },
        error: () => {
          this.toastr.error('Impossible de charger le workflow');
        }
      });
    } else {
      // pas de workflow : on laisse fullWorkflow null (handled in template)
    }
  }

  getStatusDisplay(status: ProcedureStatus): string {
    const labels: Record<ProcedureStatus, string> = {
      BROUILLON: 'Brouillon',
      EN_REVISION: 'En révision',
      EN_APPROBATION: 'En approbation',
      APPROUVEE: 'Approuvée',
      PUBLIEE: 'Publiée',
      ARCHIVEE: 'Archivée',
      REJETEE: 'Rejetée'
    };
    return labels[status] || (status as unknown as string);
  }

  getBulletType(level: number): string {
    switch (level) {
      case 0: return '•';
      case 1: return '-';
      case 2: return '◦';
      default: return '▪';
    }
  }

  canEdit(): boolean {
    return this.procedure != null && this.editableStatuses.includes(this.procedure.statut as ProcedureStatus);
  }

  delete() {
    if (!this.procedure || !this.canEdit()) return;
    if (!confirm('Confirmer la suppression de cette procédure ?')) return;

    this.procedureService.deleteProcedure(this.procedure.id!).subscribe({
      next: () => {
        this.toastr.success('Procédure supprimée');
        this.router.navigate(['/dashboard/procedures']);
      },
      error: err => this.toastr.error(err.error?.message || 'Erreur lors de la suppression')
    });
  }

  processCurrentStep(action: 'VALIDE' | 'REJETE') {
    if (!this.currentStep) return;
    this.workflowService.processStep(this.currentStep.workflow_id, this.currentStep.etape_id, action, this.processComment)
      .subscribe({
        next: () => {
          this.toastr.success(action === 'VALIDE' ? 'Étape validée' : 'Étape rejetée');
          if (this.procedure && this.procedure.id) {
            this.procedureService.getProcedure(this.procedure.id).subscribe({
              next: p => {
                this.procedure = p;
                this.loadSteps(p.id);
                this.loadWorkflowIfPublished(p);
                this.currentStep = null;
                this.processComment = '';
              }
            });
          }
        },
        error: () => {
          this.toastr.error('Erreur lors du traitement de l\'étape');
        }
      });
  }

  // Imprimer (ouvre la boite d'impression) — les styles @media print cachent les boutons
  print() {
    window.print();
  }

// Export PDF via html2canvas + jsPDF
async exportPdf() {
  if (!this.procedure) {
    this.toastr.error('Aucune procédure chargée');
    return;
  }
  if (![ProcedureStatus.APPROUVEE, ProcedureStatus.PUBLIEE].includes(this.procedure.statut as ProcedureStatus)) {
    this.toastr.warning('L\'export est disponible seulement pour les procédures approuvées ou publiées.');
    return;
  }

  this.exporting = true;

  setTimeout(async () => {
    try {
      const element = document.getElementById('procedure-print-area');
      if (!element) throw new Error('Zone d\'export introuvable');

      // <-- cast explicite pour satisfaire TypeScript -->
      const el = element as HTMLElement;

      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgProps = (pdf as any).getImageProperties(imgData);
      const imgWidth = pageWidth;
      const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

      if (imgHeight <= pageHeight) {
        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      } else {
        let position = 0;
        const ratio = canvas.width / imgWidth;
        let remainingHeight = imgHeight;
        while (remainingHeight > 0) {
          const pageCanvas = document.createElement('canvas');
          const ctx = pageCanvas.getContext('2d')!;
          pageCanvas.width = canvas.width;
          pageCanvas.height = Math.min(canvas.height - position * ratio, pageHeight * ratio);
          ctx.drawImage(canvas, 0, position * ratio, canvas.width, pageCanvas.height, 0, 0, pageCanvas.width, pageCanvas.height);
          const pageData = pageCanvas.toDataURL('image/png');
          if (position > 0) pdf.addPage();
          pdf.addImage(pageData, 'PNG', 0, 0, imgWidth, pageHeight);
          position += pageCanvas.height / ratio;
          remainingHeight -= pageHeight;
        }
      }

      const safeTitle = (this.procedure!.titre || 'procedure').replace(/[^a-z0-9_\-\.]/gi, '_').slice(0, 120);
      pdf.save(`${safeTitle}.pdf`);
    } catch (err) {
      this.toastr.error('Erreur lors de la génération du PDF');
    } finally {
      this.exporting = false;
    }
  }, 150);
}

}
