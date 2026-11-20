import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../config';
import { RespuestaAceptar, Solicitud } from '../models/solicitud';

@Injectable({ providedIn: 'root' })
export class SolicitudesService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${API_URL}/solicitudes`;

  misSolicitudes(): Observable<Solicitud[]> {
    return this.http.get<Solicitud[]>(`${this.apiUrl}/mias`);
  }

  porPublicacion(publicacionId: number): Observable<Solicitud[]> {
    return this.http.get<Solicitud[]>(`${this.apiUrl}/publicacion/${publicacionId}`);
  }

  crear(publicacionId: number, mensaje: string): Observable<Solicitud> {
    return this.http.post<Solicitud>(this.apiUrl, { publicacionId, mensaje });
  }

  actualizarMensaje(id: number, mensaje: string): Observable<Solicitud> {
    return this.http.put<Solicitud>(`${this.apiUrl}/${id}`, { mensaje });
  }

  aceptar(id: number): Observable<RespuestaAceptar> {
    return this.http.patch<RespuestaAceptar>(`${this.apiUrl}/${id}/aceptar`, {});
  }

  rechazar(id: number): Observable<{ mensaje: string }> {
    return this.http.patch<{ mensaje: string }>(`${this.apiUrl}/${id}/rechazar`, {});
  }

  cancelar(id: number): Observable<{ mensaje: string }> {
    return this.http.patch<{ mensaje: string }>(`${this.apiUrl}/${id}/cancelar`, {});
  }
}
