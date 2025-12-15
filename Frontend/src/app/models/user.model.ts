// models/user.model.ts
export enum UserRole {
  ADMIN = 1,
  APPROVER = 2,
  VERIFIER = 3,
  EDITOR = 4,
  USER = 5
}

export interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role_id: number;
  departement_id: number;
  actif: boolean;
  date_creation?: string;
  date_modification?: string;
  role_nom?: string;
  permissions_str?: string; // Ajout de cette propriété
}

export interface UserWithPermissions extends User {
  permissions: Record<string, string[]>;
}

export interface Role {
  id: number;
  nom: string;
  description: string;
}

export interface Department {
  id: number;
  nom: string;
  responsable: string;
}

// Ajout pour correspondance exacte avec le backend
export interface DepartmentApiResponse {
  id: number;
  nom: string;
  responsable: string;
}