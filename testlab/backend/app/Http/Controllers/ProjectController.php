<?php

namespace App\Http\Controllers;

use App\Http\Responses\ApiResponse;
use Illuminate\Http\Request;
use App\Models\Project;
use App\Models\TestExecution;
use App\Models\User;


class ProjectController extends Controller
{
    //Listar todos los proyectos
    public function index()
    {
        try {

        $user = auth()->user();



            // Si es tester → solo proyectos donde participa
            if ($user->rol !== 'admin') {
                $projects = Project::whereHas('users', function ($q) use ($user) {
                    $q->where('user_id', $user->id);
                })->get();

                return ApiResponse::success($projects);
            }

            // Admin y manager → todos los proyectos
            $projects = Project::all();
            return ApiResponse::success($projects);

        } catch (\Exception $e) {
            return ApiResponse::notFound('Projects not found');
        }
    }

    public function store(Request $request)
    {
        return response()->json(['message' => $request->user()]);
        $validated = $request->validate([
            'name'        => 'required|string|max:255|unique:projects,name',
            'description' => 'nullable|string',
            'status'      => 'sometimes|in:active,inactive,archived',
            'user_ids'    => 'sometimes|array',
            'user_ids.*'  => 'exists:users,id'
        ]);

        try {
            $project = Project::create([
                'name' => $validated['name'],
                'description' => $validated['description'],
                'status' => $validated['status'] ?? 'active',
                'created_by' => $request->user()->id
            ]);
            if (!empty($validated['user_ids'])) {
                $project->users()->sync($validated['user_ids']);
            }

            // Si el user es manager, asocia al creador al proyecto recien creado
            if($request->user()->rol === 'manager') {
                $project->users()->sync($request->user()->id);
            }
            

            return ApiResponse::created($project, 'Project created successfully');
        } catch (\Exception $e) {
            return ApiResponse::error('Failed to create project', 500, $e->getMessage());
        }
    }


    public function show(Request $request, string $id)
    {
        try {
            
            $project = Project::findOrFail($id);
        
            // Check if the user is an admin or is associated with the project or is the creator
            $isAdmin = $request->user()->rol === 'admin';
            $isCreator = $request->user()->id === $project->created_by;
            $isAssociated = $project->users->contains($request->user()->id);

            if (!$isAdmin && !$isCreator && !$isAssociated) {
                return ApiResponse::error('Not authorized', 500);
            }

            return ApiResponse::success($project);
        } catch (\Exception $e) {
            return ApiResponse::notFound('Project not found');
        }
    }

    public function update(Request $request, string $id)
    {
        try {
            $project = Project::findOrFail($id);

            $validated = $request->validate([
                'name'        => 'sometimes|required|string|max:255|unique:projects,name,' . $project->id,
                'description' => 'sometimes|string',
                'status'      => 'sometimes|in:active,inactive,archived',
                'user_ids'    => 'sometimes|array', // usuarios a asignar
                'user_ids.*'  => 'exists:users,id'
            ]);

            $projectData = collect($validated)->except('user_ids')->toArray();

            $project->update($projectData);

            if (array_key_exists('user_ids', $validated)) {
                $project->users()->sync($validated['user_ids']);
            }

            return ApiResponse::updated($project, 'Project updated successfully');
        } catch (\Exception $e) {
            return ApiResponse::error('Failed to update project', 500, $e->getMessage());
        }
    }

    public function destroy(string $id)
    {
        try {
            $project = Project::findOrFail($id);

            if ($project->versions()->exists()) {
                return ApiResponse::conflict(
                    'Cannot delete project with existing versions. Please delete versions first.'
                );
            }

            $project->delete();

            return ApiResponse::deleted('Project deleted successfully');
        } catch (\Exception $e) {

            return ApiResponse::error('Failed to delete project', 500, $e->getMessage());
        }
    }

    //------ Assignacion de usuarios ------//

    // Añadir usuarios sin eliminar existentes
    public function addUser(Project $project, User $user)
    {
        try {
            $project->users()->syncWithoutDetaching([$user->id]);

            return ApiResponse::success(
                $project->load('users'),
                'User assigned successfully'
            );

        } catch (\Exception $e) {
            return ApiResponse::error('Failed to assign user', 500, $e->getMessage());
        }
    }

        // Remover usuarios
        public function removeUsers(Request $request, Project $project)
        {
            $validated = $request->validate([
                'user_id'   => 'required|exists:users,id',
            ]);

            try {
                $project->users()->detach($validated['user_id']); // elimina solo los indicados
                return ApiResponse::success($project->load('users'), 'Users removed successfully');
            } catch (\Exception $e) {
                return ApiResponse::error('Failed to remove users', 500, $e->getMessage());
            }
        }

    public function removeUser(Project $project, User $user)
    {
        $project->users()->detach($user->id);

        // Recargar desde BD, no desde la relación cacheada
        $project->load('users');

        return ApiResponse::success([
            'users' => $project->users()->get()->values()
        ]);
    }

    /**
     * Datos para dashboard de un proyecto
     */
    public function dashboard(Request $request, $projectId)
    {
        try {
            $project = Project::with(['versions.testCases', 'versions.testExecutions'])->findOrFail($projectId);

            // Comprobar si el usuario es admin, si es el creador o si está asociado
            $isAdmin = $request->user()->rol === 'admin';
            $isCreator = $request->user()->id === $project->created_by;
            $isAssociated = $project->users->contains($request->user()->id);

            if (!$isAdmin && !$isCreator && !$isAssociated) {
                return ApiResponse::error('Not authorized', 500);
            }
            
            $project = Project::with([
                'versions.testCases',
                'versions.testExecutions.testCase', // ← AÑADIDO
                'versions.testExecutions.user',     // ← AÑADIDO
                'users' // ← AÑADIDO
            ])->findOrFail($projectId);
            // return ApiResponse::success($projectId);

            
            
            $totalTestCases = 0;
            $totalExecutions = 0;
            $passedExecutions = 0;
            $failedExecutions = 0;


            foreach ($project->versions as $version) {
                $totalTestCases += $version->testCases->count();
                $totalExecutions += $version->testExecutions->count();
                $passedExecutions += $version->testExecutions->where('result', 'passed')->count();
                $failedExecutions += $version->testExecutions->where('result', 'failed')->count();
            }

            // Últimas 10 ejecuciones
            $latestExecutions = TestExecution::whereHas('version', function ($query) use ($projectId) {
                $query->where('project_id', $projectId);
            })
                ->with(['testCase', 'version', 'user'])
                ->orderBy('executed_at', 'desc')
                ->limit(10)
                ->get();

            return ApiResponse::success([
                'project' => $project,

                // 👥 Usuarios del proyecto
                'users' => $project->users->map(function ($user) {
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'rol' => $user->rol,
                    ];
                }),

                // 🛡 Administradores del proyecto
                'admins' => $project->users->where('rol', 'admin')->values(),

                // 📊 Métricas del proyecto
                'metrics' => [
                    'total_versions' => $project->versions->count(),
                    'total_test_cases' => $totalTestCases,
                    'total_executions' => $totalExecutions,
                    'passed_executions' => $passedExecutions,
                    'failed_executions' => $failedExecutions,
                    'success_rate' => $totalExecutions > 0
                        ? round(($passedExecutions / $totalExecutions) * 100, 2)
                        : 0
                ],

                // 🧪 Últimas ejecuciones (ya incluyen testCase, version y user)
                'latest_executions' => $latestExecutions,

                // 📦 Resumen de versiones
                'versions_summary' => $project->versions->map(function ($version) {
                    return [
                        'id' => $version->id,
                        'version_number' => $version->version_number,
                        'test_cases_count' => $version->testCases->count(),
                        'executions_count' => $version->testExecutions->count(),


                        // Test cases completos
                        'test_cases' => $version->testCases->map(function ($tc) use ($version) {
                            return [
                                'id' => $tc->id,
                                'title' => $tc->title,
                                'objective' => $tc->objective,
                                'steps' => $tc->steps,
                                'expected_result' => $tc->expected_result,
                                'user_profile' => $tc->user_profile,
                                'version_id' => $version->id,
                                'version_number' => $version->version_number,
                            ];
                        }),

                        // Ejecuciones completas con usuario y test case
                        'test_executions' => $version->testExecutions->map(function ($exec) {
                            return [
                                'id' => $exec->id,
                                'result' => $exec->result,
                                'comment' => $exec->comment,
                                'test_data' => $exec->test_data,
                                'error_status' => $exec->error_status,
                                'executed_at' => $exec->executed_at,

                                // Usuario que ejecutó
                                'user' => [
                                    'id' => $exec->user->id,
                                    'name' => $exec->user->name,
                                    'email' => $exec->user->email,
                                    'rol' => $exec->user->rol,
                                ],

                                // Test case asociado
                                'test_case' => [
                                    'id' => $exec->testCase->id,
                                    'title' => $exec->testCase->title,
                                    'objective' => $exec->testCase->objective,
                                    'steps' => $exec->testCase->steps,
                                    'expected_result' => $exec->testCase->expected_result,
                                ]
                            ];
                        }),
                    ];
                })
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return ApiResponse::notFound('Project not found');
        } catch (\Exception $e) {
            return ApiResponse::error('Failed to retrieve dashboard data', 500, $e->getMessage());
        }
    }

    public function executionsByProject($projectId)
        {
            try {
                $executions = TestExecution::whereHas('version', function ($query) use ($projectId) {
                    $query->where('project_id', $projectId);
                })
                ->with(['testCase', 'version', 'user'])
                ->orderBy('executed_at', 'desc')
                ->get();

                return ApiResponse::success($executions);
            } catch (\Exception $e) {
                return ApiResponse::error('Failed to load executions', 500, $e->getMessage());
            }
    }

}
