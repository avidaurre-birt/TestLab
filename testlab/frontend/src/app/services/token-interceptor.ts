import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, finalize, timeout } from 'rxjs/operators';
import { AuthService } from './auth-service';
import { Router } from '@angular/router';
import { ToastService } from '../layout/shared/toast/toast';
import { SpinnerService } from './spinner-service';


@Injectable()
export class TokenInterceptor implements HttpInterceptor {

  constructor(
    private auth: AuthService,
    private router: Router,
    private toast: ToastService,
    private spinner: SpinnerService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

    const token = this.auth.getToken();

    // Activar spinner
    const silent = req.headers.get('X-Silent') === 'true';

    if (!silent) {
      this.spinner.show();
    }

    // Añadir token si existe
    let cloned = req;
    if (token) {
      cloned = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      });
    }


    return next.handle(cloned).pipe(

      // ⏳ Timeout global para cualquier petición
      // timeout(10000), // 10 segundos, ajustable

      catchError((error: HttpErrorResponse | any) => {

          // 🔴 Backend caído / sin conexión
          if (error.status === 0) {
            console.log('ERROR INTERCEPTOR:', error);
            this.toast.show('No se puede conectar con el servidor', 'error');
            return throwError(() => error);
          }



        // ⏱ Timeout
        if (error.name === 'TimeoutError') {
          this.toast.show('El servidor tardó demasiado en responder', 'error');
          return throwError(() => error);
        }

        // 401 → No autenticado (token inválido o caducado)
        if (error.status === 401 && !req.url.includes('/login')) {
          this.toast.show('Sesión expirada. Inicia sesión de nuevo.', 'error');
          this.router.navigate(['/login']);
          return throwError(() => error);
        } else if (error.status === 401 && req.url.includes('/login')) {
          this.toast.show('Credenciales inválidas', 'error');
          return throwError(() => error);
        }


        // 403 → Autenticado pero sin permisos
        if (error.status === 403) {
          this.toast.show('No tienes permiso para acceder a este recurso', 'error');
          this.router.navigate(['/unauthorized']);
          return throwError(() => error);
        }
        
        // 419 → Sesión expirada (CSRF o Sanctum)
        if (error.status === 419) {
          this.toast.show('Sesión expirada. Vuelve a iniciar sesión.', 'error');
          // this.auth.logout();
          this.router.navigate(['/login']);
        }
        if (error.status === 404) { // Probar cambiando url service. Ej.: `${this.apiUrl + this.endpoint}/'dummy'${id}`
          // Se decide en el componente el mensaje. Evita duplicidad de toasts.
          // this.toast.show('Recurso no encontrado', 'error');
          return throwError(() => error);
        }

        return throwError(() => error);
      }),

      
      // Se ejecuta SIEMPRE: éxito o error
      finalize(() => {
        console.log('Finalize');
        
        // setTimeout(() => this.spinner.hide(), 150); // Tiempo para renderizar
        this.spinner.hide();
      })

    );
  }
}