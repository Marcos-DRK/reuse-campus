import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { API_URL } from '../config';
import { RegistroForm, Sesion, Usuario } from '../models/usuario';

const CLAVE_SESION = 'reuse-campus-sesion';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${API_URL}/auth`;

  // La sesión (token + usuario) se guarda en localStorage para sobrevivir a una recarga
  private readonly sesion = signal<Sesion | null>(this.leerSesion());

  readonly usuario = computed<Usuario | null>(() => this.sesion()?.usuario ?? null);
  readonly estaAutenticado = computed(() => this.sesion() !== null);
  readonly esAdmin = computed(() => this.usuario()?.rol === 'ADMIN');

  token(): string | null {
    return this.sesion()?.token ?? null;
  }

  login(correo: string, password: string): Observable<Sesion> {
    return this.http
      .post<Sesion>(`${this.apiUrl}/login`, { correo, password })
      .pipe(tap((sesion) => this.guardarSesion(sesion)));
  }

  registro(datos: RegistroForm): Observable<Sesion> {
    return this.http
      .post<Sesion>(`${this.apiUrl}/registro`, datos)
      .pipe(tap((sesion) => this.guardarSesion(sesion)));
  }

  logout(): void {
    localStorage.removeItem(CLAVE_SESION);
    this.sesion.set(null);
  }

  private guardarSesion(sesion: Sesion): void {
    localStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
    this.sesion.set(sesion);
  }

  private leerSesion(): Sesion | null {
    try {
      const texto = localStorage.getItem(CLAVE_SESION);
      return texto ? (JSON.parse(texto) as Sesion) : null;
    } catch {
      return null;
    }
  }
}
