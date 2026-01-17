<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TestCase extends Model
{
    use HasFactory;

    protected $table = 'test_cases';

    protected $fillable = [
        'title',
        'objective',
        'preconditions',
        'steps',
        'expected_result',
        'user_profile',
        'created_by'
    ];

    protected $casts = [
        'steps' => 'array',
    ];

    // --- Relaciones ---


    /**
     * Un test case pertenece a más de una versión
     */
    public function versions(): BelongsToMany
    {
        return $this->belongsToMany(
            Version::class,
            'version_test_cases'
        );
    }


    /*public function version(): BelongsTo
    {
        return $this->belongsTo(Version::class, 'version_id');
    }*/

    /**
     * Un test case puede tener muchas ejecuciones
     */
    public function executions(): HasMany
    {
        return $this->hasMany(TestExecution::class, 'test_case_id');
    }


    // --- Scopes útiles ---

    /**
     * Filtrar por rol del test case
     */
    public function scopeByUserProfile($query, string $profile)
    {
        return $query->where('user_profile', $profile);
    }

    /**
     * Filtrar por proyecto
     */
    /*public function scopeByVersion($query, int $versionId)
    {
        return $query->where('version_id', $versionId);
    }*/
}
