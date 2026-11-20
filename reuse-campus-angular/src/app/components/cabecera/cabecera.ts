import { Component, inject } from '@angular/core';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-cabecera',
  templateUrl: './cabecera.html',
  styleUrl: './cabecera.css'
})
export class Cabecera {
  protected readonly auth = inject(AuthService);
}
