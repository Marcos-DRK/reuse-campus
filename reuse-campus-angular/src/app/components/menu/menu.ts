import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-menu',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './menu.html',
  styleUrl: './menu.css'
})
export class Menu {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  salir(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
