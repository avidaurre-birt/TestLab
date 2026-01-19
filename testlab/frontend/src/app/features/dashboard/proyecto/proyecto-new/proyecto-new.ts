import { Component, input, model, effect } from '@angular/core';
import { FormGroup, FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ProyectoService } from '../../../../services/proyecto-service';
import { CreateProyectoDto, Proyecto } from '../../../../models/proyecto';
import { Modal } from 'bootstrap';
import { ToastService } from '../../../../layout/shared/toast/toast';


@Component({
  selector: 'app-proyecto-new',
  imports: [ReactiveFormsModule],
  templateUrl: './proyecto-new.html',
  styleUrl: './proyecto-new.css',
})
export class ProyectoNew {

  proyectoId = input<string | null>(null);
  listado = model<any[]>([]);

  proyecto = model<Proyecto | null>(null);
  form!: FormGroup;

  modo = input<'nuevo' | 'editar'>('nuevo');

  constructor(
    private _proyectoService: ProyectoService,
    private _route: ActivatedRoute,
    private _router: Router,
    private fb: FormBuilder,
    private _toastService: ToastService
  ) {

    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      status: ['', [Validators.required]],
    });

    this.resetFormForNew();

    effect(() => {
      this.resetFormForNew();
      if (this.modo() === 'editar' && this.proyectoId()) { // Obtiene los datos y los muestra en el modal con símbolo de validado
        this._proyectoService.getProyectoById(this.proyectoId()!).subscribe(proyecto => {
          this.form.patchValue({
            name: proyecto.name,
            description: proyecto.description,
            status: proyecto.status
          });
          Object.values(this.form.controls).forEach(control => { // Recorre los campos dejándolos Touched y Dirty para que se muestre el estado
            control.markAsTouched();
            control.markAsDirty();
          });

        });
        
      }

      if (this.listado().length) {
        console.log('Nuevo proyecto añadido al listado:', this.listado);
      }
    });
  }

  onSubmit() {


    if (this.form.valid) {

      
      // -----------------------------
      // MODO EDITAR
      // -----------------------------
      if (this.modo() === 'editar' && this.proyectoId()) {
        this._proyectoService.updateProyecto(this.proyectoId()!, this.form.value)
          .subscribe({
            next: (res) => {
              // Actualizar listado padre
              this.listado.update(list =>
                list.map(p =>
                  p.id.toString() === this.proyectoId()

                    ? { ...res.data }   // Clonar para que effect detecte cambios
                    : p
                )
              );

              // Actualiza signal global
              this._proyectoService.proyectos.update(list =>
                list.map(p =>
                  p.id.toString() === this.proyectoId()
                    ? { ...res.data }   // Clonar
                    : p
                )
              );

              // Actualiza signal proyecto
              this.proyecto.update(objeto => ({ ...res.data}));

              console.log('Proyecto editado en proyecto-new.ts: ', this.proyecto());


              this._toastService.show('Proyecto actualizado correctamente', 'success');
              this.resetFormForNew();
            },
            error: (err) => {
              console.error('Error actualizando proyecto:', err);
              this._toastService.show('Error actualizando proyecto', 'error');
              this.resetFormForNew();
            }
          });

        return;
      }

      // -----------------------------
      // MODO CREAR
      // -----------------------------


      this._proyectoService.createProyecto(this.form.value).subscribe({
        next: (datos) => {
          this.listado.update((listado) => ([...listado, datos.data]));
          this._toastService.show('Proyecto creado correctamente', 'success');
          this.resetFormForNew();
        },
        error: (err) => {
          console.error('Error creando proyecto:', err);
          this._toastService.show('Error creando proyecto', 'error');
          this.resetFormForNew();
        }
      });

      const modalEl = document.getElementById('detalleModal');
      if (modalEl) {
        const modal = Modal.getInstance(modalEl);
        modal?.hide();
      }

      
    }
  }

  get formControls() {
    return this.form.controls;
  }

  resetFormForNew(): void {
    this.form.patchValue({
      name: '',
      description: '',
      status: '',
    });

    Object.values(this.form.controls).forEach(control => {
      control.markAsPristine();
      control.markAsUntouched();
    });
  }

}
