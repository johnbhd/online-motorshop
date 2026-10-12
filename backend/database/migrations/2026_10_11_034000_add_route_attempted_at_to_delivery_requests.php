<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('delivery_requests', function (Blueprint $table): void {
            $table->timestamp('route_attempted_at')->nullable()->after('route_generated_at');
        });
    }

    public function down(): void
    {
        Schema::table('delivery_requests', function (Blueprint $table): void {
            $table->dropColumn('route_attempted_at');
        });
    }
};
