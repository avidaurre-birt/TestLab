<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('versions', function (Blueprint $table) {
            $table->id();
            $table->timestamps();
            // Número de versión (v1.0, v2.1, etc.)
            $table->string('version_number', 50);

            // Fecha de lanzamiento
            $table->date('release_date')->nullable();

            // Descripción de la versión
            $table->text('description')->nullable();

            // Clave foránea hacia projects
            $table->foreignId('project_id')
                ->constrained('projects')
                ->onDelete('cascade')
                ->onUpdate('cascade');


            // Índices para mejor performance
            $table->index('version_number');
            $table->index('release_date');
            $table->index('project_id');
            $table->index(['project_id', 'release_date']);

            // Unique constraint: no puede haber dos versiones con el mismo número en el mismo proyecto
            $table->unique(['project_id', 'version_number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('versions');
    }
};
