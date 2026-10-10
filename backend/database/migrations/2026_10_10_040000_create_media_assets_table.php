<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('media_assets', function (Blueprint $table): void {
            $table->id();
            $table->string('cloudinary_public_id')->nullable()->unique();
            $table->text('secure_url');
            $table->string('resource_type')->default('image');
            $table->string('purpose', 80);
            $table->string('linked_type', 80)->nullable();
            $table->unsignedBigInteger('linked_id')->nullable();
            $table->string('status', 40)->default('active');
            $table->string('original_filename')->nullable();
            $table->string('mime_type')->nullable();
            $table->unsignedBigInteger('bytes')->nullable();
            $table->foreignId('uploaded_by_user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->timestamp('uploaded_at')->nullable();
            $table->foreignId('deleted_by_user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();
            $table->timestamp('deleted_at')->nullable();
            $table->json('metadata')->nullable();
            $table->text('cleanup_error')->nullable();
            $table->timestamps();

            $table->index(['purpose', 'status']);
            $table->index(['linked_type', 'linked_id']);
            $table->index('uploaded_at');
        });

        $this->backfillProducts();
        $this->backfillPayments();
        $this->backfillMessages();
    }

    public function down(): void
    {
        Schema::dropIfExists('media_assets');
    }

    private function backfillProducts(): void
    {
        DB::table('products')
            ->whereNotNull('img_url')
            ->where(function ($query): void {
                $query
                    ->whereNotNull('img_public_id')
                    ->orWhere('img_url', 'like', '%res.cloudinary.com/%');
            })
            ->orderBy('id')
            ->get(['id', 'img_url', 'img_public_id', 'created_at'])
            ->each(function ($product): void {
                DB::table('media_assets')->insertOrIgnore([
                    'cloudinary_public_id' => $product->img_public_id,
                    'secure_url' => $product->img_url,
                    'resource_type' => 'image',
                    'purpose' => 'product_image',
                    'linked_type' => 'product',
                    'linked_id' => $product->id,
                    'status' => 'active',
                    'uploaded_at' => $product->created_at,
                    'created_at' => $product->created_at ?? now(),
                    'updated_at' => now(),
                ]);
            });
    }

    private function backfillPayments(): void
    {
        DB::table('payments')
            ->whereNotNull('proof_image_url')
            ->where(function ($query): void {
                $query
                    ->whereNotNull('proof_image_public_id')
                    ->orWhere('proof_image_url', 'like', '%res.cloudinary.com/%');
            })
            ->orderBy('id')
            ->get(['id', 'proof_image_url', 'proof_image_public_id', 'created_at'])
            ->each(function ($payment): void {
                DB::table('media_assets')->insertOrIgnore([
                    'cloudinary_public_id' => $payment->proof_image_public_id,
                    'secure_url' => $payment->proof_image_url,
                    'resource_type' => 'image',
                    'purpose' => 'payment_proof',
                    'linked_type' => 'payment',
                    'linked_id' => $payment->id,
                    'status' => 'active',
                    'uploaded_at' => $payment->created_at,
                    'created_at' => $payment->created_at ?? now(),
                    'updated_at' => now(),
                ]);
            });
    }

    private function backfillMessages(): void
    {
        DB::table('messages')
            ->whereNotNull('attachment_url')
            ->where(function ($query): void {
                $query
                    ->whereNotNull('attachment_public_id')
                    ->orWhere('attachment_url', 'like', '%res.cloudinary.com/%');
            })
            ->orderBy('id')
            ->get(['id', 'attachment_url', 'attachment_public_id', 'created_at'])
            ->each(function ($message): void {
                DB::table('media_assets')->insertOrIgnore([
                    'cloudinary_public_id' => $message->attachment_public_id,
                    'secure_url' => $message->attachment_url,
                    'resource_type' => 'image',
                    'purpose' => 'contact_inquiry_attachment',
                    'linked_type' => 'message',
                    'linked_id' => $message->id,
                    'status' => 'active',
                    'uploaded_at' => $message->created_at,
                    'created_at' => $message->created_at ?? now(),
                    'updated_at' => now(),
                ]);
            });
    }
};
