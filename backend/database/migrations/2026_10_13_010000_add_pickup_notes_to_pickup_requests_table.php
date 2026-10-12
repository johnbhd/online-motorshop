<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pickup_requests', function (Blueprint $table): void {
            $table->text('pickup_notes')->nullable()->after('remarks');
        });
    }

    public function down(): void
    {
        Schema::table('pickup_requests', function (Blueprint $table): void {
            $table->dropColumn('pickup_notes');
        });
    }
};
