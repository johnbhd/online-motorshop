<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admin_archives', function (Blueprint $table): void {
            $table->id();
            $table->string('archive_type', 40);
            $table->unsignedBigInteger('archive_id');
            $table->foreignId('archived_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->timestamp('archived_at');
            $table->timestamps();

            $table->unique(['archive_type', 'archive_id']);
            $table->index(['archive_type', 'archived_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admin_archives');
    }
};
