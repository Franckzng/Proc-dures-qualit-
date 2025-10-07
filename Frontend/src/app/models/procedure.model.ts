// src/app/models/procedure.model.ts

export enum ProcedureStatus {
  BROUILLON      = 'BROUILLON',
  EN_REVISION    = 'EN_REVISION',
  EN_APPROBATION = 'EN_APPROBATION',
  APPROUVEE      = 'APPROUVEE',
  PUBLIEE        = 'PUBLIEE',
  ARCHIVEE       = 'ARCHIVEE',
  REJETEE        = 'REJETEE'
}

/** Représentation d'une étape du workflow (ce que renvoie le backend) */
export interface WorkflowStep {
  etape_id:        number;
  workflow_id:     number;
  ordre:           number;
  statut:          string;
  commentaire:     string | null;
  date_traitement: string | null; // ISO string (ou null)
  role_nom:        string | null;
  user_nom:        string | null;
  user_prenom:     string | null;
}

/** Workflow d'approbation complet (dernier workflow attaché à la procédure) */
export interface ProcedureWorkflow {
  id:                 number;
  procedure_id:       number;
  type_workflow?:     string | null;
  statut:             string;
  date_creation?:     string | null;
  date_finalisation?:  string | null;
  redacteur_nom?:     string | null;   // initiateur (rédacteur) ajouté côté backend
  redacteur_prenom?:  string | null;
  etapes:             WorkflowStep[];
}

/** La procédure */
export interface Procedure {
  id:                  number;
  titre:               string;
  code?:               string;
  description:         string;
  contenu:             string;
  version:             string;
  statut:              ProcedureStatus;
  departement_id:      number;
  departement_nom?: string; // fourni par le backend
  processus?:          string;
  norme?:              string;
  redacteur_id:        number;
  redacteur_nom?: string;
  redacteur_prenom?: string;
  date_creation:       string; // garde en string ISO pour pipe date
  date_modification?:  string | null;
  date_archivage?:     string | null;
  date_publication?:   string | null;

  /** Le dernier workflow (en cours ou terminé) ; peut être null */
  workflow?:           ProcedureWorkflow | null;

  workflow_id?: number;
}

/** Historique versions (inchangé) */
export interface ProcedureVersion {
  id:               number;
  procedure_id:     number;
  numero_version:   string;
  contenu:          string;
  commentaire?:     string;
  utilisateur_id:   number;
  date_creation:    string;
}
