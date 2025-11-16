<?php

namespace App\Http\Responses;

class ApiResponse
{
    public static function success($data = null, string $message = 'Success', int $status = 200)
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => $data
        ], $status);
    }

    public static function created($data = null, string $message = 'Created successfully')
    {
        return self::success($data, $message, 201);
    }

    public static function updated($data = null, string $message = 'Updated successfully')
    {
        return self::success($data, $message, 200);
    }

    public static function deleted(string $message = 'Deleted successfully')
    {
        return self::success(null, $message, 200);
    }

    public static function error(string $message, int $status = 400, $errors = null)
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'errors'  => $errors
        ], $status);
    }

    public static function notFound(string $message = 'Resource not found')
    {
        return self::error($message, 404);
    }

    public static function conflict(string $message)
    {
        return self::error($message, 409);
    }
}
