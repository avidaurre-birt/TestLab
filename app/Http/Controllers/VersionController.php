<?php

namespace App\Http\Controllers;

use App\Models\Version;
use App\Models\Project;
use Illuminate\Http\Request;
use App\Http\Responses\ApiResponse;

class VersionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'version_number' => 'required|string|max:20',
            'release_date'   => 'required|date',
            'description'    => 'nullable|string',
            'project_id'     => 'required|exists:projects,id',
        ]);

        // Validación manual opcional usando tu método del modelo
        if (!Version::isValidVersionNumber($validated['version_number'])) {
            return ApiResponse::error(
                'Invalid version format. Use semantic style like: 1.0.0',
                422
            );
        }

        try {
            $version = Version::create($validated);

            return ApiResponse::created($version, 'Version created successfully');
        } catch (\Exception $e) {
            return ApiResponse::error('Failed to create version', 500, $e->getMessage());
        }
    }

    /**
     * Display a specific version.
     */
    public function show(string $id)
    {
        try {
            $version = Version::findOrFail($id);

            return ApiResponse::success($version);
        } catch (\Exception $e) {
            return ApiResponse::error('Version not found', 500, $e->getMessage());
        }
    }

    /**
     * Update a specific version.
     */
    public function update(Request $request, string $id)
    {
        try {
            $version = Version::findOrFail($id);

            $validated = $request->validate([
                'version_number' => 'sometimes|string|max:20',
                'release_date'   => 'sometimes|date',
                'description'    => 'sometimes|string|nullable',
                'project_id'     => 'sometimes|exists:projects,id',
            ]);

            // Validación opcional si se envía version_number
            if (
                !empty($validated['version_number']) &&
                !Version::isValidVersionNumber($validated['version_number'])
            ) {

                return ApiResponse::error(
                    'Invalid version format. Use semantic style like: 1.0.0',
                    422
                );
            }

            $version->update($validated);

            return ApiResponse::updated($version, 'Version updated successfully');
        } catch (\Exception $e) {
            return ApiResponse::error('Failed to update version', 500, $e->getMessage());
        }
    }

    /**
     * Remove the specified version from storage.
     */
    public function destroy(string $id)
    {
        try {
            $version = Version::findOrFail($id);

            $version->delete();

            return ApiResponse::deleted('Version deleted successfully');
        } catch (\Exception $e) {
            return ApiResponse::error('Failed to delete version', 500, $e->getMessage());
        }
    }
}
