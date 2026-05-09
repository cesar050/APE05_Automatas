import { Routes } from '@angular/router';

/**
 * Configuración de rutas principales de la aplicación.
 * Cada ejercicio carga su componente de forma lazy
 * para optimizar el tiempo de carga inicial.
 */
export const routes: Routes = [
  { path: '', redirectTo: 'iot', pathMatch: 'full' },
  {
    path: 'iot',
    loadComponent: () => import('./features/iot/iot.component').then(m => m.IotComponent)
  },
  {
    path: 'genetic',
    loadComponent: () => import('./features/genetic/genetic.component').then(m => m.GeneticComponent)
  },
  {
    path: 'slack',
    loadComponent: () => import('./features/slack/slack.component').then(m => m.SlackComponent)
  }
];