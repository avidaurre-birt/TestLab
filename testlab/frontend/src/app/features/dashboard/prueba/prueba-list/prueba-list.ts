import { Component, inject } from '@angular/core';
import { Prueba } from '../../../../models/prueba';
import { PruebaService } from '../../../../services/prueba-service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Listado } from '../../../../layout/shared/listado/listado';
import { ModalDetail } from '../../../../layout/shared/modal/modal-detail/modal-detail';
import { PruebaDetail } from '../prueba-detail/prueba-detail';
import { FormsModule } from '@angular/forms';
import { SpinnerService } from '../../../../services/spinner-service';
import { LoadingComponent } from '../../../../layout/shared/loading/loading';
import { AuthService } from '../../../../services/auth-service';


@Component({
  selector: 'app-prueba-list',
  imports: [CommonModule, FormsModule, Listado, PruebaDetail, LoadingComponent, ModalDetail],
  templateUrl: './prueba-list.html',
  standalone: true,
})
export class PruebaList {
  public pruebas: any[] = [];
  public pruebaSelId: string | null = null;
  public pruebasFiltradas: Prueba[] = [];
  public nuevaPrueba: boolean = false;
  public _filtro: string = '';
  public loading: boolean = true;

  public puedeCrearProyecto: boolean = false;
  auth = inject(AuthService);
  // Acceso directo al rol reactivo
  public role = this.auth.role;
    
  constructor(
    private _pruebaservice: PruebaService, private _router: Router, public _spinnerService: SpinnerService
  ) {
    this.obtenerPruebas();
    // this.puedeCrearProyecto = this._authService.hasPermission('crear_proyecto');
  }

  obtenerPruebas(): void {
    this._pruebaservice.getPruebas().subscribe({
      next: (response) => {
        this.pruebas = response;
        this.pruebasFiltradas = response;

        this.loading = false;

      },
      
    });

    // Enganchar evento de Bootstrap para resetear al cerrar modal
    const modalEl = document.getElementById('detalleModal');
    if (modalEl) {
      modalEl.addEventListener('hidden.bs.modal', () => {
        this.pruebaSelId = null; // reset automático
        this.nuevaPrueba = false;
      });
    }

  }

  seleccionarPrueba(id: string): void {
    this.loading = false;
    this.pruebaSelId = id;
  }

  set filtro(valor: string) {
    this._filtro = valor;
    this.pruebasFiltradas = [];
    for (const i of this.pruebas) {
      if (
        i.title.toLowerCase().includes(valor.toLowerCase()) ||
        i.objective.toLowerCase().includes(valor.toLowerCase()) ||
        i.expected_result.toLowerCase().includes(valor.toLowerCase())
      ) {
        this.pruebasFiltradas.push(i);
      }
    }
  }

  abrirNuevaPrueba() {
    this.pruebaSelId = null;   // no hay id
    this.nuevaPrueba = true;      // activar modo creación
  }


  listadoChange($e: any) {
    this.pruebasFiltradas = [];
    for (const i of this.pruebas) {
      if (this._filtro !== '') {
        if (
          i.title.toLowerCase().includes(this._filtro.toLowerCase()) ||
          i.objective.toLowerCase().includes(this._filtro.toLowerCase()) ||
          i.expected_result.toLowerCase().includes(this._filtro.toLowerCase())
        ) {
          this.pruebasFiltradas.push(i);
        }
      } else {
          this.pruebasFiltradas.push(i);
      }
    }
  }
}