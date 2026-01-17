<?php

namespace App\Http\Controllers;

use App\Http\Responses\ApiResponse;
use Illuminate\Http\Request;
use App\Models\TestCase;
use App\Models\Version;

class TestCaseController extends Controller
{
    public function index()
    {
        try {
            $user = auth()->user();

            // ADMIN y MANAGER → ven todos los test cases
            if ($user->rol !== 'tester') {
                $testCases = TestCase::with('versions')->get();
                return ApiResponse::success($testCases);
            }

            // TESTER → solo test cases de proyectos donde participa
            $testCases = TestCase::whereHas('versions.project.users', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })
            ->with('versions')
            ->get();

            return ApiResponse::success($testCases);

        } catch (\Exception $e) {
            return ApiResponse::notFound('Test cases not found');
        }
}

    public function show(string $id)
    {
        try {
            $testCase = TestCase::with('versions')->findOrFail($id);
            return ApiResponse::success($testCase);
        } catch (\Exception $e) {
            return ApiResponse::notFound('Test case not found');
        }
    }

    public function store(Request $request)
    {

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'objective' => 'required|string',
            'preconditions' => 'nullable|string',
            'steps' => 'required|array|min:1',
            'steps.*' => 'required|string|max:500',
            'expected_result' => 'required|string',
            'user_profile' => 'required|string|max:255',
            'version_ids' => 'required|array|min:1',
            'version_ids.*' => 'exists:versions,id'

        ]);

        $validated['created_by'] = $request->user()->id;

        try {
            /*$testCase = TestCase::create($validated);
            return ApiResponse::created($testCase, 'Test case created successfully');*/



            $testCase = TestCase::create(
                collect($validated)->except('version_ids')->toArray()
            );

            $testCase->versions()->attach($validated['version_ids']);

            // $testCase->created_by()->

            return ApiResponse::created($testCase->load('versions'));
        } catch (\Exception $e) {
            return ApiResponse::error('Failed to create test case', 500, $e->getMessage());
        }
    }



    public function update(Request $request, string $id)
    {
        try {
            $testCase = TestCase::findOrFail($id);

            if($request->user()->rol === 'admin' || $request->user()->id === $testCase->created_by) {
                $validated = $request->validate([
                    'title' => 'sometimes|string|max:255',
                    'objective' => 'sometimes|string',
                    'preconditions' => 'nullable|string',
                    'steps' => 'sometimes|array|min:1',
                    'steps.*' => 'string|max:500',
                    'expected_result' => 'sometimes|string',
                    'user_profile' => 'sometimes|string|max:255',
                    'version_ids' => 'sometimes|array|min:1',
                    'version_ids.*' => 'exists:versions,id'

                ]);

                /*$testCase->update($validated);
                return ApiResponse::updated($testCase, 'Test case updated successfully');*/


                $testCase->update(
                    collect($validated)->except('version_ids')->toArray()
                );

                if (isset($validated['version_ids'])) {
                    $testCase->versions()->sync($validated['version_ids']);
                }

                return ApiResponse::updated($testCase->load('versions'));
            }

            return ApiResponse::error('Failed to update test case', 500, 'Unauthorized');
            
        } catch (\Exception $e) {
            return ApiResponse::error('Failed to update test case', 500, $e->getMessage());
        }
    }

    public function destroy(Request $request, string $id)
    {
        try {
            $testCase = TestCase::findOrFail($id);

            // if ($testCase->testExecutions()->exists()) {
            //     return ApiResponse::conflict(
            //         'Cannot delete test case with existing test executions. Please delete executions first.'
            //     );
            // }

            if($request->user()->rol === 'admin' || $request->user()->id === $testCase->created_by) {
                $testCase->delete();
                return ApiResponse::deleted('Test case deleted successfully');
            }

            return ApiResponse::error('Failed to delete test case', 500, 'Unauthorized');

        } catch (\Exception $e) {
            return ApiResponse::error('Failed to delete test case', 500, $e->getMessage());
        }
    }


    public function getByVersion($version_id)
    {
        try {

            /*$version = Version::findOrFail($version_id);

            $testCases = TestCase::with('version')->where('version_id', $version_id)->get();

            return ApiResponse::success($testCases);*/

            $version = Version::with('testCases')->findOrFail($version_id);

            return ApiResponse::success($version->testCases);
        } catch (\Exception $e) {
            return ApiResponse::notFound('Test cases for this version not found');
        }
    }

    /**
     * Copia un test case a otra versión
     */
    public function copyToVersion(Request $request, string $id)
    {
        try {
            $testCase = TestCase::findOrFail($id);

            $validated = $request->validate([
                'version_id' => 'required|exists:versions,id'
            ]);

            // Verificar que versión destino existe
            $targetVersion = Version::findOrFail($validated['version_id']);

            // Crear copia
            $newTestCase = $testCase->replicate();
            $newTestCase->version_id = $validated['version_id'];
            $newTestCase->save();

            return ApiResponse::created($newTestCase, 'Test case copied successfully to version ' . $targetVersion->version_number);
        } catch (\Exception $e) {
            return ApiResponse::notFound('Test case or version not found');
        } catch (\Exception $e) {
            return ApiResponse::error('Failed to copy test case', 500, $e->getMessage());
        }
    }
    
}
