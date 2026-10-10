<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table): void {
            $table->string('img_public_id')->nullable()->after('img_url');
        });

        Schema::table('payments', function (Blueprint $table): void {
            $table->string('proof_image_public_id')->nullable()->after('proof_image_url');
        });
    }

    public function down(): void
    {
        Schema::table('payments', function (Blueprint $table): void {
            $table->dropColumn('proof_image_public_id');
        });

        Schema::table('products', function (Blueprint $table): void {
            $table->dropColumn('img_public_id');
        });
    }
};
