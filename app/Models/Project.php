<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Project extends Model
{

    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'status'
    ];

    protected $casts = [
        // Si quieres convertir el status a un valor específico
    ];

    // Relación con versions (un proyecto tiene muchas versiones)
    public function versions()
    {
        return $this->hasMany(Version::class);
    }

    // Scope para proyectos activos
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    // Scope para proyectos archivados
    public function scopeArchived($query)
    {
        return $query->where('status', 'archived');
    }

    /**
     * Obtener la última versión del proyecto
     */
    public function getLatestVersion(): ?Version
    {
        return $this->versions()->latest('release_date')->first();
    }

    /**
     * Verificar si el proyecto tiene versiones
     */
    public function hasVersions(): bool
    {
        return $this->versions()->exists();
    }

    /**
     * Contar número de versiones
     */
    public function versionsCount(): int
    {
        return $this->versions()->count();
    }
}
