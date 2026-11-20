import { Routes } from '@angular/router';
import { adminGuard, authGuard, invitadoGuard } from './guards/auth-guard';
import { Login } from './components/login/login';
import { Registro } from './components/registro/registro';
import { Inicio } from './components/inicio/inicio';
import { Publicaciones } from './components/publicaciones/publicaciones';
import { PublicacionDetalle } from './components/publicacion-detalle/publicacion-detalle';
import { PublicacionForm } from './components/publicacion-form/publicacion-form';
import { MisPublicaciones } from './components/mis-publicaciones/mis-publicaciones';
import { MisSolicitudes } from './components/mis-solicitudes/mis-solicitudes';
import { Entregas } from './components/entregas/entregas';
import { AdminUsuarios } from './components/admin-usuarios/admin-usuarios';

export const routes: Routes = [
  { path: '', redirectTo: 'inicio', pathMatch: 'full' },
  { path: 'login', component: Login, canActivate: [invitadoGuard] },
  { path: 'registro', component: Registro, canActivate: [invitadoGuard] },
  { path: 'inicio', component: Inicio, canActivate: [authGuard] },
  { path: 'publicaciones', component: Publicaciones, canActivate: [authGuard] },
  { path: 'publicaciones/nueva', component: PublicacionForm, canActivate: [authGuard] },
  { path: 'publicaciones/:id', component: PublicacionDetalle, canActivate: [authGuard] },
  { path: 'publicaciones/:id/editar', component: PublicacionForm, canActivate: [authGuard] },
  { path: 'mis-publicaciones', component: MisPublicaciones, canActivate: [authGuard] },
  { path: 'mis-solicitudes', component: MisSolicitudes, canActivate: [authGuard] },
  { path: 'entregas', component: Entregas, canActivate: [authGuard] },
  { path: 'admin/usuarios', component: AdminUsuarios, canActivate: [authGuard, adminGuard] },
  { path: '**', redirectTo: 'inicio' }
];
