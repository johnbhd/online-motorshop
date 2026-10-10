<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->restrictOnDelete();
            $table->foreignId('customer_id')->constrained()->cascadeOnDelete();
            $table->foreignId('order_id')->constrained('order_requests')->restrictOnDelete();
            $table->foreignId('order_item_id')->constrained('order_items')->restrictOnDelete();
            $table->unsignedTinyInteger('rating');
            $table->text('review_text');
            $table->string('status')->default('pending_review');
            $table->boolean('verified_purchase')->default(true);
            $table->text('flag_reason')->nullable();
            $table->foreignId('flagged_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('flagged_at')->nullable();
            $table->text('response_text')->nullable();
            $table->foreignId('response_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('response_at')->nullable();
            $table->foreignId('moderated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('moderated_at')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamp('hidden_at')->nullable();
            $table->timestamps();
            $table->unique(['customer_id', 'product_id']);
            $table->index(['product_id', 'status']);
            $table->index(['order_id', 'order_item_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reviews');
    }
};
