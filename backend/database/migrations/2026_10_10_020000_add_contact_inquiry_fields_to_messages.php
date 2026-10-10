<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('messages', function (Blueprint $table): void {
            $table->string('message_type')->default('text')->after('body');
            $table->json('metadata')->nullable()->after('message_type');
            $table->string('attachment_url')->nullable()->after('metadata');
            $table->string('attachment_public_id')->nullable()->after('attachment_url');
        });
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table): void {
            $table->dropColumn([
                'message_type',
                'metadata',
                'attachment_url',
                'attachment_public_id',
            ]);
        });
    }
};
