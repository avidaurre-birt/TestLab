<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Test extends Model
{
    use HasFactory;

    protected $fillable = [
        'test_case_id',
        'version_id',
        'user_id',
        'result',
        'comment',
        'test_data',
        'error_status',
        'correction_notes',
        'observations',
        'executed_at'
    ];

    protected $casts = [
        'test_data' => 'array',
        'executed_at' => 'datetime'
    ];

    // Relaciones
    /*public function testCase()
    {
        return $this->belongsTo(TestCase::class);
    }*/

    /*  public function version()
    {
        return $this->belongsTo(Version::class);
    }*/

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
