import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';
import { mensajeError } from '../../utils/errores';

// Validador de grupo: la confirmación debe coincidir con la contraseña
function passwordsIguales(grupo: AbstractControl): ValidationErrors | null {
  const password = grupo.get('password')?.value;
  const confirmar = grupo.get('confirmar')?.value;
  return password === confirmar ? null : { noCoinciden: true };
}

@Component({
  selector: 'app-registro',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './registro.html',
  styleUrl: './registro.css'
})
export class Registro {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly error = signal('');
  readonly enviando = signal(false);

  formulario = new FormGroup(
    {
      nombre: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(3), Validators.maxLength(100)] }),
      correo: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
      password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(6)] }),
      confirmar: new FormControl('', { nonNullable: true, validators: [Validators.required] })
    },
    { validators: passwordsIguales }
  );

  registrar(): void {
    this.error.set('');
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    const { nombre, correo, password } = this.formulario.getRawValue();
    this.auth.registro({ nombre, correo, password }).subscribe({
      next: () => this.router.navigate(['/inicio']),
      error: (error) => {
        this.error.set(mensajeError(error, 'No fue posible crear la cuenta.'));
        this.enviando.set(false);
      }
    });
  }
}
