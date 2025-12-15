// src/app/guards/step.guard.ts
import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  Router
} from '@angular/router';
import { WorkflowService, Step } from '../services/workflow.service';
import { AuthService } from '../services/auth.service';
import { map } from 'rxjs/operators';
import { of } from 'rxjs';

// IDs de rôles selon votre base
const ROLE_ADMIN        = 1;
const ROLE_APPROBATEUR  = 2;
const ROLE_VERIFICATEUR = 3;

@Injectable({ providedIn: 'root' })
export class StepGuard implements CanActivate {
  constructor(
    private svc: WorkflowService,
    private auth: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot) {
    const workflowId = Number(route.paramMap.get('workflowId'));
    const stepId     = Number(route.paramMap.get('stepId'));
    const roleId     = this.auth.currentUser()?.role_id;

    // Seuls admin, vérificateur ou approbateur peuvent accéder
    if (![ROLE_ADMIN, ROLE_VERIFICATEUR, ROLE_APPROBATEUR].includes(roleId!)) {
      this.router.navigate(['/dashboard']);
      return of(false);
    }

    return this.svc.getWorkflow(workflowId).pipe(
      map(wf => {
        const etapes = wf.etapes as Step[];
        // étape courante assignée à l'utilisateur et encore en attente
        const current = etapes.find(e =>
          e.etape_id === stepId
          && e.utilisateur_id === this.auth.currentUser()?.id
          && e.statut === 'EN_ATTENTE'
        );
        if (!current) return false;
        // aucune étape d’ordre inférieur ne doit rester EN_ATTENTE
        const hasPrior = etapes.some(e =>
          e.ordre < current!.ordre && e.statut === 'EN_ATTENTE'
        );
        return !hasPrior;
      }),
      map(ok => {
        if (!ok) {
          this.router.navigate(['/dashboard/workflows/pending']);
        }
        return ok;
      })
    );
  }
}
