import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../config';
import { Usuario, UsuarioForm } from '../models/usuario';

// CRUD de usuarios: solo lo usa el ADMINISTRADOR (el backend lo exige con soloAdmin)
@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${API_URL}/usuarios`;

  listar(): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(this.apiUrl);
  }

  crear(datos: UsuarioForm): Observable<Usuario> {
    return this.http.post<Usuario>(this.apiUrl, datos);
  }

  actualizar(id: number, datos: UsuarioForm): Observable<{ mensaje: string }> {
    return this.http.put<{ mensaje: string }>(`${this.apiUrl}/${id}`, datos);
  }

  desactivar(id: number): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(`${this.apiUrl}/${id}`);
  }
}
