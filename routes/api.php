<?php

use App\Http\Controllers\ProjectController;
use App\Http\Controllers\VersionController;

use Illuminate\Support\Facades\Route;


//PROJECTS
Route::get('/projects', [ProjectController::class, 'index']); // Listar proyectos
Route::post('/projects', [ProjectController::class, 'store']); // Crear proyecto
Route::get('/projects/{id}', [ProjectController::class, 'show']); // Ver una proyecto
Route::put('/projects/{id}', [ProjectController::class, 'update']); // Actualizar proyecto
Route::delete('/projects/{id}', [ProjectController::class, 'destroy']); // Eliminar proyecto


//PROJECTS
Route::get('/versions', [VersionController::class, 'index']); // Listar versiones
Route::post('/versions', [VersionController::class, 'store']); // Crear version
Route::get('/versions/{id}', [VersionController::class, 'show']); // Ver una version
Route::put('/versions/{id}', [VersionController::class, 'update']); // Actualizar version
Route::delete('/versions/{id}', [VersionController::class, 'destroy']); // Eliminar version