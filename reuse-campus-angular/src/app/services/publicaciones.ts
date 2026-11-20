import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../config';
import { FiltrosPublicacion, Publicacion, PublicacionForm } from '../models/publicacion';

@Injectable({ providedIn: 'root' })
export class PublicacionesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${API_URL}/publicaciones`;

  // GET /api/publicaciones?estado=...&categoria=...  (solo se envían los filtros con valor)
  listar(filtros?: Partial<FiltrosPublicacion>): Observable<Publicacion[]> {
    let params = new HttpParams();
    for (const [clave, valor] of Object.entries(filtros ?? {})) {
      if (valor) params = params.set(clave, valor);
    }
    return this.http.get<Publicacion[]>(this.apiUrl, { params });
  }

  misPublicaciones(): Observable<Publicacion[]> {
    return this.http.get<Publicacion[]>(`${this.apiUrl}/mias`);
  }

  obtener(id: number): Observable<Publicacion> {
    return this.http.get<Publicacion>(`${this.apiUrl}/${id}`);
  }

  crear(datos: PublicacionForm): Observable<Publicacion> {
    return this.http.post<Publicacion>(this.apiUrl, datos);
  }

  actualizar(id: number, datos: PublicacionForm): Observable<Publicacion> {
    return this.http.put<Publicacion>(`${this.apiUrl}/${id}`, datos);
  }

  cancelar(id: number): Observable<{ mensaje: string }> {
    return this.http.patch<{ mensaje: string }>(`${this.apiUrl}/${id}/cancelar`, {});
  }

  eliminar(id: number): Observable<{ mensaje: string }> {
    return this.http.delete<{ mensaje: string }>(`${this.apiUrl}/${id}`);
  }
}
