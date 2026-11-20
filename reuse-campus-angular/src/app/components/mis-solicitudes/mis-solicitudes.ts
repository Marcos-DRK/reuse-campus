import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SolicitudesService } from '../../services/solicitudes';
import { Solicitud } from '../../models/solicitud';
import { mensajeError } from '../../utils/errores';

@Component({
  selector: 'app-mis-solicitudes',
  imports: [ReactiveFormsModule, RouterLink, DatePipe],
  templateUrl: './mis-solicitudes.html',
  styleUrl: './mis-solicitudes.css'
})
export class MisSolicitudes implements OnInit {
  private readonly solicitudesService = inject(SolicitudesService);

  readonly solicitudes = signal<Solicitud[]>([]);
  readonly cargando = signal(true);
  readonly error = signal('');
  readonly exito = signal('');
  readonly editandoId = signal<number | null>(null);

  mensaje = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(5), Validators.maxLength(500)]
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.solicitudesService.misSolicitudes().subscribe({
      next: (datos) => {
        this.solicitudes.set(datos);
        this.cargando.set(false);
      },
      error: (error) => {
        this.error.set(mensajeError(error, 'No fue posible obtener sus solicitudes.'));
        this.cargando.set(false);
      }
    });
  }

  editar(solicitud: Solicitud): void {
    this.editandoId.set(solicitud.id);
    this.mensaje.setValue(solicitud.mensaje);
  }

  guardarMensaje(solicitud: Solicitud): void {
    if (this.mensaje.invalid) {
      this.mensaje.markAsTouched();
      return;
    }
    this.limpiarMensajes();
    this.solicitudesService.actualizarMensaje(solicitud.id, this.mensaje.value).subscribe({
      next: () => {
        this.editandoId.set(null);
        this.exito.set('Mensaje actualizado.');
        this.cargar();
      },
      error: (error) => this.error.set(mensajeError(error, 'No fue posible actualizar el mensaje.'))
    });
  }

  // RN16: solo se puede cancelar mientras esté PENDIENTE (el backend lo valida igual)
  cancelar(solicitud: Solicitud): void {
    if (!confirm(`¿Cancelar su solicitud sobre "${solicitud.publicacionTitulo}"?`)) return;
    this.limpiarMensajes();
    this.solicitudesService.cancelar(solicitud.id).subscribe({
      next: (r) => {
        this.exito.set(r.mensaje);
        this.cargar();
      },
      error: (error) => this.error.set(mensajeError(error, 'No fue posible cancelar la solicitud.'))
    });
  }

  private limpiarMensajes(): void {
    this.error.set('');
    this.exito.set('');
  }
}
