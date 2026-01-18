import { Component, signal, model, effect, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, Location } from '@angular/common';

import { ProyectoService } from '../../../../services/proyecto-service';
import { VersionService } from '../../../../services/version-service';
import { EjecucionService } from '../../../../services/ejecucion-service';

import { Proyecto } from '../../../../models/proyecto';
import { Usuario } from '../../../../models/usuario';
import { Version } from '../../../../models/version';
import { Prueba } from '../../../../models/prueba';
import { Ejecucion } from '../../../../models/ejecucion';
import { ProyectoDashboard } from '../../../../models/proyectoDashboard';
import { ToastService } from '../../../../layout/shared/toast/toast';
import { AuthService } from '../../../../services/auth-service';

import { UsuarioService } from '../../../../services/usuario-service';
import { PruebaService } from '../../../../services/prueba-service';

import { ModalDetail } from '../../../../layout/shared/modal/modal-detail/modal-detail';
import { ProyectoNew } from '../proyecto-new/proyecto-new';

// import { LoadingInlineComponent } from '../../../../layout/shared/loading-inline/loading-inline';
import { LoadingComponent } from '../../../../layout/shared/loading/loading';

import { SpinnerService } from '../../../../services/spinner-service';

import { finalize } from 'rxjs/operators';
import { VersionDetail } from "../../version/version-detail/version-detail";
import { EjecucionDetail } from "../../ejecucion/ejecucion-detail/ejecucion-detail";
import { ProyectoLinkUser } from '../proyecto-link-user/proyecto-link-user';

import { Img } from '../../../../layout/shared/img/img/img';
import { ProyectoLinkTestcase } from "../proyecto-link-testcase/proyecto-link-testcase";


@Component({
  selector: 'app-proyecto-detail',
  standalone: true,
  imports: [CommonModule, ModalDetail, ProyectoNew, LoadingComponent, ProyectoLinkUser, VersionDetail, EjecucionDetail, Img, ProyectoLinkTestcase],
  templateUrl: './proyecto-detail.html',
  styleUrls: ['./proyecto-detail.css']
})
export class ProyectoDetail {

  auth = inject(AuthService);
  // Acceso directo al rol reactivo
  role = this.auth.role;
  public proyectoId = signal<string | null>(null);
  public proyecto = signal<Proyecto | null>(null);
  public usuarioEditor = localStorage.getItem('id');

  public usuarios: Usuario[] = [];
  public versiones: Version[] = [];
  public pruebas: Prueba[] = [];
  public ejecuciones: Ejecucion[] = [];

  // Mostrar más/menos
  public mostrarTodosUsuarios = false;
  public mostrarTodasVersiones = false;
  public mostrarTodasPruebas = false;
  public mostrarTodasEjecuciones = false;

  // Spinner local
  public loadingDetalle = signal(false);
  public logingUsuario = signal(false);
  public loadingVersiones = signal(false);
  public loadingPruebas = signal(false);
  public loadingEjecuciones = signal(false);

  // Estado modal
  public modal: 'proyecto' | 'usuario' | 'version' | 'prueba' | 'ejecucion' | null = null;
  public proyectoSelId = model<string | null>(null);
  public userSelId = model<string | null>(null);
  public versionSelId: string | null  = null;
  public pruebaSelId: string | null  = null;
  public ejecucionSelId =  model<string | null>(null);
  public modo: 'nuevo' | 'editar' = 'editar';
  public tituloModalDetail = '';

  // Models para vigilar y actualizar los arrays de los listados
  public listadoUsuarios = model<any[]>([]);
  public listadoVersiones = model<any[]>([]);
  public listadoPruebas = model<any[]>([]);
  public listadoEjecuciones = model<any[]>([]);

  public nuevoUser: boolean = false;
  public nuevaVersion: boolean = false;
  public nuevaPrueba: boolean = false;
  public nuevaEjecucion: boolean = false;

  // Servicios
  private _proyectoService = inject(ProyectoService);
  private _usuarioService = inject(UsuarioService);
  private _versionService = inject(VersionService);
  private _pruebaService = inject(PruebaService);
  private _ejecucionService = inject(EjecucionService);
  private _toastService = inject(ToastService);
  private _location = inject(Location);
  private _router = inject(Router);
  private _route = inject(ActivatedRoute);

  // Signal global de proyectos
  proyectos = this._proyectoService.proyectos;

  // Efecto para sincronizar el detalle cuando cambia la lista global
  actualizarProyectoEffect = effect(() => {
    const id = this.proyectoId();
    if (!id) return;

    const lista = this.proyectos();
    const actualizado = lista.find(p => p.id.toString() === id);

    if (actualizado) {
      this.proyecto.set(actualizado);
    }
  });

  constructor(
    public _spinnerService : SpinnerService
  ) {

    this._route.paramMap.subscribe(params => {
      const id = params.get('id');
      this.proyectoId.set(id);
      console.log('proyecto-detail - proyectoId: ', this.proyectoId());

      if (id) {
        this.cargarDetalle(id);
      }
    });

  }

  ngOnInit() {
    // Cargar lista global si no está cargada
    this._proyectoService.getProyectos().subscribe(); // PARA QUÉ??

  }

  // 🔵 CARGA COMPLETA DEL DETALLE CON forkJoin
  cargarDetalle(id: string) {
    this.loadingDetalle.set(true);
  
    this._proyectoService.getProyectoDashboard(id)
      .pipe(finalize(() => this.loadingDetalle.set(false)))
      .subscribe({
        next: (dashboard) => {
          // Proyecto completo
          this.proyecto.set(dashboard.project);

          // Usuarios del proyecto
          this.usuarios = dashboard.users;

          // Pruebas → vienen dentro de test cases de cada versión:
          this.pruebas = dashboard.versions_summary
            .flatMap((v: any) => v.test_cases || []);

          // Versiones del proyecto
          this.versiones = dashboard.project.versions;

          // Ejecuciones del proyecto
          this.ejecuciones = dashboard.latest_executions;
        },
        error: () => {
          this._toastService.show('No se pudo cargar el proyecto', 'error');
          this._router.navigate(['/proyecto']);
        }
      });
  }

  // CARGA de proyecto (para actualizaciones tras editar)
  cargarProyecto(id: string) {
    this.loadingDetalle.set(true);

    this._proyectoService.getProyectoById(id)
    .pipe(
      finalize(() => this.loadingDetalle.set(false))
    )
    .subscribe({
      next: (proyecto) => {
        console.log('Proyecto cargado EDITADO:', proyecto);
        this.proyecto.set(proyecto);
      },
      error: (error) => {
        console.log('Error: ', error);
        this._toastService.show('No se pudo cargar el proyecto', 'error');
        this._router.navigate(['/proyecto']);
      }
    });
  }



  /*********************** PROYECTO *************************************/

  editarProyecto() {
    this.modal = 'proyecto';
    this.modo = 'editar';
    this.proyectoSelId.set(this.proyectoId()); // el id actual
    this.tituloModalDetail = 'Editar proyecto';
  }


  eliminarProyecto() {
    const id = this.proyectoId();
    if (!id) return;

    const ok = confirm("¿Seguro que quieres eliminar este proyecto? Esta acción no se puede deshacer.");

    if (!ok) return; // El usuario canceló

    this._proyectoService.deleteProyecto(id.toString()).subscribe({
      next: () => {
        this._toastService.show('Proyecto eliminado correctamente', 'success');
        this._router.navigate(['/proyecto']);
      },
      error: (err) => {
        console.error('Error eliminando proyecto:', err);
        this._toastService.show('Error eliminando proyecto', 'error');
      }
    });
  }

  proyectoChange($e: any) {
    console.log('Proyecto editado en proyecto-detail.ts:', this.proyecto);
    this.cargarProyecto(this.proyectoId()!);
  }


  /************************ USUARIOS ********************************/

  abrirAsociarUsuario(proyectoId: string) {
    this.modal = 'usuario';
    this.proyectoSelId.set(proyectoId);
    this.tituloModalDetail = 'Asociar usuario al proyecto';

    // document.getElementById('btnAbrirModalProyecto')?.click();
  }

  listadoUsuariosChange($e: any) {
    console.log('Listado de usuarios ha cambiado:', this.usuarios);
  }

  disociarUsuario(idUsuario: string) {
    const id = this.proyectoId();   // leer el signal

    if (!id) return;                // seguridad: evitar null

    console.log('Disociando usuario', id, idUsuario);
    console.log('usuarios pre', this.usuarios);

    this._proyectoService.unlinkUsuarioFromProyecto(id, idUsuario).subscribe({
    next: () => {
        this._toastService.show('Usuario eliminado del proyecto', 'success');
      // Recargar SOLO los usuarios
      this.usuarios = this.usuarios.filter(u => u.id !== idUsuario);
      console.log('usuarios post', this.usuarios);
      },
      error: (err) => {
        console.error('Error disociando usuario del proyecto:', err);
        this._toastService.show('No se pudo eliminar el usuario', 'error');
      }
    });

  }

  /************************ VERSIONES ********************************/

  abrirNuevaVersion() {
    this.modal = 'version';
    this.modo = 'nuevo';
    this.versionSelId = null;
    this.nuevaVersion = true;
    this.tituloModalDetail = 'Nueva version';
  }

  editarVersion(versionId: string) {
    this.modal = 'version';
    this.modo = 'editar';
    this.versionSelId = versionId;
    this.nuevaVersion = false;
    this.tituloModalDetail = 'Editar version';
  }

  eliminarVersion(versionId: string) {
    this.versionSelId = versionId;
    // TODO: Modal para eliminar versión
    const ok = confirm('¿Estás seguro de eliminar esta versión?');
    if (!ok) return;
    this._versionService.deleteVersion(this.versionSelId!).subscribe({
      next: () => {
        this._toastService.show('Versión eliminada correctamente', 'success');
        this.versiones = this.versiones.filter(v => v.id !== this.versionSelId);
      },
      error: (err) => {
        console.error('Error eliminando versión:', err);
        this._toastService.show('No se pudo eliminar la versión', 'error');
      }
    });
  }

  listadoVersionesChange($e: any){
    console.log('Listado de versiones ha cambiado:', this.versiones);
    for (const v of this.versiones) {
      //
    }
  }

  /************************ PRUEBAS ********************************/

  abrirAsociarPrueba(proyectoId: string) {
    this.tituloModalDetail = 'Asociar prueba al proyecto';
    this.modal = 'prueba';
    this.proyectoSelId.set(proyectoId);

    // cargar pruebas y versiones si no las tienes ya
    this.loadingPruebas.set(true);

    this._pruebaService.getPruebas().subscribe(pruebas => {
      this.listadoPruebas.set(pruebas);
      this.loadingPruebas.set(false);
    });

    // Ya tenemos las versiones cargadas
    this.listadoVersiones.set(this.versiones);
    // document.getElementById('btnAbrirModalProyecto')?.click();

  }

  disociarPruebaDeVersion(versionId: string, testCaseId: string) {
    this._versionService.unlinkPruebaFromVersion(versionId.toString(), testCaseId).subscribe({
      next: () => {
        this._toastService.show('Prueba eliminada de la versión', 'success');

        // Actualizar listado local para prueba y version determinadas
        this.pruebas = this.pruebas.filter(
          p => !(p.id === testCaseId && p.version_id === versionId)
        );
      },
      error: (err) => {
        console.error('Error disociando prueba:', err);
        this._toastService.show('No se pudo eliminar la prueba', 'error');
      }
    });
  }

  

  listadoPruebasChange($e: any){
    console.log('Listado de pruebas ha cambiado:', this.pruebas);
    for (const p of this.pruebas) {
      //
    }
  }

  /************************ EJECUCIONES ********************************/

  abrirNuevaEjecucion(versionId: any, pruebaId: any) {
    this.modal = 'ejecucion';
    this.modo = 'nuevo';
    this.nuevaEjecucion = true;
    this.versionSelId = String(versionId);
    this.pruebaSelId = String(pruebaId);
    this.ejecucionSelId.set(null);
    
    this.listadoEjecuciones.set(this.ejecuciones);

    let versionNumber = this.versiones.find((version) => version.id == String(versionId))?.version_number;
    let tituloPrueba = this.pruebas.find((prueba) => prueba.id == String(pruebaId))?.title;

    this.tituloModalDetail = 'Nueva ejecución: ' + tituloPrueba + ' (' + versionNumber + ')';
  }

  editarEjecucion(ejecucionId: string, pruebaId: string, versionId: string) {
    this.modal = 'ejecucion';
    this.modo = 'editar';
    this.versionSelId = versionId;
    this.pruebaSelId = pruebaId;
    this.ejecucionSelId.set(ejecucionId);
    this.nuevaEjecucion = false;
    console.log('VersionId: ', versionId);

    let versionNumber = this.versiones.find((version) => version.id == String(versionId))?.version_number;
    let tituloPrueba = this.pruebas.find((prueba) => prueba.id == String(pruebaId))?.title;

    this.tituloModalDetail = 'Editar ejecución: ' + tituloPrueba + ' (' + versionNumber + ')';
  }

  eliminarEjecucion(ejecucionId: string) {
    this.ejecucionSelId.set(ejecucionId);
    // TODO: Modal para eliminar versión
    const ok = confirm('¿Estás seguro de eliminar esta ejecución?');
    if (!ok) return;
    this._ejecucionService.deleteEjecucion(this.ejecucionSelId()!).subscribe({
      next: () => {
        this._toastService.show('Ejecución eliminada correctamente', 'success');
        this.ejecuciones = this.ejecuciones.filter(e => e.id !== this.ejecucionSelId());
      },
      error: (err) => {
        console.error('Error eliminando ejecución:', err);
        this._toastService.show('No se pudo eliminar la ejecución', 'error');
      }
    });
  }

  listadoEjecucionesChange($e: any){
    console.log('Listado de ejecuciones ha cambiado:', this.ejecuciones);
    for (const e of this.ejecuciones) {
      //
    }
  }

  atras() {
    this._location.back();
  }

}