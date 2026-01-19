<?php

use App\Http\Controllers\ProjectController;
use App\Http\Controllers\TestCaseController;
use App\Http\Controllers\VersionController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\TestExecutionController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\StatisticsController;
use Illuminate\Support\Facades\Route;

//LOGIN
Route::post('/login', [AuthController::class, 'login']);

Route::get('statistics/project/{project}', [StatisticsController::class, 'byProject']);
Route::get('statistics/global', [StatisticsController::class, 'global']);
Route::get('dashboard/main', [DashboardController::class, 'mainDashboard']);

Route::middleware('auth:sanctum')->group(function () {

    Route::post('/logout', [AuthController::class, 'logout']);


    //PROJECTS
    Route::get('/projects', [ProjectController::class, 'index'])->middleware(['role:admin,manager,tester']); // Listar proyectos
    // Route::get('/projects/byrole', [ProjectController::class, 'indexByRole'])->middleware(['role:admin,manager,tester']); // Listar proyectos
    Route::post('/projects', [ProjectController::class, 'store'])->middleware(['role:admin,manager']); // Crear proyecto
    Route::get('/projects/{id}', [ProjectController::class, 'show'])->middleware(['role:admin,manager,tester']); // Ver un proyecto
    Route::put('/projects/{id}', [ProjectController::class, 'update'])->middleware(['role:admin,manager']); // Actualizar proyecto
    Route::delete('/projects/{id}', [ProjectController::class, 'destroy'])->middleware(['role:admin,manager']); // Eliminar proyecto
    Route::post('projects/{project}/users', [ProjectController::class, 'addUsers'])->middleware(['role:admin,manager']); // Anadir usuarios a un proyecto
    Route::delete('projects/{project}/users', [ProjectController::class, 'removeUsers'])->middleware(['role:admin,manager']); // Remove usuarios a un proyecto
    Route::delete('projects/{project}/users/{user}', [ProjectController::class, 'removeUser'])->middleware(['role:admin,manager']); // Remove usuario de un proyecto
    Route::post('projects/{project}/users/{user}', [ProjectController::class, 'addUser'])->middleware(['role:admin,manager']); // Add usuarios a un proyecto
    Route::get('/projects/{id}/dashboard', [ProjectController::class, 'dashboard'])->middleware(['role:admin,manager,tester']);

    //VERSIONS
    Route::get('/versions', [VersionController::class, 'index'])->middleware(['role:admin,manager,tester']); // Listar versiones
    Route::post('/versions', [VersionController::class, 'store'])->middleware(['role:admin,manager']); // Crear version
    Route::get('/versions/{id}', [VersionController::class, 'show'])->middleware(['role:admin,manager,tester']);; // Ver una version
    Route::put('/versions/{id}', [VersionController::class, 'update'])->middleware(['role:admin,manager']);; // Actualizar version
    Route::delete('/versions/{id}', [VersionController::class, 'destroy'])->middleware(['role:admin,manager']);; // Eliminar version
    Route::get('/projects/{project_id}/versions', [VersionController::class, 'getByProject'])->middleware(['role:admin,manager,tester']); // Listar versiones por proyecto


    //TESTCASE
    Route::get('/test-cases', [TestCaseController::class, 'index'])->middleware(['role:admin,manager,tester']); // Listar test-cases
    Route::post('/test-cases', [TestCaseController::class, 'store'])->middleware(['role:admin,manager,tester']); // Crear testcase
    Route::get('/test-cases/{id}', [TestCaseController::class, 'show'])->middleware(['role:admin,manager,tester']); // Ver un testcase
    Route::put('/test-cases/{id}', [TestCaseController::class, 'update'])->middleware(['role:admin,manager']); // Actualizar test-cases
    Route::delete('/test-cases/{id}', [TestCaseController::class, 'destroy'])->middleware(['role:admin,manager']); // Eliminar test-cases

    //TESTCASE-VERSION
    Route::get('/versions/{version_id}/test-cases', [TestCaseController::class, 'getByVersion'])->middleware('role:admin,manager,tester'); // Listar testcase por version
    Route::delete('/versions/{version}/test-cases/{testCase}', [VersionController::class, 'removeTestCase'])->middleware(['role:admin,manager']); // Eliminar testcase por version
    Route::post('/versions/{version}/test-cases/{testCase}', [VersionController::class, 'addTestCase'])->middleware(['role:admin,manager,tester']); // Añadir un testcase por version


    //TESTEXECUTION
    Route::get('/test-executions', [TestExecutionController::class, 'index'])->middleware(['role:admin,manager,tester']); // Listar testexecution
    Route::post('/test-executions', [TestExecutionController::class, 'store'])->middleware(['role:admin,manager,tester']); // Crear testExecution
    Route::get('/test-executions/{id}', [TestExecutionController::class, 'show'])->middleware(['role:admin,manager,tester']); // Ver un testExecution
    Route::put('/test-executions/{id}', [TestExecutionController::class, 'update'])->middleware(['role:admin,manager,tester']); // Actualizar testexecution
    Route::delete('/test-executions/{id}', [TestExecutionController::class, 'destroy'])->middleware(['role:admin,manager,tester']); // Eliminar testexecution

    Route::get('/test-executions/statistics', [TestExecutionController::class, 'statistics'])->middleware('role:admin,manager,tester'); // Obtiene estadísticas generales de ejecuciones
    Route::get('/test-executions/report/{version_id}', [TestExecutionController::class, 'report'])->middleware('role:admin,manager,tester'); // Reporte detallado de una versión



    //USUARIOS
    Route::get('/users', [UserController::class, 'index'])->middleware('role:admin,manager'); // Listar usuarios
    Route::post('/users', [UserController::class, 'store'])->middleware('role:admin'); // Crear usuario
    Route::get('/users/{id}', [UserController::class, 'show'])->middleware('role:admin,manager'); // Ver un usuario
    Route::put('/users/{id}', [UserController::class, 'update'])->middleware('role:admin'); // Actualizar usuarios
    Route::delete('/users/{id}', [UserController::class, 'destroy'])->middleware('role:admin'); // Eliminar usuario


    // ========== DASHBOARD ==========

    // Devuelve datos principales del dashboard: total de proyectos, test cases activos, tests ejecutados, aprobados, fallidos y pendientes, junto con tasas de éxito y fallo.
    Route::get('dashboard/main', [DashboardController::class, 'mainDashboard'])->middleware('role:admin,manager,tester');
    // Devuelve solo el total de proyectos existentes en el sistema.
    Route::get('dashboard/projects-total', [DashboardController::class, 'totalProjects'])->middleware('role:admin,manager,tester');
    // Devuelve la cantidad de test cases activos asociados a proyectos activos.
    Route::get('dashboard/active-test-cases', [DashboardController::class, 'activeTestCases'])->middleware('role:admin,manager,tester');
    // Devuelve la cantidad total de test executions que ya se han ejecutado.
    Route::get('dashboard/tests-executed', [DashboardController::class, 'testsExecuted'])->middleware('role:admin,manager,tester');
    // Devuelve las tasas de éxito y fallo de los tests ejecutados, junto con totales de tests aprobados, fallidos y ejecutados.
    Route::get('dashboard/success-rates', [DashboardController::class, 'successRates'])->middleware('role:admin,manager,tester');
    Route::get('/dashboard/test-cases/month-comparison', [DashboardController::class, 'getTestCasesMonthComparison'])->middleware(['role:admin,manager,tester']); // Comparación de test cases por mes actual y anterior

    
    // Añadido
    Route::get('/dashboard/last-months', [DashboardController::class, 'lastSixMonths'])->middleware('role:admin,manager,tester');

    //Añadido 2
    Route::get('/dashboard/projects', [DashboardController::class, 'getProjectStats'])->middleware('role:admin,manager,tester');
    Route::get('/dashboard/users', [DashboardController::class, 'getUserStats'])->middleware('role:admin,manager,tester');


    // ========== STATISTICS ==========

    // Devuelve estadísticas globales de todos los proyectos, incluyendo media de tests aprobados, fallidos y tests por proyecto.
    Route::get('statistics/global', [StatisticsController::class, 'global'])->middleware('role:admin,manager,tester');

    // Devuelve estadísticas de un proyecto específico: total de tests ejecutados, aprobados, fallidos y pendientes.
    Route::get('statistics/project/{project}', [StatisticsController::class, 'byProject'])->middleware('role:admin,manager,tester');
    // Devuelve información del proyecto: total de versiones y la última versión disponible.
    Route::get('statistics/project/{project}/versions', [StatisticsController::class, 'projectVersionInfo'])->middleware('role:admin,manager,tester');

    // Devuelve estadísticas de una versión específica: total de tests ejecutados, aprobados, fallidos y p
    Route::get('statistics/version/{version}', [StatisticsController::class, 'byVersion'])->middleware('role:admin,manager,tester');
    // Devuelve estadísticas de todas las versiones de un proyecto: total de ejecuciones, aprobadas, fallidas y porcentaje de éxito.
    Route::get('statistics/project/{project}/version-executions', [StatisticsController::class, 'versionExecutionStats'])->middleware('role:admin,manager,tester');

    // Devuelve estadísticas de un usuario específico: total de tests ejecutados, aprobados, fallidos, pendientes y porcentaje de éxito.
    Route::get('statistics/user/{user}', [StatisticsController::class, 'byUser'])->middleware('role:admin,manager,tester');

    // Devuelve estadísticas de tests por proyecto: total de test cases por versión, ejecutados y no ejecutados.
    Route::get('statistics/project/{project}/test-cases', [StatisticsController::class, 'byTestCase'])->middleware('role:admin,manager,tester');
});
