<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('order_requests', function (Blueprint $table): void {
            $table->string('guest_token_hash', 64)
                ->nullable()
                ->index();
        });

        Schema::table('messages', function (Blueprint $table): void {
            $table->string('event_key')
                ->nullable()
                ->unique();
            $table->timestamp('read_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('messages', function (Blueprint $table): void {
            $table->dropUnique(['event_key']);
            $table->dropColumn(['event_key', 'read_at']);
        });

        Schema::table('order_requests', function (Blueprint $table): void {
            $table->dropIndex(['guest_token_hash']);
            $table->dropColumn('guest_token_hash');
        });
    }
};
