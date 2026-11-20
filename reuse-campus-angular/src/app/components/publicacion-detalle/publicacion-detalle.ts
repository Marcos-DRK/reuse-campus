import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../services/auth';
import { PublicacionesService } from '../../services/publicaciones';
import { SolicitudesService } from '../../services/solicitudes';
import { Publicacion } from '../../models/publicacion';
import { Solicitud } from '../../models/solicitud';
import { mensajeError } from '../../utils/errores';

@Component({
  selector: 'app-publicacion-detalle',
  imports: [ReactiveFormsModule, RouterLink, DatePipe],
  templateUrl: './publicacion-detalle.html',
  styleUrl: './publicacion-detalle.css'
})
export class PublicacionDetalle implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly publicacionesService = inject(PublicacionesService);
  private readonly solicitudesService = inject(SolicitudesService);

  id = 0;
  readonly publicacion = signal<Publicacion | null>(null);
  readonly solicitudes = signal<Solicitud[]>([]);          // recibidas (solo propietario/admin)
  readonly miSolicitudPendiente = signal<Solicitud | null>(null);
  readonly cargando = signal(true);
  readonly procesando = signal(false);
  readonly error = signal('');
  readonly exito = signal('');

  // Valores derivados: se recalculan solos cuando cambia la publicación o el usuario
  readonly esPropietario = computed(() => this.publicacion()?.usuarioId === this.auth.usuario()?.id);
  readonly puedeAdministrar = computed(() => this.esPropietario() || this.auth.esAdmin());

  formSolicitud = new FormGroup({
    mensaje: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(5), Validators.maxLength(500)]
    })
  });

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isInteger(this.id) || this.id <= 0) {
      this.error.set('Identificador de publicación inválido.');
      this.cargando.set(false);
      return;
    }
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.publicacionesService.obtener(this.id).subscribe({
      next: (publicacion) => {
        this.publicacion.set(publicacion);
        this.cargando.set(false);
        if (this.puedeAdministrar()) {
          this.cargarSolicitudesRecibidas();
        } else {
          this.cargarMiSolicitud();
        }
      },
      error: (error) => {
        this.error.set(mensajeError(error, 'No fue posible cargar la publicación.'));
        this.cargando.set(false);
      }
    });
  }

  private cargarSolicitudesRecibidas(): void {
    this.solicitudesService.porPublicacion(this.id).subscribe({
      next: (datos) => this.solicitudes.set(datos),
      error: (error) => this.error.set(mensajeError(error, 'No fue posible cargar las solicitudes.'))
    });
  }

  private cargarMiSolicitud(): void {
    this.solicitudesService.misSolicitudes().subscribe({
      next: (datos) =>
        this.miSolicitudPendiente.set(
          datos.find((s) => s.publicacionId === this.id && s.estado === 'PENDIENTE') ?? null
        ),
      error: (error) => this.error.set(mensajeError(error))
    });
  }

  // Ejecuta una acción y muestra el resultado; luego recarga los datos desde la API
  private ejecutar<T>(accion: Observable<T>, textoExito: (r: T) => string): void {
    this.error.set('');
    this.exito.set('');
    this.procesando.set(true);
    accion.subscribe({
      next: (respuesta) => {
        this.exito.set(textoExito(respuesta));
        this.procesando.set(false);
        this.cargar();
      },
      error: (error) => {
        this.error.set(mensajeError(error, 'No fue posible completar la operación.'));
        this.procesando.set(false);
      }
    });
  }

  solicitar(): void {
    if (this.formSolicitud.invalid) {
      this.formSolicitud.markAllAsTouched();
      return;
    }
    this.ejecutar(this.solicitudesService.crear(this.id, this.formSolicitud.controls.mensaje.value), () => {
      this.formSolicitud.reset();
      return 'Solicitud enviada. El propietario la revisará.';
    });
  }

  aceptar(solicitud: Solicitud): void {
    if (!confirm(`¿Aceptar la solicitud de ${solicitud.solicitanteNombre}? Las demás solicitudes pendientes serán rechazadas.`)) return;
    this.ejecutar(
      this.solicitudesService.aceptar(solicitud.id),
      (r) => `${r.mensaje}. Solicitudes rechazadas automáticamente: ${r.solicitudesRechazadas}.`
    );
  }

  rechazar(solicitud: Solicitud): void {
    if (!confirm(`¿Rechazar la solicitud de ${solicitud.solicitanteNombre}?`)) return;
    this.ejecutar(this.solicitudesService.rechazar(solicitud.id), (r) => r.mensaje);
  }

  cancelarPublicacion(): void {
    if (!confirm('¿Cancelar esta publicación? Las solicitudes pendientes serán rechazadas.')) return;
    this.ejecutar(this.publicacionesService.cancelar(this.id), (r) => r.mensaje);
  }

  eliminar(): void {
    if (!confirm('¿Eliminar definitivamente esta publicación?')) return;
    this.error.set('');
    this.procesando.set(true);
    this.publicacionesService.eliminar(this.id).subscribe({
      next: () => this.router.navigate(['/mis-publicaciones']),
      error: (error) => {
        this.error.set(mensajeError(error, 'No fue posible eliminar la publicación.'));
        this.procesando.set(false);
      }
    });
  }
}
