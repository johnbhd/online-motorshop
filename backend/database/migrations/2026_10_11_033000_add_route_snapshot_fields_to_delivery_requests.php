<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('delivery_requests', function (Blueprint $table): void {
            $table->json('route_geometry')->nullable()->after('delivery_longitude');
            $table->unsignedInteger('route_distance_meters')->nullable()->after('route_geometry');
            $table->string('route_provider')->nullable()->after('route_distance_meters');
            $table->timestamp('route_generated_at')->nullable()->after('route_provider');
        });
    }

    public function down(): void
    {
        Schema::table('delivery_requests', function (Blueprint $table): void {
            $table->dropColumn([
                'route_geometry',
                'route_distance_meters',
                'route_provider',
                'route_generated_at',
            ]);
        });
    }
};
