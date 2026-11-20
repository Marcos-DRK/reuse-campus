import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';
import { PublicacionesService } from '../../services/publicaciones';
import { CATEGORIAS, ESTADOS_PUBLICACION, MODALIDADES, Publicacion } from '../../models/publicacion';
import { mensajeError } from '../../utils/errores';

@Component({
  selector: 'app-publicaciones',
  imports: [ReactiveFormsModule, RouterLink, DatePipe],
  templateUrl: './publicaciones.html',
  styleUrl: './publicaciones.css'
})
export class Publicaciones implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly publicacionesService = inject(PublicacionesService);

  readonly publicaciones = signal<Publicacion[]>([]);
  readonly cargando = signal(true);
  readonly error = signal('');

  readonly categorias = CATEGORIAS;
  readonly modalidades = MODALIDADES;
  readonly estados = ESTADOS_PUBLICACION;

  // Por defecto el catálogo muestra solo lo DISPONIBLE
  filtros = new FormGroup({
    texto: new FormControl('', { nonNullable: true }),
    categoria: new FormControl('', { nonNullable: true }),
    modalidad: new FormControl('', { nonNullable: true }),
    estado: new FormControl('DISPONIBLE', { nonNullable: true })
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.error.set('');
    this.publicacionesService.listar(this.filtros.getRawValue()).subscribe({
      next: (datos) => {
        this.publicaciones.set(datos);
        this.cargando.set(false);
      },
      error: (error) => {
        this.error.set(mensajeError(error, 'No fue posible obtener las publicaciones.'));
        this.cargando.set(false);
      }
    });
  }

  limpiar(): void {
    this.filtros.reset();
    this.cargar();
  }
}
