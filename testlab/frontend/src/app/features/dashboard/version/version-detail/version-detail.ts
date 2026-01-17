import { Component, effect, input, model } from '@angular/core';
import { UpdateVersionDto } from '../../../../models/version';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { VersionService } from '../../../../services/version-service';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '../../../../layout/shared/toast/toast';
import { Modal } from 'bootstrap';


@Component({
  selector: 'app-version-detail',
  imports: [ReactiveFormsModule],
  templateUrl: './version-detail.html',
  styleUrl: './version-detail.css',
})
export class VersionDetail {

  versionId = input<string | null>();                 // puede ser string o null
  projectId = input<string | null>();                 // puede ser string o null
  modo = input<'nuevo' | 'editar'>('editar');       // valor por defecto: 'editar'
  listado = model<any[]>([]);

  version!: UpdateVersionDto;
  form!: FormGroup;

  constructor(
    private _versionService: VersionService,
    private _route: ActivatedRoute,
    private _router: Router,
    private fb: FormBuilder,
    private _toastService: ToastService
  ) {
    console.log('ID proyecto inicial: ', this.projectId());
    this.form = this.fb.group({
      version_number: ['', [Validators.required, Validators.minLength(2)]],
      release_date: ['', [Validators.required]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      project_id: [this.projectId()]
    });

    effect(() => {
      if (this.versionId() != null) {
        console.log('Cambia la versión', this.versionId());
        this.getVersionById(this.versionId()!);
      }

      if (this.projectId() != null) {
        console.log('Cambia projectId', this.projectId());
        this.form.setValue({
          version_number: '',
          release_date: '',
          description: '',
          project_id: this.projectId()
        });
      }

      if (this.modo() === 'nuevo') {
        // this.form.reset({
        //   version_number: '',
        //   release_date: '',
        //   description: '',
        //   // No reseteamos el id de proyecto para no perderlo
        // });
      }
    });
  }

  /*** Recuperación de versión ***/
  getVersionById(id: string): void {
    console.log('En propiedad getVersionById');
    this._versionService.getVersionById(id).subscribe({
      next: (datos) => {

        console.log(datos);
        this.version = datos;

        this.form.patchValue({
          version_number: this.version?.version_number,
          release_date: this.version?.release_date?.substring(0, 10),
          description: this.version?.description,
          project_id: this.version?.project_id
        });

        this.form.updateValueAndValidity();
        Object.entries(this.form.controls).forEach(([key, control]) => {
          control.markAsTouched();
          control.markAsDirty();
        });
      },
      error: (err) => {
        console.error('Error obteniendo la versión:', err);
      }
    });
  }

  borrar(id: string | null | undefined): void {
    if (!id) {
      this._toastService.show('No hay versionId válido para borrar', 'error');
      console.warn('No hay versionId válido para borrar');
      return;
    }

    this._versionService.deleteVersion(id).subscribe({
      next: data => {
        console.log("OK: ", data);
        this.listado.update(list =>
          list.filter(v => v.id !== id)
        );
        this._toastService.show('Versión eliminada correctamente', 'success');
      },
      error: error => {
        console.log("Error: ", error);
        this._toastService.show('Error eliminando versión', 'error');
      }
    });
  }

  onSubmit() {
    if (this.form.valid) {

      console.log('Valores formulario', this.form.value);

      if (this.modo() === 'editar' && this.versionId()) {
        this._versionService.updateVersion(this.versionId()!, this.form.value).subscribe({
          next: () => {
            this.listado.update(list =>
              list.map(v =>
                v.id === this.versionId()
                  ? { ...this.form.value, id: this.versionId() }
                  : v
              )
            );
            this._toastService.show('Versión actualizada correctamente', 'success');
          },
          error: (err) => {
            console.error('Error actualizando versión:', err);
            this._toastService.show('Error actualizando versión', 'error');
          }
        });
      } else if (this.modo() === 'nuevo') {
        this._versionService.createVersion(this.form.value).subscribe({
          next: (datos) => {
            this.listado.update((listado) => ([...listado, datos.data]));
            this._toastService.show('Versión creada correctamente', 'success');
          },
          error: (err) => {
            console.error('Error creando versión:', err);
            this._toastService.show('Error creando versión', 'error');
          }
        });
      }

      const modalEl = document.getElementById('detalleVersionModal');
      if (modalEl) {
        const modal = Modal.getInstance(modalEl);
        modal?.hide();
      }

      this.form.reset();
    }
  }

  get formControls() {
    return this.form.controls;
  }
}
