// src/app/models/workflow.model.ts
export interface Workflow {
  id: number;
  procedure_id: number;
  procedure_titre: string; // Ajouté pour l'affichage
  initiateur_nom: string; // Ajouté pour l'affichage
  statut: 'EN_COURS' | 'APPROUVE' | 'REJETE' | 'ANNULE';
  date_initiation: Date;
  date_finalisation?: Date;
}

export interface WorkflowStep {
  id: number;
  workflow_id: number;
  utilisateur_id: number;
  utilisateur_nom: string; // Ajouté pour l'affichage
  ordre: number;
  statut: 'EN_ATTENTE' | 'VALIDE' | 'REJETE' | 'ANNULE';
  commentaire?: string;
  date_traitement?: Date;
}

export interface WorkflowDetails {
  workflow: Workflow;
  steps: WorkflowStep[];
  currentStep: WorkflowStep;
}