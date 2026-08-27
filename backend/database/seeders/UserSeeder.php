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
                'role' => 'customer',
            ]
        );

        $customers = [
            [
                'name' => 'JB',
                'email' => 'jb@gmail.com',
                'password' => 'jb123',
            ],
            [
                'name' => 'Mai',
                'email' => 'mai@gmail.com',
                'password' => 'mai123',
            ],
            [
                'name' => 'Francis',
                'email' => 'francis@gmail.com',
                'password' => 'francis123',
            ],
            [
                'name' => 'Jerzel',
                'email' => 'jerzel@gmail.com',
                'password' => 'jerzel123',
            ],
            [
                'name' => 'Jadrien',
                'email' => 'jadrien@gmail.com',
                'password' => 'jadrien123',
            ],
            [
                'name' => 'Kurt',
                'email' => 'kurt@gmail.com',
                'password' => 'kurt123',
            ],
            [
                'name' => 'Mark',
                'email' => 'mark@gmail.com',
                'password' => 'mark123',
            ],
            [
                'name' => 'Earl',
                'email' => 'earl@gmail.com',
                'password' => 'earl123',
            ],
            [
                'name' => 'Jonifer',
                'email' => 'jonifer@gmail.com',
                'password' => 'jonifer123',
            ],
        ];

        foreach ($customers as $customer) {
            User::updateOrCreate(
                ['email' => $customer['email']],
                [
                    'name' => $customer['name'],
                    'password' => $customer['password'],
                    'branch_id' => null,
                    'status' => 'active',
                    'role' => 'customer',
                ]
            );
        }
    }
}
