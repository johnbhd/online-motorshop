<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('customers', function (Blueprint $table): void {
            $table->string('city_municipality_code', 10)->nullable()->after('address');
            $table->string('barangay_code', 10)->nullable()->after('city_municipality_code');
            $table->string('city')->nullable()->after('barangay_code');
            $table->string('barangay')->nullable()->after('city');
        });
    }

    public function down(): void
    {
        Schema::table('customers', function (Blueprint $table): void {
            $table->dropColumn([
                'city_municipality_code',
                'barangay_code',
                'city',
                'barangay',
            ]);
        });
    }
};
