import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';
import { EntregasService } from '../../services/entregas';
import { Entrega } from '../../models/entrega';
import { mensajeError } from '../../utils/errores';

@Component({
  selector: 'app-entregas',
  imports: [RouterLink, DatePipe],
  templateUrl: './entregas.html',
  styleUrl: './entregas.css'
})
export class Entregas implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly entregasService = inject(EntregasService);

  readonly entregas = signal<Entrega[]>([]);
  readonly cargando = signal(true);
  readonly procesando = signal(false);
  readonly error = signal('');
  readonly exito = signal('');

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.entregasService.listar().subscribe({
      next: (datos) => {
        this.entregas.set(datos);
        this.cargando.set(false);
      },
      error: (error) => {
        this.error.set(mensajeError(error, 'No fue posible obtener las entregas.'));
        this.cargando.set(false);
      }
    });
  }

  // El botón solo se muestra al propietario o admin; el backend vuelve a validarlo (RN18)
  puedeConfirmar(entrega: Entrega): boolean {
    return entrega.estado === 'PENDIENTE' && (entrega.propietarioId === this.auth.usuario()?.id || this.auth.esAdmin());
  }

  rolEn(entrega: Entrega): string {
    const id = this.auth.usuario()?.id;
    if (entrega.propietarioId === id) return 'Entrego';
    if (entrega.receptorId === id) return 'Recibo';
    return 'Supervisión (admin)';
  }

  // RN14: al completar la entrega la publicación pasa a ENTREGADA
  completar(entrega: Entrega): void {
    if (!confirm(`¿Confirmar que "${entrega.publicacionTitulo}" fue entregado a ${entrega.receptorNombre}?`)) return;
    this.error.set('');
    this.exito.set('');
    this.procesando.set(true);
    this.entregasService.completar(entrega.id).subscribe({
      next: (actualizada) => {
        this.exito.set(`Entrega completada. La publicación quedó ${actualizada.publicacionEstado}.`);
        this.procesando.set(false);
        this.cargar();
      },
      error: (error) => {
        this.error.set(mensajeError(error, 'No fue posible completar la entrega.'));
        this.procesando.set(false);
      }
    });
  }
}
