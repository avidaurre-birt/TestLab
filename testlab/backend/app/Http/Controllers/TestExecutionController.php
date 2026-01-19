<?php

namespace App\Http\Controllers;

use App\Http\Responses\ApiResponse;
use Illuminate\Http\Request;
use App\Models\TestExecution;
use App\Models\TestCase;
use App\Models\Version;
use App\Http\Controllers\UserController;

class TestExecutionController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = TestExecution::with(['testCase', 'version', 'user']);

            if ($request->has('test_case_id')) {
                $query->where('test_case_id', $request->test_case_id);
            }

            if ($request->has('version_id')) {
                $query->where('version_id', $request->version_id);
            }

            if ($request->has('result')) {
                $query->where('result', $request->result);
            }

            if ($request->has('user_id')) {
                $query->where('user_id', $request->user_id);
            }

            if ($request->has('date_from')) {
                $query->whereDate('executed_at', '>=', $request->date_from);
            }

            if ($request->has('date_to')) {
                $query->whereDate('executed_at', '<=', $request->date_to);
            }

            $testExecutions = $query->orderBy('executed_at', 'desc')->get();

            return ApiResponse::success($testExecutions);
        } catch (\Exception $e) {
            return ApiResponse::error('Failed to retrieve test executions', 500, $e->getMessage());
        }
    }

    public function store(Request $request)
    { 
    
        $uc = new UserController;
        $userId = $uc->getIdFromEntityHash($request->user_id);
        $request->merge(['user_id' => $userId]);


        // Normalizar test_data
        if ($request->has('test_data')) {
            if (is_string($request->test_data)) {
                $decoded = json_decode($request->test_data, true);
                $request->merge(['test_data' => $decoded]);
            }
        }
        $validated = $request->validate([
            'test_case_id' => 'required|exists:test_cases,id',
            'version_id' => 'required|exists:versions,id',
            'user_id' => 'required|exists:users,id',
            'result' => 'required|in:passed,failed,blocked,pending',
            'comment' => 'nullable|string',
            'test_data' => 'nullable|array',
            'error_status' => 'required_if:result,failed|in:critical,high,medium,low,none',
            'correction_notes' => 'nullable|string',
            'observations' => 'nullable|string',
            'executed_at' => 'nullable|date'
        ]);

        try {
            // Si no se proporciona executed_at, usar fecha actual
            if (!isset($validated['executed_at'])) {
                $validated['executed_at'] = now();
            }

            $testExecution = TestExecution::create($validated);
            $testExecution->load(['testCase', 'version', 'user']);

            return ApiResponse::created($testExecution, 'Test execution recorded successfully');
        } catch (\Exception $e) {
            return ApiResponse::error('Failed to record test execution', 500, $e->getMessage());
        }
    }

    public function show(string $id)
    {
        try {
            $testExecution = TestExecution::with(['testCase', 'version', 'user'])->findOrFail($id);
            return ApiResponse::success($testExecution);
        } catch (\Exception $e) {
            return ApiResponse::notFound('Test execution not found');
        }
    }

    public function update(Request $request, string $id)
    {

        if ($request->has('test_data')) {
            if (is_string($request->test_data)) {
                $decoded = json_decode($request->test_data, true);
                $request->merge(['test_data' => $decoded]);
            }
        }
        try {
            $testExecution = TestExecution::findOrFail($id);

            if($request->user()->rol !== 'tester' || $request->user()->id === $testExecution->user_id) {

                $validated = $request->validate([
                    'result' => 'sometimes|in:passed,failed,blocked,pending',
                    'comment' => 'nullable|string',
                    'test_data' => 'nullable|array',
                    'error_status' => 'sometimes|in:critical,high,medium,low,none',
                    'correction_notes' => 'nullable|string',
                    'observations' => 'nullable|string',
                    'executed_at' => 'sometimes|date'
                ]);

                $testExecution->update($validated);
                $testExecution->load(['testCase', 'version', 'user']);

                return ApiResponse::updated($testExecution, 'Test execution updated successfully');
            }

            return ApiResponse::error('Failed to update test execution', 500, 'Unauthorized');
        } catch (\Exception $e) {
            return ApiResponse::error('Failed to update test execution', 500, $e->getMessage());
        }
    }

    public function destroy(Request $request, string $id)
    {
        try {
            $testExecution = TestExecution::findOrFail($id);

            if($request->user()->rol !== 'tester' || $request->user()->id === $testExecution->user_id) {
                $testExecution->delete();
                return ApiResponse::deleted('Test execution deleted successfully');
            }

            return ApiResponse::error('Failed to delete test execution', 500, 'Unauthorized');

        } catch (\Exception $e) {
            return ApiResponse::error('Failed to delete test execution', 500, $e->getMessage());
        }
    }

    /**
     * Obtener ejecuciones de un test case específico
     */
    public function getByTestCase($testCaseId)
    {
        try {
            $testCase = TestCase::findOrFail($testCaseId);

            $executions = TestExecution::with(['user', 'version'])
                ->where('test_case_id', $testCaseId)
                ->orderBy('executed_at', 'desc')
                ->get();

            return ApiResponse::success([
                'test_case' => $testCase,
                'executions' => $executions,
                'count' => $executions->count()
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return ApiResponse::notFound('Test case not found');
        } catch (\Exception $e) {
            return ApiResponse::error('Failed to retrieve test executions', 500, $e->getMessage());
        }
    }

    /**
     * Obtener ejecuciones de una versión específica
     */
    public function getByVersion($versionId)
    {
        try {
            $version = Version::findOrFail($versionId);

            $executions = TestExecution::with(['testCase', 'user'])
                ->where('version_id', $versionId)
                ->orderBy('executed_at', 'desc')
                ->get();

            return ApiResponse::success([
                'version' => $version,
                'executions' => $executions,
                'count' => $executions->count()
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return ApiResponse::notFound('Version not found');
        } catch (\Exception $e) {
            return ApiResponse::error('Failed to retrieve test executions', 500, $e->getMessage());
        }
    }
}
