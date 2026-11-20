import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';
import { mensajeError } from '../../utils/errores';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly error = signal('');
  readonly enviando = signal(false);
  readonly sesionExpirada = this.route.snapshot.queryParamMap.get('sesion') === 'expirada';

  formulario = new FormGroup({
    correo: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] })
  });

  ingresar(): void {
    this.error.set('');
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }
    this.enviando.set(true);
    const { correo, password } = this.formulario.getRawValue();
    this.auth.login(correo, password).subscribe({
      next: () => this.router.navigate(['/inicio']),
      error: (error) => {
        this.error.set(mensajeError(error, 'No fue posible iniciar sesión.'));
        this.enviando.set(false);
      }
    });
  }
}
