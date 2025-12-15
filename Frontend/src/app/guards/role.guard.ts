import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

export const roleGuard = (requiredRole: UserRole): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    
    if (authService.currentUser()?.role_id === requiredRole) {
      return true;
    }
    
    router.navigate(['/dashboard']);
    return false;
  };
};