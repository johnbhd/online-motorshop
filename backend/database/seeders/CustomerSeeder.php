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
        $user = User::where('email', 'user@gmail.com')->firstOrFail();

        Customer::updateOrCreate(
            ['user_id' => $user->id],
            [
                'full_name' => 'User',
                'contact_number' => '09323289211',
                'email' => 'user@gmail.com',
                'address' => 'Pasig, Philippines'
            ]
        );
    }
}
