// src/app/pages/procedures/procedure-list/procedure-list.ts
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute, ParamMap } from '@angular/router';
import { ProcedureService } from '../../../services/procedure.service';
import { Procedure, ProcedureStatus } from '../../../models/procedure.model';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../../services/auth.service';
import {
  ROLE_ADMIN,
  ROLE_REDACTEUR,
  ROLE_VERIFICATEUR,
  ROLE_APPROBATEUR
} from '../../../config/roles';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './procedure-list.html',
  styleUrls: ['./procedure-list.css']
})
export class ProcedureList implements OnInit {
  private procedureService = inject(ProcedureService);
  private toastr = inject(ToastrService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  // données affichées
  public procedures = signal<Procedure[]>([]);
  // données brutes reçues du backend (pour debug / vérif)
  public proceduresRaw = signal<Procedure[]>([]);

  public currentUser = this.authService.currentUser();

  // state
  public isFiltered = signal(false);
  public currentProcess: string | null = null;
  public currentProcessDisplay?: string;

  // recherche
  public keyword: string = '';

  // expose role constants (importées depuis config/roles)
  public ROLE_ADMIN = ROLE_ADMIN;
  public ROLE_REDACTEUR = ROLE_REDACTEUR;
  public ROLE_VERIFICATEUR = ROLE_VERIFICATEUR;
  public ROLE_APPROBATEUR = ROLE_APPROBATEUR;
  public ProcedureStatus = ProcedureStatus;

  // mode debug: si true => on affichera les données brutes sans filtrage par rôle
  // (sert pour tester si la réponse backend est correcte)
  private DEBUG_ALWAYS_SHOW_RAW = false;

  readonly editableStatuses = [
    ProcedureStatus.BROUILLON,
    ProcedureStatus.REJETEE,
    ProcedureStatus.APPROUVEE
  ];

  ngOnInit() {
    this.route.paramMap.subscribe((pm: ParamMap) => {
      const procParam = pm.get('process');
      const fullUrl = this.router.url.split('?')[0];

      //console.debug('[ProcedureList] route.url =', fullUrl, 'param(process) =', procParam);

      if (procParam !== null) {
        const trimmed = (procParam || '').trim();
        const lower = trimmed.toLowerCase();
        if (trimmed === '' || lower === 'non-classé' || lower === 'non-class') {
          this.currentProcess = null;
          this.currentProcessDisplay = 'non-classé';
        } else {
          this.currentProcess = trimmed;
          this.currentProcessDisplay = trimmed;
        }
        this.isFiltered.set(true);
        this.keyword = '';
        this.loadByProcess(this.currentProcess, null);
        return;
      }

      if (fullUrl.endsWith('/procedures/process') || fullUrl.match(/\/procedures\/process(\/)?$/)) {
        //console.debug('[ProcedureList] detected route /procedures/process (no param) -> non-classé');
        this.currentProcess = null;
        this.currentProcessDisplay = 'non-classé';
        this.isFiltered.set(true);
        this.keyword = '';
        this.loadByProcess(null, null);
        return;
      }

      // default: load all
      this.isFiltered.set(false);
      this.currentProcess = null;
      this.currentProcessDisplay = undefined;
      this.keyword = '';
      this.loadProcedures();
    });
  }

  private loadProcedures() {
    const u = this.authService.currentUser();
    if (!u) {
      this.procedures.set([]);
      this.proceduresRaw.set([]);
      return;
    }
    this.currentUser = u;
    this.procedureService.getProcedures().subscribe({
      next: list => {
        //console.debug('[ProcedureList] loadProcedures - backend returned', Array.isArray(list) ? list.length : list);
        this.proceduresRaw.set(list || []);
        const filtered = this.DEBUG_ALWAYS_SHOW_RAW ? list || [] : this.filterByRole(list || [], u.role_id, u.id);
        this.procedures.set(filtered);
      },
      error: (err) => {
        console.error('[ProcedureList] loadProcedures error:', err);
        this.toastr.error('Erreur lors du chargement des procédures');
      }
    });
  }

  private loadByProcess(process: string | null, keyword: string | null) {
    //console.debug('[ProcedureList] loading by process ->', { process, keyword });

    this.procedureService.getByProcess(process, keyword || null).subscribe({
      next: list => {
        // logs importants pour debug
        //console.debug('[ProcedureList] backend returned (raw) count =', Array.isArray(list) ? list.length : 'not-array', list && list.slice ? list.slice(0,5) : list);
        this.proceduresRaw.set(list || []);

        // si on est en debug force l'affichage brut (utile pour isoler)
        if (this.DEBUG_ALWAYS_SHOW_RAW) {
          this.procedures.set(list || []);
          return;
        }

        // Appliquer le filtre par rôle (en forçant les comparaisons numériques)
        const currentRole = this.authService.currentUser()?.role_id ?? 0;
        const currentUserId = this.authService.currentUser()?.id ?? 0;
        const filtered = this.filterByRole(list || [], currentRole, currentUserId);
        console.debug('[ProcedureList] after filterByRole count =', filtered.length);
        this.procedures.set(filtered);
      },
      error: (err) => {
        //console.error('[ProcedureList] loadByProcess error ->', err);
        this.toastr.error('Erreur lors du chargement des procédures filtrées');
      }
    });
  }

  public onSearch() {
    if (!this.isFiltered()) return;
    this.loadByProcess(this.currentProcess, this.keyword || null);
  }

  public clearSearch() {
    this.keyword = '';
    if (this.isFiltered()) this.loadByProcess(this.currentProcess, null);
  }

  /**
   * Filtre par rôle — compare en Number(...) pour éviter problèmes string/number
   */
  private filterByRole(list: Procedure[], role: number, userId: number): Procedure[] {
    if (!Array.isArray(list)) return [];
    switch (Number(role)) {
      case Number(this.ROLE_REDACTEUR):
        return list.filter(p => Number((p as any).redacteur_id) === Number(userId));
      case Number(this.ROLE_VERIFICATEUR):
        return list.filter(p =>
          [ ProcedureStatus.EN_REVISION, ProcedureStatus.EN_APPROBATION, ProcedureStatus.APPROUVEE ]
          .includes((p as any).statut as ProcedureStatus)
        );
      case Number(this.ROLE_APPROBATEUR):
        return list.filter(p =>
          [ ProcedureStatus.EN_APPROBATION, ProcedureStatus.APPROUVEE ]
          .includes((p as any).statut as ProcedureStatus)
        );
      default:
        return list;
    }
  }

  public canEdit(proc: Procedure): boolean {
    return this.editableStatuses.includes(proc.statut as ProcedureStatus);
  }

  public canDelete(proc: Procedure): boolean {
    return this.canEdit(proc);
  }

  public deleteProcedure(proc: Procedure) {
    if (!this.canDelete(proc)) return;
    if (!confirm(`Supprimer la procédure "${proc.titre}" ?`)) return;
    this.procedureService.deleteProcedure(proc.id!).subscribe({
      next: () => {
        this.toastr.success('Procédure supprimée');
        if (this.isFiltered()) {
          this.loadByProcess(this.currentProcess, this.keyword || null);
        } else {
          this.loadProcedures();
        }
      },
      error: err => this.toastr.error(err.error?.message || 'Erreur lors de la suppression')
    });
  }

  public startApproval(proc: Procedure) {
    this.procedureService.startApprovalWorkflow(proc.id!).subscribe({
      next: () => {
        this.toastr.success('Workflow lancé');
        if (this.isFiltered()) {
          this.loadByProcess(this.currentProcess, this.keyword || null);
        } else {
          this.loadProcedures();
        }
      },
      error: () => this.toastr.error('Erreur lors du lancement du workflow')
    });
  }

  public viewDetail(proc: Procedure) {
    this.router.navigate(['/dashboard/procedures', proc.id]);
  }

  public getStatusClass(status: ProcedureStatus): string {
    switch (status) {
      case ProcedureStatus.BROUILLON:      return 'bg-secondary';
      case ProcedureStatus.EN_REVISION:    return 'bg-info';
      case ProcedureStatus.EN_APPROBATION: return 'bg-warning';
      case ProcedureStatus.APPROUVEE:      return 'bg-success';
      case ProcedureStatus.PUBLIEE:        return 'bg-primary';
      case ProcedureStatus.ARCHIVEE:       return 'bg-dark';
      case ProcedureStatus.REJETEE:        return 'bg-danger';
      default:                             return 'bg-light text-dark';
    }
  }
}
