// src/app/models/step.model.ts
export interface Step {
  id: number;
  procedure_id: number;
  parent_id: number | null;
  ordre: number;
  contenu: string;
  type: string;
  metadata?: any;
  pos_x?: number;
  pos_y?: number;
  created_by?: number;
  updated_by?: number;
  date_creation: Date | string;
  date_modification: Date | string;
  children?: Step[];
  tempId?: string;

  // numero de l'étape calculé côté frontend (ex: "1", "1.1", "1.2.1")
  numero?: string;
}
