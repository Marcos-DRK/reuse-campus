import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { AuthService } from '../../services/auth';
import { UsuariosService } from '../../services/usuarios';
import { EstadoUsuario, Rol, Usuario } from '../../models/usuario';
import { mensajeError } from '../../utils/errores';

// CRUD de usuarios para el ADMINISTRADOR
@Component({
  selector: 'app-admin-usuarios',
  imports: [ReactiveFormsModule, DatePipe],
  templateUrl: './admin-usuarios.html',
  styleUrl: './admin-usuarios.css'
})
export class AdminUsuarios implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly usuariosService = inject(UsuariosService);

  readonly usuarios = signal<Usuario[]>([]);
  readonly cargando = signal(true);
  readonly error = signal('');
  readonly exito = signal('');
  readonly editandoId = signal<number | null>(null); // null = creando

  formulario = new FormGroup({
    nombre: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3)] }),
    correo: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6)] }),
    rol: new FormControl<Rol>('USUARIO', { nonNullable: true }),
    estado: new FormControl<EstadoUsuario>('ACTIVO', { nonNullable: true })
  });

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando.set(true);
    this.usuariosService.listar().subscribe({
      next: (datos) => {
        this.usuarios.set(datos);
        this.cargando.set(false);
      },
      error: (error) => {
        this.error.set(mensajeError(error, 'No fue posible obtener los usuarios.'));
        this.cargando.set(false);
      }
    });
  }

  editar(usuario: Usuario): void {
    this.editandoId.set(usuario.id);
    this.formulario.reset({ nombre: usuario.nombre, correo: usuario.correo, password: '', rol: usuario.rol, estado: usuario.estado });
    // Al editar, la contraseña es opcional (solo se cambia si se escribe una nueva)
    this.formulario.controls.password.setValidators([Validators.minLength(6)]);
    this.formulario.controls.password.updateValueAndValidity();
  }

  nuevo(): void {
    this.editandoId.set(null);
    this.formulario.reset();
    this.formulario.controls.password.setValidators([Validators.required, Validators.minLength(6)]);
    this.formulario.controls.password.updateValueAndValidity();
  }

  guardar(): void {
    this.limpiarMensajes();
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    const datos = this.formulario.getRawValue();
    const id = this.editandoId();
    const peticion: Observable<unknown> = id === null
      ? this.usuariosService.crear(datos)
      : this.usuariosService.actualizar(id, { ...datos, password: datos.password || undefined });

    peticion.subscribe({
      next: () => {
        this.exito.set(id === null ? 'Usuario creado correctamente.' : 'Usuario actualizado correctamente.');
        this.nuevo();
        this.cargar();
      },
      error: (error) => this.error.set(mensajeError(error, 'No fue posible guardar el usuario.'))
    });
  }

  // RN17: no se elimina físicamente, se desactiva (estado INACTIVO)
  desactivar(usuario: Usuario): void {
    if (!confirm(`¿Desactivar a ${usuario.nombre}? No podrá iniciar sesión.`)) return;
    this.limpiarMensajes();
    this.usuariosService.desactivar(usuario.id).subscribe({
      next: (r) => {
        this.exito.set(r.mensaje);
        this.cargar();
      },
      error: (error) => this.error.set(mensajeError(error, 'No fue posible desactivar el usuario.'))
    });
  }

  private limpiarMensajes(): void {
    this.error.set('');
    this.exito.set('');
  }
}
