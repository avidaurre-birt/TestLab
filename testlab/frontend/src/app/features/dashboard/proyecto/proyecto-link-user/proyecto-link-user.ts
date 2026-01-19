import { Component, effect, input, model } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { UsuarioService } from '../../../../services/usuario-service';
import { ActivatedRoute, Route, Router } from '@angular/router';
import { ToastService } from '../../../../layout/shared/toast/toast';
import { Usuario } from '../../../../models/usuario';
import { ProyectoService } from '../../../../services/proyecto-service';

@Component({
  selector: 'app-proyecto-link-user',
  imports: [ReactiveFormsModule],
  templateUrl: './proyecto-link-user.html',
  styleUrl: './proyecto-link-user.css',
})
export class ProyectoLinkUser {

  listado = model<any[]>([]);
  usuarios: Usuario[] = [];
  userId: string = '';

  form!: FormGroup;
  loading = true;
  proyectoId = input<string | null>(null);

  constructor(
    private _usuarioService: UsuarioService,
    private _proyectoService: ProyectoService,
    private _route: ActivatedRoute,
    private _router: Router,
    private fb: FormBuilder,
    private _toastService: ToastService
  ) {


    this.form = this.fb.group({
      userId: ['', [Validators.required]],
    });
    
    this._usuarioService.getUsuarios().subscribe({
      next: (datos) => {
        this.usuarios = datos;
      }
    })



    effect(() => {

      // this.loading = true;
      // this.form.reset({
      //     name: '',
      //     email: '',
      //     password: '',
      //     rol: ''
      // });
      // if (this.usuarioId() != null) {
      //   console.log('Cambia el usuario');
      //   this.getUsuarioById(this.usuarioId()!);
      // }

    });
  }


  onSubmit() {
    if (this.form.valid) {
      this._proyectoService.linkUsuarioToProyecto(this.proyectoId()!, this.form.value.userId).subscribe({
        next: (datos) => {
          this.listado.update(lista => datos.data.users);
          this._toastService.show('Usuario asociado correctamente', 'success');
        },
        error: (err) => {
          console.error('Error asociando usuario:', err);
          this._toastService.show('Error asociando usuario', 'error');
        }
      });
    }
  }

  

  get formControls() {
    return this.form.controls;
  }

}
