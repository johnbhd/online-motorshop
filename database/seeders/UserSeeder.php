<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $branch = Branch::firstOrFail();

        User::updateOrCreate(
            ['email' => 'admin@gmail.com'],
            [
                'name' => 'System Admin',
                'password' => 'admin123',
                'branch_id' => null,
                'status' => 'active',
                'role' => 'admin'
            ]
        );

        User::updateOrCreate(
            ['email' => 'staff@gmail.com'],
            [
                'name' => 'Branch Staff',
                'password' => 'staf123',
                'branch_id' => $branch->id,
                'status' => 'active',
                'role' => 'staff',
            ]
        );

        User::updateOrCreate(
            ['email' => 'user@gmail.com'],
            [
                'name' => 'User',
                'password' => 'user123',
                'branch_id' => null,
                'status' => 'active',
                'role' => 'user',
            ]
        );
    }
}
