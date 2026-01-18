// app.routes.ts
import { Routes } from '@angular/router';

import { AppLayout } from './layout/app-layout/app-layout';
import { Login } from './features/login/login';
import { UsuarioList } from './features/dashboard/usuario/usuario-list/usuario-list';
import { ProyectoList } from './features/dashboard/proyecto/proyecto-list/proyecto-list';
import { PruebaList } from './features/dashboard/prueba/prueba-list/prueba-list';
import { UsuarioDetail } from './features/dashboard/usuario/usuario-detail/usuario-detail';
import { ProyectoDetail } from './features/dashboard/proyecto/proyecto-detail/proyecto-detail';
import { Home } from './features/dashboard/home/home';
import { authGuard } from './services/auth-guard';
import { Estadistica } from './features/dashboard/estadistica/estadistica';
import { Unauthorized } from './layout/shared/unauthorized/unauthorized';

export const routes: Routes = [
  { path: 'login', component: Login },

  { 
    path: '', 
    component: AppLayout,
    children: [
      { path: '', component: Home },
      { path: 'usuario', component: UsuarioList, canActivate: [authGuard], data: { roles: ['admin', 'manager'] } },
      { path: 'usuario/:id', component: UsuarioDetail },
      { path: 'proyecto', component: ProyectoList },
      { path: 'proyecto/:id', component: ProyectoDetail },
      { path: 'prueba', component: PruebaList },
      { path: 'estadistica', component: Estadistica },
      { path: 'unauthorized', component: Unauthorized },
    ]
  },
  { path: '**', redirectTo: '' },
];
