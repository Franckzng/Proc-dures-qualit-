// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';
import { StepGuard } from './guards/step.guard';
import { UserRole } from './models/user.model';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login').then(m => m.LoginComponent),
  },

  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layouts/dashboard-layout/dashboard-layout.component')
        .then(m => m.DashboardLayoutComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },

      // PROCÉDURES : organisation par PROCESSUS
      {
        path: 'procedures',
        children: [
          // landing = liste des processus
          {
            path: '',
            loadComponent: () =>
              import('./pages/procedures/processes/processes.component')
                .then(m => m.ProcessesComponent),
          },

          // route pour "non-classé" (sans param) -> important
          {
            path: 'process',
            loadComponent: () =>
              import('./pages/procedures/procedure-list/procedure-list')
                .then(m => m.ProcedureList),
          },

          // liste filtrée par process (param)
          {
            path: 'process/:process',
            loadComponent: () =>
              import('./pages/procedures/procedure-list/procedure-list')
                .then(m => m.ProcedureList),
          },

          // création / édition
          {
            path: 'new',
            canActivate: [roleGuard(UserRole.EDITOR)],
            loadComponent: () =>
              import('./pages/procedures/procedure-form/procedure-form')
                .then(m => m.ProcedureForm),
          },
          {
            path: 'edit/:id',
            loadComponent: () =>
              import('./pages/procedures/procedure-form/procedure-form')
                .then(m => m.ProcedureForm),
          },

          // détail individuel
          {
            path: ':id',
            loadComponent: () =>
              import('./pages/procedures/procedure-detail/procedure-detail.component')
                .then(m => m.ProcedureDetailComponent),
          },
        ],
      },

      // UTILISATEURS (admin)
      {
        path: 'users',
        canActivate: [roleGuard(UserRole.ADMIN)],
        loadComponent: () =>
          import('./pages/users/user-list/user-list')
            .then(m => m.UserListComponent),
      },

      // WORKFLOWS
      {
        path: 'workflows/pending',
        loadComponent: () =>
          import('./pages/workflows/pending-tasks/pending-tasks.component')
            .then(m => m.PendingTasksComponent),
      },
      {
        path: 'workflows/process/:workflowId/:stepId',
        canActivate: [StepGuard],
        loadComponent: () =>
          import('./pages/workflows/process-step/process-step.component')
            .then(m => m.ProcessStepComponent),
      },

      // fallback au sein du layout
      { path: 'home', redirectTo: '', pathMatch: 'full' },
      { path: '**', redirectTo: '', pathMatch: 'full' }
    ],
  },

  // racine publique
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // 404 globale
  {
    path: '**',
    loadComponent: () =>
      import('./pages/not-found/not-found').then(m => m.NotFound),
  },
];
