import { Component, OnInit, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PublicacionesService } from '../../services/publicaciones';
import { CATEGORIAS, Modalidad } from '../../models/publicacion';
import { mensajeError } from '../../utils/errores';

// Un solo componente para CREAR (/publicaciones/nueva) y EDITAR (/publicaciones/:id/editar)
@Component({
  selector: 'app-publicacion-form',
  imports: [ReactiveFormsModule],
  templateUrl: './publicacion-form.html',
  styleUrl: './publicacion-form.css'
})
export class PublicacionForm implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly publicacionesService = inject(PublicacionesService);

  id = 0;
  esEdicion = false;
  readonly categorias = CATEGORIAS;
  readonly cargando = signal(false);
  readonly guardando = signal(false);
  readonly bloqueado = signal(false);
  readonly error = signal('');

  formulario = new FormGroup({
    titulo: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3), Validators.maxLength(150)] }),
    descripcion: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(10), Validators.maxLength(1000)] }),
    categoria: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    modalidad: new FormControl<Modalidad>('DONACION', { nonNullable: true, validators: [Validators.required] })
  });

  ngOnInit(): void {
    const parametro = this.route.snapshot.paramMap.get('id');
    if (!parametro) return; // modo creación

    this.esEdicion = true;
    this.id = Number(parametro);
    if (!Number.isInteger(this.id) || this.id <= 0) {
      this.error.set('Identificador de publicación inválido.');
      this.bloqueado.set(true);
      return;
    }

    this.cargando.set(true);
    this.publicacionesService.obtener(this.id).subscribe({
      next: (p) => {
        if (p.estado !== 'DISPONIBLE') {
          this.error.set(`No se puede editar una publicación ${p.estado}.`);
          this.bloqueado.set(true);
        }
        this.formulario.patchValue({
          titulo: p.titulo,
          descripcion: p.descripcion,
          categoria: p.categoria,
          modalidad: p.modalidad
        });
        this.cargando.set(false);
      },
      error: (error) => {
        this.error.set(mensajeError(error, 'No fue posible cargar la publicación.'));
        this.bloqueado.set(true);
        this.cargando.set(false);
      }
    });
  }

  guardar(): void {
    this.error.set('');
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    this.guardando.set(true);
    const datos = this.formulario.getRawValue();
    const peticion = this.esEdicion
      ? this.publicacionesService.actualizar(this.id, datos)
      : this.publicacionesService.crear(datos);

    peticion.subscribe({
      next: (publicacion) => this.router.navigate(['/publicaciones', publicacion.id]),
      error: (error) => {
        this.error.set(mensajeError(error, 'No fue posible guardar la publicación.'));
        this.guardando.set(false);
      }
    });
  }

  volver(): void {
    this.router.navigate(this.esEdicion ? ['/publicaciones', this.id] : ['/mis-publicaciones']);
  }
}
