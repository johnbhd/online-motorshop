<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Customer;
use App\Models\DeliveryRequest;
use App\Models\OrderRequest;
use App\Models\Payment;
use App\Models\PickupRequest;
use App\Models\Review;
use App\Models\User;
use Database\Seeders\BranchSeeder;
use Database\Seeders\BrandSeeder;
use Database\Seeders\CategorySeeder;
use Database\Seeders\DemoDatasetSeeder;
use Database\Seeders\ProductSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class DemoDatasetSeederTest extends TestCase
{
    use RefreshDatabase;

    private string $previousPassword = '';

    public function createApplication()
    {
        $app = parent::createApplication();
        $app['config']->set('database.default', 'sqlite');
        $app['config']->set('database.connections.sqlite.database', ':memory:');

        return $app;
    }

    protected function setUp(): void
    {
        parent::setUp();

        $this->previousPassword = (string) getenv('DEMO_DATASET_PASSWORD');
        putenv('DEMO_DATASET_PASSWORD=demo-only-password');
        $_ENV['DEMO_DATASET_PASSWORD'] = 'demo-only-password';
        $_SERVER['DEMO_DATASET_PASSWORD'] = 'demo-only-password';

        $this->seed([BranchSeeder::class, CategorySeeder::class, BrandSeeder::class, ProductSeeder::class]);
    }

    protected function tearDown(): void
    {
        putenv($this->previousPassword === '' ? 'DEMO_DATASET_PASSWORD' : "DEMO_DATASET_PASSWORD={$this->previousPassword}");
        unset($_ENV['DEMO_DATASET_PASSWORD'], $_SERVER['DEMO_DATASET_PASSWORD']);

        parent::tearDown();
    }

    public function test_demo_dataset_has_the_requested_operational_distribution_and_is_idempotent(): void
    {
        app(DemoDatasetSeeder::class)->run();

        $this->assertDatasetShape();
        $firstCounts = $this->datasetCounts();

        app(DemoDatasetSeeder::class)->run();

        $this->assertDatasetShape();
        $this->assertSame($firstCounts, $this->datasetCounts());
    }

    private function assertDatasetShape(): void
    {
        $this->assertSame(50, OrderRequest::query()->count());
        $this->assertSame(28, PickupRequest::query()->count());
        $this->assertSame(22, DeliveryRequest::query()->count());
        $this->assertSame(38, OrderRequest::query()->where('order_status', 'completed')->count());
        $this->assertSame(12, OrderRequest::query()->whereIn('order_status', ['confirmed', 'under_review', 'pending', 'rejected', 'cancelled'])->count());
        $this->assertSame(30, Customer::query()->count());
        $this->assertSame(3, User::query()->whereIn('email', [
            'staff-cavite@gmail.com',
            'staff-makati@gmail.com',
            'staff-manila@gmail.com',
        ])->where('role', 'staff')->count());

        $this->assertSame(12, Payment::query()->where('payment_method', Payment::METHOD_PAY_AT_PICKUP)->count());
        $this->assertSame(38, Payment::query()->where('payment_method', Payment::METHOD_ONLINE_PAYMENT)->count());
        $this->assertSame(25, Review::query()->count());
        $this->assertSame(10, Review::query()->where('rating', 5)->count());
        $this->assertSame(7, Review::query()->where('rating', 4)->count());
        $this->assertSame(4, Review::query()->where('rating', 3)->count());
        $this->assertSame(3, Review::query()->where('rating', 2)->count());
        $this->assertSame(1, Review::query()->where('rating', 1)->count());
        $this->assertSame(19, Review::query()->where('status', Review::STATUS_PUBLISHED)->count());
        $this->assertSame(3, Review::query()->where('status', Review::STATUS_PENDING)->count());
        $this->assertSame(2, Review::query()->where('status', Review::STATUS_FLAGGED)->count());
        $this->assertSame(1, Review::query()->where('status', Review::STATUS_HIDDEN)->count());
        $this->assertSame(10, Review::query()->whereNotNull('response_text')->count());
        $this->assertSame(25, Review::query()->where('verified_purchase', true)->count());
        $this->assertSame(25, Review::query()->whereHas('order', fn ($query) => $query->where('order_status', 'completed'))->count());
        $this->assertSame(17, OrderRequest::query()->where('branch_id', Branch::query()->where('name', 'Imus Branch')->value('id'))->count());
        $this->assertSame(17, OrderRequest::query()->where('branch_id', Branch::query()->where('name', 'Makati Branch')->value('id'))->count());
        $this->assertSame(16, OrderRequest::query()->where('branch_id', Branch::query()->where('name', 'Manila Branch')->value('id'))->count());
        $this->assertSame(5, User::query()->where('role', 'customer')->whereHas('customer.conversations')->count());
        $this->assertSame(3, Review::query()->whereIn('status', [Review::STATUS_FLAGGED, Review::STATUS_HIDDEN])->count());

        $notificationsByRole = DB::table('notifications')
            ->join('users', 'users.id', '=', 'notifications.notifiable_id')
            ->where('notifications.notifiable_type', User::class)
            ->select('users.role', DB::raw('count(*) as total'))
            ->groupBy('users.role')
            ->pluck('total', 'role');

        $this->assertSame(66, (int) ($notificationsByRole['customer'] ?? 0));
        $this->assertSame(40, (int) ($notificationsByRole['staff'] ?? 0));
        $this->assertSame(20, (int) ($notificationsByRole['admin'] ?? 0));
    }

    /** @return array<string, int> */
    private function datasetCounts(): array
    {
        return [
            'users' => User::query()->count(),
            'customers' => Customer::query()->count(),
            'orders' => OrderRequest::query()->count(),
            'payments' => Payment::query()->count(),
            'pickups' => PickupRequest::query()->count(),
            'deliveries' => DeliveryRequest::query()->count(),
            'reviews' => Review::query()->count(),
            'notifications' => DB::table('notifications')->count(),
        ];
    }
}
