<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;


class Version extends Model
{
    use HasFactory;

    protected $fillable = [
        'version_number',
        'release_date',
        'description',
        'project_id'
    ];

    protected $casts = [
        'release_date' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Relación con el proyecto
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Verificar si la versión está lanzada
     */
    public function isReleased(): bool
    {
        return $this->release_date->isPast();
    }

    /**
     * Verificar si es una versión futura
     */
    public function isUpcoming(): bool
    {
        return $this->release_date->isFuture();
    }

    /**
     * Obtener versión en formato semántico (v1.0.0)
     */
    public function getSemanticVersionAttribute(): string
    {
        return "v{$this->version_number}";
    }

    /**
     * Días hasta el lanzamiento (si es futura)
     */
    public function getDaysUntilReleaseAttribute(): ?int
    {
        if ($this->isReleased()) {
            return null;
        }

        return now()->diffInDays($this->release_date, false);
    }

    /**
     * Validar formato del número de versión
     */
    public static function isValidVersionNumber(string $version): bool
    {
        return preg_match('/^\d+(\.\d+)*$/', $version) === 1;
    }
}
