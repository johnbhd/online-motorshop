<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payment_settings', function (Blueprint $table): void {
            $table->text('qr_image_url')->nullable()->after('qr_image_path');
            $table->string('qr_image_public_id')->nullable()->after('qr_image_url');
        });
    }

    public function down(): void
    {
        Schema::table('payment_settings', function (Blueprint $table): void {
            $table->dropColumn(['qr_image_public_id', 'qr_image_url']);
        });
    }
};
