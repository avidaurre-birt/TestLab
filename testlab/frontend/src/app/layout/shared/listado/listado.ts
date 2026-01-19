import { Component, input, effect, model, AfterViewInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { ViewEncapsulation } from '@angular/core';


@Component({
  selector: 'app-listado',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule
  ],
  templateUrl: './listado.html',
  styleUrl: './listado.css',
  encapsulation: ViewEncapsulation.None

})
export class Listado implements AfterViewInit {

  // Inputs reactivos
  cabeceras = input<string[]>();
  datos = input<any[]>();
  atributos = input<string[]>();

  // Modelos
  itemSelId = model<string | null>();
  abrirModal = model<boolean>(false);

  // Material Table
  dataSource = new MatTableDataSource<any>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor() {
    effect(() => {
      // Cuando cambian los datos, actualizamos la tabla
      const nuevosDatos = this.datos();
      if (nuevosDatos) {
        this.dataSource.data = nuevosDatos;
      }
    });
  }

  ngAfterViewInit() {
    // Activar paginación y ordenación
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  seleccionarItem(id: any) {
    this.itemSelId.set(id);
  }

  resetSeleccion() {
    this.itemSelId.set(null);
  }
}