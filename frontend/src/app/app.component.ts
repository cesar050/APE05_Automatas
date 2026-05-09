import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

/**
 * Componente raíz de la aplicación.
 * Contiene el navbar de navegación entre los tres ejercicios
 * y el router-outlet donde se renderizan los componentes de cada uno.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="navbar">
      <div class="nav-brand">
        <span class="nav-icon">⚙</span>
        <span>APE05 — Autómatas Finitos</span>
      </div>
      <div class="nav-links">
        <a routerLink="/iot" routerLinkActive="active">
          <span class="nav-dot"></span>Telemetría IoT
        </a>
        <a routerLink="/genetic" routerLinkActive="active">
          <span class="nav-dot"></span>Secuencias Genéticas
        </a>
        <a routerLink="/slack" routerLinkActive="active">
          <span class="nav-dot"></span>Sintaxis Slack
        </a>
      </div>
    </nav>
    <main class="main-content">
      <router-outlet/>
    </main>
  `
})
export class AppComponent {}