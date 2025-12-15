import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../services/user.service';
import { User } from '../../../models/user.model';
import { RouterLink } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

@Component({
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './user-list.html',
  styleUrls: ['./user-list.css']
})
export class UserListComponent {
  private userService = inject(UserService);
  private toastr = inject(ToastrService);
  
  users = signal<User[]>([]);
  roles: Role[] = [
    { id: 1, nom: 'Admin' },
    { id: 2, nom: 'Approbateur' },
    { id: 3, nom: 'Vérificateur' },
    { id: 4, nom: 'Rédacteur' },
    { id: 5, nom: 'Utilisateur' }
  ];

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.userService.getUsers().subscribe({
      next: users => this.users.set(users),
      error: () => this.toastr.error('Erreur lors du chargement des utilisateurs')
    });
  }

  getRoleName(roleId: number): string {
    return this.roles.find(r => r.id === roleId)?.nom || 'Inconnu';
  }

  toggleUserStatus(user: User) {
    const newStatus = !user.actif;
    this.userService.updateUserStatus(user.id, newStatus).subscribe({
      next: () => {
        this.toastr.success('Statut utilisateur mis à jour');
        this.loadUsers();
      },
      error: () => this.toastr.error('Erreur lors de la mise à jour')
    });
  }
}

interface Role {
  id: number;
  nom: string;
}