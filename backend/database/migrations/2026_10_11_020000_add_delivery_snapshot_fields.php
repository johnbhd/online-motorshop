<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('delivery_requests', function (Blueprint $table): void {
            $table->text('delivery_complete_address')->nullable()->after('delivery_address');
            $table->string('delivery_city_municipality')->nullable()->after('delivery_complete_address');
            $table->string('delivery_city_municipality_code', 10)->nullable()->after('delivery_city_municipality');
            $table->string('delivery_barangay')->nullable()->after('delivery_city_municipality_code');
            $table->string('delivery_barangay_code', 10)->nullable()->after('delivery_barangay');
            $table->decimal('delivery_latitude', 10, 7)->nullable()->after('delivery_barangay_code');
            $table->decimal('delivery_longitude', 10, 7)->nullable()->after('delivery_latitude');
            $table->string('delivery_contact_person')->nullable()->after('delivery_longitude');
            $table->string('delivery_contact_number')->nullable()->after('delivery_contact_person');
            $table->text('delivery_notes')->nullable()->after('delivery_contact_number');
            $table->string('vehicle_plate')->nullable()->after('rider_contact');
        });
    }

    public function down(): void
    {
        Schema::table('delivery_requests', function (Blueprint $table): void {
            $table->dropColumn([
                'delivery_complete_address',
                'delivery_city_municipality',
                'delivery_city_municipality_code',
                'delivery_barangay',
                'delivery_barangay_code',
                'delivery_latitude',
                'delivery_longitude',
                'delivery_contact_person',
                'delivery_contact_number',
                'delivery_notes',
                'vehicle_plate',
            ]);
        });
    }
};
