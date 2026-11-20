import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth';

// Interceptor: se ejecuta en TODAS las peticiones de HttpClient.
// 1) Agrega el encabezado Authorization: Bearer <token> si hay sesión.
// 2) Si la API responde 401 (token vencido o inválido) cierra la sesión y envía al login.
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const token = auth.token();

  const peticion = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(peticion).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/auth/login')) {
        auth.logout();
        router.navigate(['/login'], { queryParams: { sesion: 'expirada' } });
      }
      return throwError(() => error);
    })
  );
};
