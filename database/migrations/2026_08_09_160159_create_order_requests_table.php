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
        Schema::create('order_requests', function (Blueprint $table) {
            $table->id();

            $table->string('order_reference')->unique();

            $table->foreignId('customer_id')
                ->constrained();
            $table->foreignId('branch_id')
                ->nullable()
                ->constrained();
            $table->foreignId('assigned_staff_id')
                ->nullable()
                ->constrained('users');
            
            $table->string('fulfillment_type');
            $table->string('order_status')->default('pending');
            $table->decimal('subtotal', 10, 2);
            $table->decimal('delivery_fee', 10, 2)->default(0);
            $table->decimal('total_amount', 10, 2);
            $table->string('customer_notes')->nullable();
            $table->string('staff_notes')->nullable();          

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('order_requests');
    }
};
