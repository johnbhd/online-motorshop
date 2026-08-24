<?php

namespace Database\Seeders;

use App\Models\Customer;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class CustomerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $manilaAddress = 'Manila, Philippines';

        $customers = [
            [
                'full_name' => 'User',
                'email' => 'user@gmail.com',
            ],
            [
                'full_name' => 'JB',
                'email' => 'jb@gmail.com',
            ],
            [
                'full_name' => 'Mai',
                'email' => 'mai@gmail.com',
            ],
            [
                'full_name' => 'Francis',
                'email' => 'francis@gmail.com',
            ],
            [
                'full_name' => 'Jerzel',
                'email' => 'jerzel@gmail.com',
            ],
            [
                'full_name' => 'Jadrien',
                'email' => 'jadrien@gmail.com',
            ],
            [
                'full_name' => 'Kurt',
                'email' => 'kurt@gmail.com',
            ],
            [
                'full_name' => 'Mark',
                'email' => 'mark@gmail.com',
            ],
            [
                'full_name' => 'Earl',
                'email' => 'earl@gmail.com',
            ],
            [
                'full_name' => 'Jonifer',
                'email' => 'jonifer@gmail.com',
            ],
        ];

        foreach ($customers as $customer) {
            $user = User::where('email', $customer['email'])->firstOrFail();

            Customer::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'full_name' => $customer['full_name'],
                    'contact_number' => '09' . random_int(100000000, 999999999),
                    'email' => $customer['email'],
                    'address' => $manilaAddress,
                ]
            );
        }
    }
}
