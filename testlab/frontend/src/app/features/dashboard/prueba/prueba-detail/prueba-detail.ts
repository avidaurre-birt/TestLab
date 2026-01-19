import { Component, input, model, effect, inject } from '@angular/core';
import { Prueba, UpdatePruebaDto } from '../../../../models/prueba';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PruebaService } from '../../../../services/prueba-service';
import { ProyectoService } from '../../../../services/proyecto-service';
import { VersionService } from '../../../../services/version-service';
import { Router } from '@angular/router';
import { Modal, Toast } from 'bootstrap';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../../layout/shared/toast/toast';
import { Version } from '../../../../models/version';
import { atLeastOneStep } from '../../../../layout/shared/validators/at-least-one-step.validator';
import { SpinnerService } from '../../../../services/spinner-service';
import { LoadingInlineComponent } from "../../../../layout/shared/loading-inline/loading-inline";
import { AuthService } from '../../../../services/auth-service';




@Component({
  selector: 'app-prueba-detail',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, LoadingInlineComponent],
  templateUrl: './prueba-detail.html',
  styleUrl: './prueba-detail.css',
})
export class PruebaDetail {

  auth = inject(AuthService);
  role = this.auth.role; // signal<string>

  loading = true;

  pruebaId = model<string | null>();
  modo = input<'nuevo' | 'detalle'>('detalle');
  listado = model<Prueba[]>([]);

  item!: Prueba;
  form!: FormGroup;

  projects: any[] = [];
  versions: Version[] = [];

  constructor(
    private _pruebaService: PruebaService,
    private _router: Router,
    private fb: FormBuilder,
    private _toastService: ToastService,
    private _projectService: ProyectoService,
    private _versionService: VersionService,
    public _spinnerService: SpinnerService
  ) {

    this.form = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(2)]],
      objective: ['', [Validators.required, Validators.minLength(5)]],
      preconditions: ['', [Validators.required, Validators.minLength(5)]],
      steps: ['', [Validators.required, Validators.minLength(10), atLeastOneStep]],
      expected_result: ['', [Validators.required, Validators.minLength(10)]],
      rol: ['', Validators.required],
      project_id: ['', Validators.required],
      version_ids: [[], Validators.required]   // CORRECTO
    });

    effect(() => {
      if (this.pruebaId()) {
        this.getItemById(this.pruebaId()!);
      }

      if (this.modo() === 'nuevo') {
        this.loading = false;
        this.resetFormForNew();
      }


    });
    effect(() => {
      if (this.role() === 'tester') {
        this.form.disable();   // Bloquea todos los campos
      } else {
        this.form.enable();    // Admin/manager pueden editar
      }
    });
  }

  ngOnInit() {
    this.loadProjects();
  }

  loadProjects() {
    this._projectService.getProyectos({ silent: true }).subscribe({
      next: (res) => this.projects = res,
      error: () => this._toastService.show('Error cargando proyectos', 'error')
    });
  }

  onProjectChange(event: any) {
    const projectId = event.target.value;

    if (!projectId) {
      this.versions = [];
      this.form.patchValue({ version_ids: [] });
      return;
    }

    this._versionService.getByProject(projectId, { silent: true }).subscribe({
      next: (res) => {
        this.versions = res.data;
        this.form.patchValue({ version_ids: [] });
      },
      error: () => this._toastService.show('Error cargando versiones', 'error')
    });
  }

  /*** Cargar prueba ***/
  getItemById(id: string): void {
    this.loading = true;
    this.resetFormForNew();

    this._pruebaService.getPruebaById(id, { silent: true }).subscribe({
      next: (res) => {
        this.item = res.data;

        // ✔ Obtener la versión desde item.versions
        const versionId = this.item.versions[0]?.id;

        if (!versionId) {
           this._toastService.show('El test case no tiene versiones asociadas', 'error');
           this.loading = false;

           this.versions = [];
           this.form.patchValue({
              title: this.item.title,
              objective: this.item.objective,
              preconditions: this.item.preconditions,
              steps: Array.isArray(this.item.steps)
                ? this.item.steps.join('\n')
                : this.item.steps,
              expected_result: this.item.expected_result,
              rol: this.item.user_profile,
              project_id: '',
              version_ids: []
            });

            this.loading = false;
            return;
        }

        // ✔ Obtener el proyecto de esa versión
        this._versionService.getVersionById(versionId, { silent: true }).subscribe(version => {
          const projectId = version.project_id;

          // ✔ Cargar versiones del proyecto
          this._versionService.getByProject(projectId, { silent: true }).subscribe(res => {
            this.versions = res.data;

            // ✔ Rellenar formulario
            this.form.setValue({
              title: this.item.title,
              objective: this.item.objective,
              preconditions: this.item.preconditions,
              steps: Array.isArray(this.item.steps)
                ? this.item.steps.join('\n')
                : this.item.steps,
              expected_result: this.item.expected_result,
              rol: this.item.user_profile,
              project_id: projectId,
              version_ids: this.item.versions.map(v => v.id)
            });

            Object.values(this.form.controls).forEach(c => {
              c.markAsTouched();
              c.markAsDirty();
            });

            this.loading = false;
          });
        });
      },
      error: () => {
        this._toastService.show('Error obteniendo la prueba', 'error');
        this.loading = false;
      }
    });
  }

  borrar(id: string | null | undefined): void {
    if (!id) return;

    this._pruebaService.deletePrueba(id).subscribe({
      next: () => {
        this.listado.update(list => list.filter(item => item.id !== id));
        this._toastService.show('Prueba eliminada correctamente', 'success');
        this.pruebaId.set(null);
      },
      error: () => this._toastService.show('Error eliminando la prueba', 'error')
    });
  }

  confirmRemoveVersion(versionId: string) {
    
    const version = this.versions.find(v => v.id === versionId);
    if (!version) return;

    const ok = confirm(`¿Seguro que quieres eliminar la versión ${version.version_number}?`);
    if (!ok) return;

    this.removeVersion(Number(versionId));
  }

  removeVersion(versionId: number) {
    const updated = this.form.value.version_ids.filter((id: number) => id !== versionId);
    this.form.patchValue({ version_ids: updated });
  }

  addVersion(event: any) {
    const versionId = Number(event.target.value);
    if (!versionId) return;

    const current = this.form.value.version_ids as number[];

    // Evitar duplicados
    if (current.includes(versionId)) return;

    this.form.patchValue({
      version_ids: [...current, versionId]
    });
  }

  toggleVersion(versionId: string, event: any) {
    const checked = event.target.checked;
    const current = this.form.value.version_ids as number[];

    if (checked) {
      // Añadir versión
      if (!current.includes(Number(versionId))) {
        this.form.patchValue({
          version_ids: [...current, Number(versionId)]
        });
      }
    } else {
      // Quitar versión
      this.form.patchValue({
        version_ids: current.filter(id => id !== Number(versionId))
      });
    }
  }

  onSubmit() {
    if (!this.form.valid) return;

    const stepsArray = this.form.value.steps
      .split(/[\n,\.]+/)
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 0);

    const payload = {
      ...this.form.value,
      user_profile: this.form.value.rol,
      steps: stepsArray
    };

    if (this.modo() === 'detalle' && this.pruebaId()) {
      this._pruebaService.updatePrueba(this.pruebaId()!, payload).subscribe({
        next: () => {
          this.listado.update(list =>
            list.map(item => item.id === this.pruebaId() ? { ...item, ...payload } : item)
          );
          this._toastService.show('Prueba actualizada correctamente', 'success');
          this.resetFormForNew();
        },
        error: () => {
          this._toastService.show('Error actualizando la prueba', 'error');
          this.resetFormForNew();
        }
      });
    } else {
      this._pruebaService.createPrueba(payload).subscribe({
        next: (res) => {
          this.listado.update(list => [...list, res.data]);
          this._toastService.show('Prueba creada correctamente', 'success');
          this.resetFormForNew();
        },
        error: () => {
          this._toastService.show('Error creando la prueba', 'error');
          this.resetFormForNew();
        }
      });
    }

    const modalEl = document.getElementById('detalleModal');
    if (modalEl) Modal.getInstance(modalEl)?.hide();
  }

  get formControls() {
    return this.form.controls;
  }

  resetFormForNew(): void {
    this.form.patchValue({
      title: '',
      objective: '',
      preconditions: '',
      steps: '',
      expected_result: '',
      rol: '',
      project_id: '',
      version_ids: []
    });

    Object.values(this.form.controls).forEach(control => {
      control.markAsPristine();
      control.markAsUntouched();
    });
  }
}