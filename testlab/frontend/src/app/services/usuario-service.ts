import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Usuario, CreateUsuarioDto, UpdateUsuarioDto } from '../models/usuario';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UsuarioService {

  private readonly apiUrl = environment.apiUrl;
  private readonly endpoint = '/users'; // 👈 coincide con proxy.conf.json

  constructor(private http: HttpClient) {}

  /** Obtener todos los usuarios */
  getUsuarios(): Observable<Usuario[]> {

    
    return this.http
      .get<{ success: boolean; message: string; data: Usuario[] }>(this.apiUrl + this.endpoint)
      .pipe(map(response => response.data));
  }

  getUsuarioById(id: string, options?: { silent?: boolean }): Observable<any> {
            let headers = new HttpHeaders();

    if (options?.silent) {
      headers = headers.set('X-Silent', 'true');
    }

    return this.http.get(`${this.apiUrl + this.endpoint}/${id}`, { headers });
  }

  // Obtiene el rol del usuario que está accediendo a la aplicación para permitir o restringir acceso a funciones
  // No lo guardamos en localStorage para evitar manipulación a través de las herramientas del navegador
  getUsuarioRolById(id: string): Usuario["rol"] | null {

    this.getUsuarioById(id).subscribe({
      next: (response) => {
        return response.data.rol;
      },
      error: () => {
        return null;
      }
    });

    return null;
  }

  createUsuario(dto: CreateUsuarioDto): Observable<any> {
    return this.http.post(this.apiUrl + this.endpoint, dto);
  }

  updateUsuario(id: string, dto: UpdateUsuarioDto): Observable<any> {
    return this.http.put(`${this.apiUrl + this.endpoint}/${id}`, dto);
  }

  deleteUsuario(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl + this.endpoint}/${id}`);
  }
  asociarUsuarioAProyecto(proyectoId: string, usuarioId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/projects/${proyectoId}/users/${usuarioId}`, {});
  }
}
