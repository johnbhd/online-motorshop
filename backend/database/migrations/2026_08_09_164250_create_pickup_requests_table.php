<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('pickup_requests', function (Blueprint $table) {
            $table->id();

            $table->foreignId('order_id')
                ->constrained('order_requests');
            $table->foreignId('branch_id')
                ->constrained();
            $table->foreignId('assigned_staff_id')
                ->nullable()
                ->constrained('users');
            
            $table->date('pickup_date')
                ->nullable();
            $table->time('pickup_time')
                ->nullable();
            
            $table->string('pickup_status')
                ->default('pending');
            $table->string('remarks')
                ->nullable();
            $table->timestamp('completed_at')
                ->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pickup_requests');
    }
};
