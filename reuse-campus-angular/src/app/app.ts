import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Cabecera } from './components/cabecera/cabecera';
import { Menu } from './components/menu/menu';
import { AuthService } from './services/auth';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Cabecera, Menu],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly auth = inject(AuthService);
}
