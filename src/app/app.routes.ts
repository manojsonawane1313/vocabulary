import { Routes } from '@angular/router';
import { Home } from './component/home/home';
import { Quize } from './component/quize/quize';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  
  { path: 'home', component: Home },
  { path: 'quiz', component: Quize },

];
