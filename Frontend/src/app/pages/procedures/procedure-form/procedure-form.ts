// src/app/pages/procedures/procedure-form/procedure-form.ts
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, lastValueFrom } from 'rxjs';

import { ProcedureService } from '../../../services/procedure.service';
import { Procedure, ProcedureStatus } from '../../../models/procedure.model';
import { ToastrService } from 'ngx-toastr';
import { AttachmentService } from '../../../services/attachment.service';
import { Attachment } from '../../../models/attachment.model';
import { StepService } from '../../../services/step.service';
import { Step } from '../../../models/step.model';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './procedure-form.html',
  styleUrls: ['./procedure-form.css']
})
export class ProcedureForm implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private procedureService = inject(ProcedureService);
  private toastr = inject(ToastrService);
  private attachmentService = inject(AttachmentService);
  private stepService = inject(StepService);

  logoUrl = 'assets/img/sonabhy-logo.png';
  headerTitle = 'SONABHY';
  headerSubtitle = 'Système de Management de la Qualité';

  // allow optional 'code' field
  procedure: Partial<Procedure & { code?: string }> = {
    statut: ProcedureStatus.BROUILLON,
    version: '1.0',
    code: ''
  };

  attachments: Attachment[] = [];
  selectedFiles: File[] = [];
  isEditMode = false;
  isLoading = false;

  // steps local tree
  steps: Partial<Step & { children?: any[]; tempId?: string; parent_temp_id?: string }>[] = [];
  selectedStep: Partial<Step & { children?: any[]; tempId?: string; parent_temp_id?: string }> | null = null;

  statusOptions = Object.values(ProcedureStatus);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const pid = parseInt(id, 10);
      this.isEditMode = true;
      this.loadProcedure(pid);
      this.loadAttachments(pid);
      this.loadSteps(pid);
    } else {
      // start with one empty root step for new procedure
      this.steps.push(this.createNewStep());
    }
  }

  loadProcedure(id: number) {
    this.isLoading = true;
    this.procedureService.getProcedure(id).subscribe({
      next: (procedure) => {
        this.procedure = { ...procedure, code: (procedure as any).code || '' };
        this.isLoading = false;
      },
      error: () => {
        this.toastr.error('Erreur lors du chargement de la procédure');
        this.isLoading = false;
      }
    });
  }

  loadSteps(procedureId: number) {
    this.stepService.getSteps(procedureId).subscribe({
      next: (steps) => {
        this.steps = this.buildStepHierarchy(steps as Step[]);
      },
      error: () => this.toastr.error('Erreur lors du chargement des étapes')
    });
  }

  buildStepHierarchy(flatSteps: Step[]): Partial<Step & { children?: any[] }>[] {
    const stepMap = new Map<number, Partial<Step & { children?: any[] }>>();
    flatSteps.forEach(step => {
      stepMap.set(step.id, { ...step, children: [] });
    });

    const roots: Partial<Step & { children?: any[] }>[] = [];
    flatSteps.forEach(step => {
      if (step.parent_id) {
        const parent = stepMap.get(step.parent_id);
        if (parent) parent.children!.push(stepMap.get(step.id)!);
      } else {
        roots.push(stepMap.get(step.id)!);
      }
    });

    return roots;
  }

  loadAttachments(procedureId: number) {
    this.attachmentService.list(procedureId).subscribe({
      next: (attachments) => {
        this.attachments = attachments;
      },
      error: () => this.toastr.error('Erreur lors du chargement des pièces jointes')
    });
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFiles = Array.from(input.files || []);
  }

  createNewStep(parent?: Partial<Step & { children?: any[]; tempId?: string }>): Partial<Step & { children?: any[]; tempId?: string; parent_temp_id?: string }> {
    const tempId = Date.now().toString(36) + Math.random().toString(36).slice(2);
    return {
      id: 0,
      procedure_id: this.procedure.id || 0,
      parent_id: parent?.id ?? null,
      parent_temp_id: parent?.tempId,
      ordre: parent ? (parent.children?.length || 0) + 1 : (this.steps.length + 1),
      contenu: '',
      type: 'ETAPE',
      children: [],
      date_creation: new Date(),
      date_modification: new Date(),
      tempId: tempId
    };
  }

  addStep(parent?: Partial<Step & { children?: any[]; tempId?: string }>) {
    const newStep = this.createNewStep(parent);
    if (parent) {
      parent.children!.push(newStep);
    } else {
      this.steps.push(newStep);
    }
    this.selectedStep = { ...newStep };
  }

  editStep(step: Partial<Step & { children?: any[]; tempId?: string }>) {
    this.selectedStep = { ...step };
  }

  saveStep() {
    if (!this.selectedStep) return;

    // If the procedure hasn't been created yet, just update local tree and exit
    if (!this.procedure.id) {
      this.updateLocalStep(this.selectedStep as any);
      this.selectedStep = null;
      return;
    }

    const isNew = (this.selectedStep.id || 0) === 0;

    if (isNew) {
      const payload: any = {
        procedure_id: this.procedure.id!,
        parent_id: this.selectedStep.parent_id ?? null,
        ordre: this.selectedStep.ordre ?? 0,
        contenu: this.selectedStep.contenu ?? '',
        type: this.selectedStep.type ?? 'ETAPE',
        metadata: this.selectedStep.metadata ?? null,
        date_creation: new Date().toISOString(),
        date_modification: new Date().toISOString()
      } as any;

      this.stepService.createStep(payload).subscribe({
        next: (saved: any) => {
          if (saved) {
            // attach tempId so we replace the temporary node rather than append another one
            saved.tempId = this.selectedStep!.tempId;
            saved.parent_temp_id = this.selectedStep!.parent_temp_id;
            this.updateLocalStep(saved);
          }
          this.toastr.success('Étape créée');
          this.selectedStep = null;
        },
        error: (err) => {
          this.toastr.error('Erreur lors de la création de l\'étape');
        }
      });
    } else {
      const id = this.selectedStep.id!;
      const payload: any = {
        contenu: this.selectedStep.contenu,
        ordre: this.selectedStep.ordre,
        parent_id: this.selectedStep.parent_id,
        metadata: this.selectedStep.metadata
      } as any;

      this.stepService.updateStep(id, payload).subscribe({
        next: (updated: any) => {
          this.updateLocalStep(updated);
          this.toastr.success('Étape mise à jour');
          this.selectedStep = null;
        },
        error: (err) => {
          this.toastr.error('Erreur lors de la mise à jour de l\'étape');
        }
      });
    }
  }

  updateLocalStep(updated: any) {
    const findAndUpdate = (steps: any[]): boolean => {
      for (let i = 0; i < steps.length; i++) {
        const match =
          (updated.id && steps[i].id === updated.id) ||
          (updated.tempId && steps[i].tempId === updated.tempId);
        if (match) {
          const existingChildren = steps[i].children || [];
          steps[i] = { ...steps[i], ...updated, children: existingChildren };
          return true;
        }
        if (steps[i].children && findAndUpdate(steps[i].children)) return true;
      }
      return false;
    };

    if (!findAndUpdate(this.steps)) {
      if (!updated.parent_id && !updated.parent_temp_id) {
        this.steps.push({ ...updated, children: [] });
      } else {
        this.attachToParent(this.steps, updated);
      }
    }
  }

  private attachToParent(steps: any[], updated: any): boolean {
    for (const step of steps) {
      const isParent = (step.id && step.id === updated.parent_id) ||
                       (step.tempId && step.tempId === updated.parent_temp_id);

      if (isParent) {
        step.children = step.children || [];
        step.children.push({ ...updated, children: [] });
        return true;
      }
      if (step.children && this.attachToParent(step.children, updated)) {
        return true;
      }
    }
    return false;
  }

  deleteStep(step: any) {
    if (!step) return;

    if ((step.id || 0) === 0) {
      this.removeStepFromTree(step);
      return;
    }

    this.stepService.deleteStep(step.id).subscribe({
      next: () => {
        this.removeStepFromTree(step);
        this.toastr.success('Étape supprimée');
      },
      error: () => {
        this.toastr.error('Erreur lors de la suppression de l\'étape');
      }
    });
  }

  removeStepFromTree(stepToRemove: any) {
    const removeRecursive = (steps: any[], target: any): boolean => {
      for (let i = 0; i < steps.length; i++) {
        if (steps[i] === target || (target.id && steps[i].id === target.id)) {
          steps.splice(i, 1);
          return true;
        }
        if (steps[i].children && removeRecursive(steps[i].children, target)) return true;
      }
      return false;
    };
    removeRecursive(this.steps, stepToRemove);
  }

  saveProcedure() {
    // validation: only titre is mandatory now (departement optional)
    if (!this.procedure.titre) {
      this.toastr.warning('Veuillez renseigner le titre de la procédure');
      return;
    }

    if (this.steps.length === 0) {
      this.toastr.warning('Ajoutez au moins une étape');
      return;
    }

    this.isLoading = true;

    const payload: any = {
      titre: this.procedure.titre,
      description: this.procedure.description,
      version: this.procedure.version,
      statut: this.procedure.statut,
      departement_id: (this.procedure.departement_id ?? null),
      processus: this.procedure.processus,
      norme: this.procedure.norme,
      code: (this.procedure as any).code
    };

    if (this.isEditMode && this.procedure.id) {
      this.procedureService.updateProcedure(this.procedure.id!, payload).subscribe({
        next: () => {
          this.uploadAttachments(this.procedure.id!);
          this.toastr.success('Procédure mise à jour avec succès');
          this.router.navigate(['/dashboard/procedures']);
          this.isLoading = false;
        },
        error: (error) => {
          this.toastr.error('Erreur lors de la mise à jour');
          this.isLoading = false;
        }
      });
    } else {
      this.procedureService.createProcedure(payload).subscribe({
        next: (result: any) => {
          const newId = result.id;
          this.setProcedureIdRecursive(this.steps, newId);
          this.saveAllSteps(newId);
          this.uploadAttachments(newId);
          this.toastr.success('Procédure créée avec succès');
          this.router.navigate(['/dashboard/procedures']);
          this.isLoading = false;
        },
        error: (error) => {
          this.toastr.error('Erreur lors de la création');
          this.isLoading = false;
        }
      });
    }
  }

  private setProcedureIdRecursive(steps: any[], procedureId: number) {
    steps.forEach(step => {
      step.procedure_id = procedureId;
      if (step.children?.length) {
        this.setProcedureIdRecursive(step.children, procedureId);
      }
    });
  }

  saveAllSteps(procedureId: number) {
    this.createStepsByLevel(procedureId);
  }

  private async createStepsByLevel(procedureId: number) {
    try {
      await this.createRootSteps(this.steps, procedureId);
      await this.createAllChildSteps(this.steps, procedureId);
    } catch (error) {
      // swallow: toast already used elsewhere
    }
  }

  private async createRootSteps(steps: any[], procedureId: number): Promise<void> {
    for (const step of steps) {
      if ((step.id || 0) === 0) {
        const payload = {
          procedure_id: procedureId,
          parent_id: null,
          ordre: step.ordre,
          contenu: step.contenu,
          type: step.type,
          metadata: step.metadata,
          date_creation: new Date().toISOString(),
          date_modification: new Date().toISOString()
        } as any;

        try {
          const saved = await lastValueFrom(this.stepService.createStep(payload));
          if (saved) {
            step.id = saved.id;
          }
        } catch (err) { /* ignore per-step errors */ }
      }
    }
  }

  private async createAllChildSteps(steps: any[], procedureId: number): Promise<void> {
    for (const step of steps) {
      if (step.children?.length && step.id) {
        await this.createChildrenRecursively(step.children, procedureId, step.id);
      }
    }
  }

  private async createChildrenRecursively(children: any[], procedureId: number, parentId: number): Promise<void> {
    for (const child of children) {
      if ((child.id || 0) === 0) {
        const payload = {
          procedure_id: procedureId,
          parent_id: parentId,
          ordre: child.ordre,
          contenu: child.contenu,
          type: child.type,
          metadata: child.metadata,
          date_creation: new Date().toISOString(),
          date_modification: new Date().toISOString()
        } as any;

        try {
          const saved = await lastValueFrom(this.stepService.createStep(payload));
          if (saved) {
            child.id = saved.id;
            if (child.children?.length) {
              await this.createChildrenRecursively(child.children, procedureId, saved.id);
            }
          }
        } catch (err) { /* ignore per-child errors */ }
      } else if (child.children?.length) {
        await this.createChildrenRecursively(child.children, procedureId, child.id);
      }
    }
  }

  uploadAttachments(procedureId: number) {
    if (!this.selectedFiles || this.selectedFiles.length === 0) return;

    const uploads$ = this.selectedFiles.map(file =>
      this.attachmentService.upload(file, procedureId)
    );

    forkJoin(uploads$).subscribe({
      next: () => {
        this.toastr.success('Pièces jointes uploadées avec succès');
        this.loadAttachments(procedureId);
        this.selectedFiles = [];
      },
      error: () => {
        this.toastr.error("Erreur lors de l'upload des pièces jointes");
      }
    });
  }

  getStatusDisplay(status: string): string {
    const statusMap: Record<string, string> = {
      'BROUILLON': 'Brouillon',
      'EN_REVISION': 'En révision',
      'EN_APPROBATION': 'En approbation',
      'APPROUVEE': 'Approuvée',
      'PUBLIEE': 'Publiée',
      'ARCHIVEE': 'Archivée',
      'REJETEE': 'Rejetée'
    };
    return statusMap[status] || status;
  }
}
