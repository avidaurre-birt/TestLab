import { Component, effect, input, model } from '@angular/core';
import { UpdateEjecucionDto } from '../../../../models/ejecucion';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { EjecucionService } from '../../../../services/ejecucion-service';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastService } from '../../../../layout/shared/toast/toast';
import { Modal } from 'bootstrap';


@Component({
  selector: 'app-ejecucion-detail',
  imports: [ReactiveFormsModule],
  templateUrl: './ejecucion-detail.html',
  styleUrl: './ejecucion-detail.css',
})
export class EjecucionDetail {
  userId = input<string | null>();
  versionId = input<string | null>();
  pruebaId = input<string | null>();
  ejecucionId = input<string | null>(null);
  modo = input<string | null>();
  listado = model<any[]>([]);

  ejecucion!: UpdateEjecucionDto;
  form!: FormGroup;
  public browser = navigator.userAgent;

  constructor(
    private _ejecucionService: EjecucionService,
    private _route: ActivatedRoute,
    private _router: Router,
    private fb: FormBuilder,
    private _toastService: ToastService
  ) {
    console.log('ID ejecucion en ejecucion-detail: ', this.ejecucionId());
    console.log('Modo en ejecucion-detail: ', this.modo());
    console.log('Browser en ejecucion-detail: ', this.browser);
    this.form = this.fb.group({
      result: ['', [Validators.required, Validators.pattern('passed|failed')]],
      comment: ['', [Validators.required]],
      test_data: [[]],
      error_status: ['', [Validators.required, Validators.pattern('critical|high|medium|low|none')]],
      correction_notes: [''],
      observations: [''],
      executed_at: [this.toISOStringLocal()],
    });

    console.log('EjecucionDetail, modo: ', this.modo());

    effect(() => {
      if(this.modo() == 'nuevo') {
        console.log('Reseteo del formulario de ejecucion-detail');
        this.form.reset({
          executed_at: this.toISOStringLocal(),
        });
      }
      
      
      if (this.ejecucionId() != null && this.modo() === 'editar') {
        console.log('Cambia la ejecucion', this.ejecucionId());
        this.getEjecucionById(this.ejecucionId()!);
      }
    });
  }

  /*** Recuperación de versión ***/
  getEjecucionById(id: string): void {
    console.log('En propiedad getEjecucionById');
    this._ejecucionService.getEjecucionById(id).subscribe({
      next: (datos) => {

        console.log(datos);
        this.ejecucion = datos.data;

        const tiempoEjecucion = String(this.ejecucion?.executed_at?.substring(0, 16));
        console.log(tiempoEjecucion);
        this.form.patchValue({
          result: this.ejecucion?.result,
          comment: this.ejecucion?.comment,
          test_data: JSON.stringify(this.ejecucion.test_data, null, 2),
          error_status: this.ejecucion?.error_status,
          correction_notes: this.ejecucion?.correction_notes,
          observations: this.ejecucion?.observations,
          executed_at: tiempoEjecucion,
        });

        this.form.updateValueAndValidity();
        Object.entries(this.form.controls).forEach(([key, control]) => {
          control.markAsTouched();
          control.markAsDirty();
        });
      },
      error: (err) => {
        console.error('Error obteniendo la ejecucion:', err);
      }
    });
  }

  borrar(id: string | null | undefined): void {
    if (!id) {
      this._toastService.show('No hay ejecucionId válido para borrar', 'error');
      console.warn('No hay ejecucionId válido para borrar');
      return;
    }

    this._ejecucionService.deleteEjecucion(id).subscribe({
      next: data => {
        console.log("OK: ", data);
        this.listado.update(list =>
          list.filter(e => e.id !== id)
        );
        this._toastService.show('Ejecución eliminada correctamente', 'success');
      },
      error: error => {
        console.log("Error: ", error);
        this._toastService.show('Error eliminando ejecución', 'error');
      }
    });
  }

  onSubmit() {
    if (this.form.valid) {

      // console.log('Valores formulario', this.form.value);
      // console.log('userId: ', this.userId());
      // console.log('versionId: ', this.versionId());
      // console.log('pruebaId: ', this.pruebaId());

      this.form.value.test_case_id = this.pruebaId();
      this.form.value.version_id = this.versionId();
      this.form.value.user_id = this.userId();

      if (this.modo() === 'editar' && this.ejecucionId()) {
        this._ejecucionService.updateEjecucion(this.ejecucionId()!, this.form.value).subscribe({
          next: data => {

            // Añade los objetos extra que espera el listado original
            this.form.value.test_case = data.data.test_case;
            this.form.value.user = data.data.user;

            this.listado.update(list =>
              list.map(e =>
                e.id === this.ejecucionId()
                  ? { ...this.form.value, id: this.ejecucionId() }
                  : e
              )
            );
            this._toastService.show('Ejecución actualizada correctamente', 'success');
          },
          error: (err) => {
            console.error('Error actualizando ejecución:', err);
            this._toastService.show('Error actualizando ejecución', 'error');
          }
        });
      } else if (this.modo() === 'nuevo') {
        this.form.value.test_data = {
          browser: navigator.userAgent,
          os: this.detectarSO(),
          resolution: `${window.screen.width}x${window.screen.height}`
        };

        this._ejecucionService.createEjecucion(this.form.value).subscribe({
          next: (datos) => {
            this.listado.update((listado) => ([...listado, datos.data]));
            this._toastService.show('Ejecución creada correctamente', 'success');
          },
          error: (err) => {
            console.error('Error creando ejecución:', err);
            this._toastService.show('Error creando ejecución', 'error');
          }
        });
      }

      const modalEl = document.getElementById('detalleEjecucionModal');
      if (modalEl) {
        const modal = Modal.getInstance(modalEl);
        this.form.reset(); 
        modal?.hide();
      }

      this.resetearFormulario();
    }
  }

  get formControls() {
    return this.form.controls;
  }

  toISOStringLocal() {

    let d = null;
    d = new Date();
  
    function normalizarFecha(n: any){return (n<10?'0':'') + n}
    const fecha = d.getFullYear() + '-' + normalizarFecha(d.getMonth()+1) + '-' +
          normalizarFecha(d.getDate()) + 'T' + normalizarFecha(d.getHours()) + ':' +
          normalizarFecha(d.getMinutes());

    console.log('Fecha de toISOStringLocal: ', fecha);
  
    return fecha;
  }
  detectarSO() {
    const ua = navigator.userAgent;

    if (/Windows NT/i.test(ua)) return 'Windows';
    if (/Mac OS X/i.test(ua)) return 'macOS';
    if (/Android/i.test(ua)) return 'Android';
    if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
    if (/Linux/i.test(ua)) return 'Linux';

    return 'Unknown';
  }

  resetearFormulario() {
    this.form.reset({
        executed_at: this.toISOStringLocal(),
    });
  }
}
