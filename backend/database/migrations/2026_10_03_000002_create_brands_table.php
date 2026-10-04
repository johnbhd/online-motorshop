<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('brands', function (Blueprint $table): void {
            $table->id();
            $table->string('name')->unique();
            $table->text('description')->nullable();
            $table->string('status')->default('active');
            $table->timestamps();
        });

        Schema::table('products', function (Blueprint $table): void {
            $table->foreignId('brand_id')
                ->nullable()
                ->after('brand')
                ->constrained('brands');
        });

        $legacyBrands = DB::table('products')
            ->whereNotNull('brand')
            ->select('brand')
            ->distinct()
            ->get();

        foreach ($legacyBrands as $legacyBrand) {
            $name = trim((string) $legacyBrand->brand);

            if ($name === '') {
                continue;
            }

            $brandId = DB::table('brands')
                ->whereRaw('LOWER(name) = ?', [strtolower($name)])
                ->value('id');

            if (! $brandId) {
                $brandId = DB::table('brands')->insertGetId([
                    'name' => $name,
                    'status' => 'active',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }

            DB::table('products')
                ->whereRaw('LOWER(brand) = ?', [strtolower($name)])
                ->update(['brand_id' => $brandId]);
        }
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table): void {
            $table->dropForeign(['brand_id']);
            $table->dropColumn('brand_id');
        });

        Schema::dropIfExists('brands');
    }
};
