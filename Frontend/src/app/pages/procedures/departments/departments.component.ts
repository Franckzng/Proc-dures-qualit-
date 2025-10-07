//src/app/pages/procedures/departments/department.component.ts
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { DepartmentService } from '../../../services/department.service';
import { ProcedureService } from '../../../services/procedure.service';
import { Procedure, ProcedureStatus } from '../../../models/procedure.model';
import { ToastrService } from 'ngx-toastr';
import {
  ROLE_ADMIN,
  ROLE_REDACTEUR,
  ROLE_VERIFICATEUR,
  ROLE_APPROBATEUR
} from '../../../config/roles';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './departments.component.html',
  styleUrls: ['./departments.component.css']
})
export class DepartmentsComponent implements OnInit {
  private deptSvc = inject(DepartmentService);
  private procSvc = inject(ProcedureService);
  private router = inject(Router);
  private toastr = inject(ToastrService);


  private procedureService = inject(ProcedureService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private departmentService = inject(DepartmentService);

  public procedures = signal<Procedure[]>([]);
  public currentUser = this.authService.currentUser();

  public departments = signal<Array<{ id: number; nom: string; responsable?: string }>>([]);
  public counts = signal<Record<number, number>>({});

    // exposer constantes/enums
  public ROLE_ADMIN = ROLE_ADMIN;
  public ROLE_REDACTEUR = ROLE_REDACTEUR;
  public ROLE_VERIFICATEUR = ROLE_VERIFICATEUR;
  public ROLE_APPROBATEUR = ROLE_APPROBATEUR;

  ngOnInit() {
    this.load();
  }

  private load() {
    this.deptSvc.getDepartments().subscribe({
      next: (list) => {
        this.departments.set(list);
      },
      error: () => this.toastr.error('Erreur chargement départements')
    });

    this.procSvc.getByDepartment().subscribe({
      next: rows => {
        const map: Record<number, number> = {};
        rows.forEach(r => map[r.department_id] = Number(r.procedures_count || 0));
        this.counts.set(map);
      },
      error: () => { /* silent fallback */ }
    });
  }

  public openDept(d: { id: number; nom: string }) {
    // navigation absolue avec segments → plus sûre que la concaténation de chaîne
    this.router.navigate(['/dashboard', 'procedures', 'dept', String(d.id), 'processes']);
  }


  public countFor(id: number) {
    return this.counts()[id] ?? 0;
  }
}
