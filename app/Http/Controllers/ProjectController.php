<?php

namespace App\Http\Controllers;

use App\Http\Responses\ApiResponse;
use Illuminate\Http\Request;
use App\Models\Project;


class ProjectController extends Controller
{

    public function index()
    {
        try {
            $projects = Project::all();
            return ApiResponse::success($projects);
        } catch (\Exception $e) {
            ApiResponse::notFound('Projects not found');
        }
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:255|unique:projects,name',
            'description' => 'nullable|string',
            'status'      => 'sometimes|in:active,inactive,archived'
        ]);

        try {
            $project = Project::create($validated);

            return ApiResponse::created($project, 'Project created successfully');
        } catch (\Exception $e) {
            return ApiResponse::error('Failed to create project', 500, $e->getMessage());
        }
    }

    public function show(string $id)
    {
        try {
            $project = Project::findOrFail($id);

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
                'name'        => 'sometimes|string|max:255|unique:projects,name,' . $project->id,
                'description' => 'sometimes|string',
                'status'      => 'sometimes|in:active,inactive,archived'
            ]);

            $project->update($validated);

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
}
