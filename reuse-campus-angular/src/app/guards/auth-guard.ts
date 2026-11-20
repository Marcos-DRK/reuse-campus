import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

// Solo deja entrar a usuarios con sesión iniciada
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.estaAutenticado() ? true : inject(Router).createUrlTree(['/login']);
};

// Solo deja entrar a administradores.
// OJO (RN18): esto solo mejora la usabilidad; la seguridad real está en el backend (soloAdmin).
export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.esAdmin() ? true : inject(Router).createUrlTree(['/inicio']);
};

// Login y registro solo para quien NO ha iniciado sesión
export const invitadoGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.estaAutenticado() ? inject(Router).createUrlTree(['/inicio']) : true;
};
