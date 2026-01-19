import { Component, OnInit, signal, effect, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Proyecto } from '../../../../models/proyecto';
import { ProyectoService } from '../../../../services/proyecto-service';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Listado } from '../../../../layout/shared/listado/listado';
import { ModalDetail } from '../../../../layout/shared/modal/modal-detail/modal-detail';
import { ProyectoNew } from '../proyecto-new/proyecto-new';
import { SpinnerService } from '../../../../services/spinner-service';
import { LoadingComponent } from '../../../../layout/shared/loading/loading';
import { AuthService } from '../../../../services/auth-service';

@Component({
  selector: 'app-proyecto-list',
  imports: [CommonModule, FormsModule, Listado, ModalDetail, ProyectoNew, LoadingComponent],
  templateUrl: './proyecto-list.html',
  styleUrl: './proyecto-list.css',
})
export class ProyectoList implements OnInit {

  public proyectos: any[] = [];
  proyectoSelId = signal<string | null>(null);
  public proyectosFiltrados: Proyecto[] = [];
  public nuevoProject: boolean = false;
  public _filtro: string = '';
  abrirModalDetail = false;
  loading = true;
  puedeCrearProyecto = signal(false);

  constructor(
    private _proyectoService: ProyectoService,
    private router: Router,
    public _spinnerService: SpinnerService,
    private _authService: AuthService) {
      

      
    // Cada vez que cambia proyectoSelId → navegar al detalle
    effect(() => {
      const id = this.proyectoSelId();
      if (id) {
        this.detalleProyecto(id);
      }
      this.loading = false;
    });

    // Efectos reactivos según el rol del usuario
    effect(() => {
      // Cada vez que cambie el rol → recalcular permiso
      const puede = this._authService.hasPermission('crear_proyecto');
      this.puedeCrearProyecto.set(puede);
    });

    }

  ngOnInit(): void {
    this.loading = true;
    this._proyectoService.getProyectos().subscribe({
      next: (lista) => {
        // lista es directamente Proyecto[] gracias al map() del servicio
        this.proyectos = lista.map(p => { // Mapeamos con los atributos a enviar al componente de listar
          return {
            ...p,
            Proyecto: p.name,
            Descripción: p.description,   // backend usa "description"
            Estado: p.status
          };
        });

        this.proyectosFiltrados = this.proyectos;
      }
    });
  }

  set filtro(valor: string) {
    this._filtro = valor;
    this.proyectosFiltrados = [];
    for (const u of this.proyectos) {
      if (
        u.name.toLowerCase().includes(valor.toLowerCase()) ||
        u.description.toLowerCase().includes(valor.toLowerCase()) ||
        u.status.toLowerCase().includes(valor.toLowerCase())
      ) {
        this.proyectosFiltrados.push(u);
      }
    }
  }

  abrirNuevoProyecto() {
    this.abrirModalDetail = true;
    this.proyectoSelId.set(null);
    this.nuevoProject = true;      // activar modo creación
  }

  detalleProyecto(id: string) {
    this.abrirModalDetail = false;

    this.nuevoProject = false;
    this.router.navigate(['/proyecto', id]);
  }

   listadoChange($e: any) {
    this.proyectosFiltrados = [];
    for (const p of this.proyectos) {
      if (this._filtro !== '') {
        if (
          p.name.toLowerCase().includes(this._filtro.toLowerCase()) ||
          p.description.toLowerCase().includes(this._filtro.toLowerCase()) ||
          p.status.toLowerCase().includes(this._filtro.toLowerCase())
        ) {
          this.proyectosFiltrados.push(p);
        }
      } else {
          this.proyectosFiltrados.push(p);
      }
    }
  }
}