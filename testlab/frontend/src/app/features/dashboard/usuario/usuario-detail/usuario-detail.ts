import { Component, input, model, effect, inject } from '@angular/core';
import { UpdateUsuarioDto } from '../../../../models/usuario';
import { UsuarioService } from '../../../../services/usuario-service';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ToastService } from '../../../../layout/shared/toast/toast';
import { LoadingInlineComponent } from "../../../../layout/shared/loading-inline/loading-inline";
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../services/auth-service';


@Component({
  selector: 'app-usuario-detail',
  standalone: true,
  imports: [ReactiveFormsModule, LoadingInlineComponent, CommonModule],
  templateUrl: './usuario-detail.html',
  styleUrls: ['./usuario-detail.css']
})

export class UsuarioDetail {

  usuarioId = input<string | null>();                 // puede ser string o null
  modo = input<'nuevo' | 'detalle'>('detalle');       // valor por defecto: 'detalle'
  listado = model<any[]>([]);

  auth = inject(AuthService);
  // Acceso directo al rol reactivo
  role = this.auth.role;
  
  

  usuario!: UpdateUsuarioDto;
  form!: FormGroup;
  loading = true;
  proyectoId = input<string | null>(null);

  constructor(
    private _usuarioService: UsuarioService,
    private _route: ActivatedRoute,
    private _router: Router,
    private fb: FormBuilder,
    private _toastService: ToastService
  ) {

    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rol: ['', Validators.required]
    });

    effect(() => {

      this.loading = true;
      this.resetearFormulario();
      if (this.usuarioId() != null) {
        console.log('Cambia el usuario');
        this.getUsuarioById(this.usuarioId()!);
      }

      if (this.listado().length) {
        console.log('Nuevo usuario añadido al listado:', this.listado());
      }

      if (this.modo() === 'nuevo') {
        this.loading = false;
      }
    });

    effect(() => {
      if (this.role() !== 'admin') {
        this.form.disable();   // 🔥 Bloquea todos los campos
      } else {
        this.form.enable();    // Admin/manager pueden editar
      }
    });
  }

  /*** Recuperación de Usuario ***/
  getUsuarioById(id: string): void {
    this.resetearFormulario();
    this._usuarioService.getUsuarioById(id, { silent: true }).subscribe({
      next: (datos) => {
        console.log(datos);
        this.usuario = datos.data;
        this.form.setValue({
          name: this.usuario?.name,
          email: this.usuario?.email,
          password: '',
          rol: this.usuario?.rol
        });
        this.form.updateValueAndValidity();
        Object.entries(this.form.controls).forEach(([key, control]) => {
          if (this.modo() === 'detalle' && key === 'password') {
            return; // No tocar password en modo edición
          }
          

          control.markAsTouched();
          control.markAsDirty();
        });
      },
      error: (err) => {
        console.error('Error obteniendo el usuario:', err);
      }
    });
    setTimeout(() => {
      this.loading = false;
    }, 1000);
  }

  borrar(id: string | null | undefined): void {
    if (!id) {
      this._toastService.show('No hay usuarioId válido para borrar', 'error');
      console.warn('No hay usuarioId válido para borrar');
      return;
    }

    this._usuarioService.deleteUsuario(id).subscribe({
      next: data => {
        console.log("OK: ", data);
        this.listado.update(list =>
          list.filter(u => u.id !== id)
        );
        this._toastService.show('Usuario eliminado correctamente', 'success');
      },
      error: error => {
        console.log("Error: ", error);
        this._toastService.show('Error eliminando usuario', 'error');
      }
    });
  }

  onSubmit() {
    if (this.form.valid) {

      if (this.modo() === 'detalle' && this.usuarioId()) {
        this._usuarioService.updateUsuario(this.usuarioId()!, this.form.value).subscribe({
          next: () => {
            this.listado.update(list =>
              list.map(u =>
                u.id === this.usuarioId()
                  ? { ...this.form.value, id: this.usuarioId() }
                  : u
              )
            );
            this._toastService.show('Usuario actualizado correctamente', 'success');
          },
          error: (err) => {
            console.error('Error actualizando usuario:', err);
            this._toastService.show('Error actualizando usuario', 'error');
          }
        });
      } else if (this.modo() === 'nuevo') {
        this._usuarioService.createUsuario(this.form.value).subscribe({
          next: (datos) => {
          const nuevoUsuario = datos.data;

                // Si hay proyectoId, asociar al proyecto
                if (this.proyectoId()) {
                  this._usuarioService.asociarUsuarioAProyecto(this.proyectoId()!, nuevoUsuario.id)
                    .subscribe(() => {
                      this.listado.update(list => [...list, nuevoUsuario]);
                      this._toastService.show('Usuario creado y asociado correctamente', 'success');
                    });
                } else {
                  // Si no hay proyecto, solo añadir al listado
                  this.listado.update(list => [...list, nuevoUsuario]);
                  this._toastService.show('Usuario creado correctamente', 'success');
                }
              },
          error: (err) => {
            console.error('Error creando usuario:', err);
            this._toastService.show('Error creando usuario', 'error');
          }
        });
      }

      
    }
  }

  

  get formControls() {
    return this.form.controls;
  }

  resetearFormulario() {
    this.form.reset();
  }

}