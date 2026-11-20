import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PublicacionesService } from '../../services/publicaciones';
import { Publicacion } from '../../models/publicacion';
import { mensajeError } from '../../utils/errores';

@Component({
  selector: 'app-mis-publicaciones',
  imports: [RouterLink, DatePipe],
  templateUrl: './mis-publicaciones.html',
  styleUrl: './mis-publicaciones.css'
})
export class MisPublicaciones implements OnInit {
  private readonly publicacionesService = inject(PublicacionesService);

  readonly publicaciones = signal<Publicacion[]>([]);
  readonly cargando = signal(true);
  readonly error = signal('');

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.publicacionesService.misPublicaciones().subscribe({
      next: (datos) => {
        this.publicaciones.set(datos);
        this.cargando.set(false);
      },
      error: (error) => {
        this.error.set(mensajeError(error, 'No fue posible obtener sus publicaciones.'));
        this.cargando.set(false);
      }
    });
  }
}
