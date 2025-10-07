// src/app/layouts/dashboard-layout/dashboard-layout.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from '../../components/navbar/navbar.component';

@Component({
  selector: 'app-dashboard-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent],
  template: `
    <app-navbar></app-navbar>
    <div class="container-fluid p-4">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    .container-fluid {
      padding-top: 20px;
      padding-bottom: 20px;
    }
  `]
})
export class DashboardLayoutComponent {}
