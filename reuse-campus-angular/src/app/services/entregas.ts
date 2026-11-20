import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../config';
import { Entrega } from '../models/entrega';

@Injectable({ providedIn: 'root' })
export class EntregasService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${API_URL}/entregas`;

  listar(): Observable<Entrega[]> {
    return this.http.get<Entrega[]>(this.apiUrl);
  }

  obtener(id: number): Observable<Entrega> {
    return this.http.get<Entrega>(`${this.apiUrl}/${id}`);
  }

  completar(id: number): Observable<Entrega> {
    return this.http.patch<Entrega>(`${this.apiUrl}/${id}/completar`, {});
  }
}
