<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Project;
use App\Models\Version;
use App\Models\TestCase;
use App\Models\TestExecution;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Crear usuarios
        $admin = User::create([
            'name' => 'Admin User',
            'email' => 'admin@test.com',
            'password' => Hash::make('password123'),
            'rol' => 'admin'
        ]);

        $tester = User::create([
            'name' => 'Tester User',
            'email' => 'tester@test.com',
            'password' => Hash::make('password123'),
            'rol' => 'tester'
        ]);

        $manager = User::create([
            'name' => 'Manager User',
            'email' => 'manager@test.com',
            'password' => Hash::make('password123'),
            'rol' => 'manager'
        ]);

        // // 2. Crear proyectos
        // $project1 = Project::create([
        //     'name' => 'E-commerce Platform',
        //     'description' => 'Desarrollo de plataforma de ventas online',
        //     'status' => 'active'
        // ]);

        // $project2 = Project::create([
        //     'name' => 'Mobile App',
        //     'description' => 'Aplicación iOS y Android',
        //     'status' => 'active'
        // ]);

        // // 3. Crear versiones
        // $version1 = Version::create([
        //     'version_number' => 'v1.0',
        //     'release_date' => now()->addDays(30),
        //     'description' => 'Primera versión estable',
        //     'project_id' => $project1->id
        // ]);

        // $version2 = Version::create([
        //     'version_number' => 'v1.1',
        //     'release_date' => now()->addDays(60),
        //     'description' => 'Segunda versión con mejoras',
        //     'project_id' => $project1->id
        // ]);

        // // 4. Crear test cases
        // $testCase1 = TestCase::create([
        //     'title' => 'Login de usuario',
        //     'objective' => 'Verificar que el usuario puede iniciar sesión',
        //     'preconditions' => 'Usuario registrado, cuenta activa',
        //     'steps' => json_encode([
        //         'Navegar a página de login',
        //         'Ingresar email válido',
        //         'Ingresar contraseña correcta',
        //         'Hacer clic en Login'
        //     ]),
        //     'expected_result' => 'Usuario redirigido al dashboard',
        //     'user_profile' => 'Usuario estándar',
        //     // 'version_id' => $version1->id
        // ]);

        // $testCase2 = TestCase::create([
        //     'title' => 'Registro de nuevo usuario',
        //     'objective' => 'Verificar registro de usuario nuevo',
        //     'preconditions' => 'Email no registrado previamente',
        //     'steps' => json_encode([
        //         'Hacer clic en Registrarse',
        //         'Completar formulario',
        //         'Aceptar términos',
        //         'Hacer clic en Crear cuenta'
        //     ]),
        //     'expected_result' => 'Usuario registrado y email de confirmación enviado',
        //     'user_profile' => 'Nuevo usuario',
        //     // 'version_id' => $version1->id
        // ]);

        // // 5. Crear test executions
        // TestExecution::create([
        //     'test_case_id' => $testCase1->id,
        //     'version_id' => $version1->id,
        //     'user_id' => $tester->id,
        //     'result' => 'passed',
        //     'comment' => 'Test ejecutado correctamente',
        //     'test_data' => json_encode(['browser' => 'Chrome', 'os' => 'Windows']),
        //     'error_status' => 'none',
        //     'observations' => 'Todo funcionó como se esperaba',
        //     'executed_at' => now()->subDays(2)
        // ]);

        // TestExecution::create([
        //     'test_case_id' => $testCase1->id,
        //     'version_id' => $version1->id,
        //     'user_id' => $tester->id,
        //     'result' => 'failed',
        //     'comment' => 'El botón de login no funciona en móvil',
        //     'test_data' => json_encode(['browser' => 'Mobile Safari', 'os' => 'iOS']),
        //     'error_status' => 'high',
        //     'correction_notes' => 'Se debe ajustar el responsive design',
        //     'observations' => 'Falló en resolución móvil',
        //     'executed_at' => now()->subDays(1)
        // ]);

        // TestExecution::create([
        //     'test_case_id' => $testCase2->id,
        //     'version_id' => $version1->id,
        //     'user_id' => $admin->id,
        //     'result' => 'passed',
        //     'comment' => 'Registro exitoso',
        //     'test_data' => json_encode(['browser' => 'Firefox', 'os' => 'Linux']),
        //     'error_status' => 'none',
        //     'observations' => null,
        //     'executed_at' => now()
        // ]);

        $this->command->info('✅ Datos de prueba creados:');
        $this->command->info('   - 2 usuarios');
        // $this->command->info('   - 2 proyectos');
        // $this->command->info('   - 2 versiones');
        // $this->command->info('   - 2 test cases');
        // $this->command->info('   - 3 test executions');
    }
}