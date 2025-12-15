// src/app/services/workflow.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface Step {
  etape_id: number;
  workflow_id: number;
  ordre: number;
  procedure_titre: string;
  procedure_id: number;
  role_id?: number;
  utilisateur_id?: number;
  statut?: 'EN_ATTENTE' | 'VALIDE' | 'REJETE' | 'ANNULE';
  commentaire?: string;
  date_traitement?: string;
  // champs du détail complet
  role_nom?: string;
  user_nom?: string;
  user_prenom?: string;
}

export interface Workflow {
  id: number;
  procedure_id: number;
  type_workflow: string;
  statut: string;
  initiateur_id?: number;
  // **Nouveaux champs pour le rédacteur / initiateur**
  redacteur_nom?: string;
  redacteur_prenom?: string;
  date_finalisation?: string | null;
  etapes: Step[];
  procedure?: {
    id: number;
    titre: string;
    description: string;
  };
}

@Injectable({ providedIn: 'root' })
export class WorkflowService {
  private apiUrl = `${environment.apiUrl}/workflows`;

  constructor(private http: HttpClient) {}

  /**
   * Récupère les étapes en attente pour l'utilisateur connecté
   */
  getPendingSteps(): Observable<Step[]> {
    return this.http.get<Step[]>(`${this.apiUrl}/etapes/attente`);
  }

  /**
   * Récupère un workflow complet par son ID
   */
  getWorkflow(id: number): Observable<Workflow> {
    return this.http.get<Workflow>(`${this.apiUrl}/${id}`);
  }

  /**
   * Traite une étape (valider ou rejeter)
   */
  processStep(
    workflowId: number,
    etapeId: number,
    action: 'VALIDE' | 'REJETE',
    commentaire: string
  ) {
    return this.http.patch(
      `${this.apiUrl}/${workflowId}/etapes/${etapeId}`,
      { action, commentaire }
    );
  }

  /**
   * Récupère l'étape en cours pour une procédure donnée
   */
  getStepByProcedure(procedureId: number): Observable<Step> {
    return this.http.get<Step>(`${this.apiUrl}/etapes/procedure/${procedureId}`);
  }
}
