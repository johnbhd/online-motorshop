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
        Schema::create('delivery_requests', function (Blueprint $table) {
            $table->id();

            $table->foreignId('order_id')
                ->constrained('order_requests');
            $table->foreignId('branch_id')
                ->constrained();
            $table->foreignId('assigned_staff_id')
                ->nullable()
                ->constrained('users');

            $table->text('delivery_address');
            $table->decimal('delivery_fee', 10, 2)
                ->default(0);
            
            $table->string('booking_reference')
                ->nullable();
            $table->string('tracking_url')
                ->nullable();
            $table->string('rider_name')
                ->nullable();
            $table->string('rider_contact')
                ->nullable();

            $table->string('delivery_status')
                ->default('waiting_for_booking');

            $table->string('remarks')
                ->nullable();
            $table->timestamp('delivered_at')
                ->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('delivery_requests');
    }
};
