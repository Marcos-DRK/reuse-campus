import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../services/auth';
import { PublicacionesService } from '../../services/publicaciones';
import { SolicitudesService } from '../../services/solicitudes';
import { EntregasService } from '../../services/entregas';
import { mensajeError } from '../../utils/errores';

interface Resumen {
  disponibles: number;
  misPublicaciones: number;
  solicitudesPendientesRecibidas: number;
  misSolicitudesPendientes: number;
  entregasPendientes: number;
}

@Component({
  selector: 'app-inicio',
  imports: [RouterLink],
  templateUrl: './inicio.html',
  styleUrl: './inicio.css'
})
export class Inicio implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly publicacionesService = inject(PublicacionesService);
  private readonly solicitudesService = inject(SolicitudesService);
  private readonly entregasService = inject(EntregasService);

  readonly resumen = signal<Resumen | null>(null);
  readonly error = signal('');

  ngOnInit(): void {
    // forkJoin ejecuta las 4 peticiones en paralelo y espera a que terminen todas
    forkJoin({
      disponibles: this.publicacionesService.listar({ estado: 'DISPONIBLE' }),
      mias: this.publicacionesService.misPublicaciones(),
      solicitudes: this.solicitudesService.misSolicitudes(),
      entregas: this.entregasService.listar()
    }).subscribe({
      next: ({ disponibles, mias, solicitudes, entregas }) => {
        this.resumen.set({
          disponibles: disponibles.length,
          misPublicaciones: mias.length,
          solicitudesPendientesRecibidas: mias.reduce((total, p) => total + p.solicitudesPendientes, 0),
          misSolicitudesPendientes: solicitudes.filter((s) => s.estado === 'PENDIENTE').length,
          entregasPendientes: entregas.filter((e) => e.estado === 'PENDIENTE').length
        });
      },
      error: (error) => this.error.set(mensajeError(error, 'No fue posible cargar el resumen.'))
    });
  }
}
