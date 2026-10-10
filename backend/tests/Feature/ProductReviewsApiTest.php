<?php

namespace Tests\Feature;

use App\Models\Branch;
use App\Models\Category;
use App\Models\Customer;
use App\Models\OrderRequest;
use App\Models\Product;
use App\Models\Review;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ProductReviewsApiTest extends TestCase
{
    use RefreshDatabase;

    public function createApplication()
    {
        $app = parent::createApplication();
        $app['config']->set('database.default', 'sqlite');
        $app['config']->set('database.connections.sqlite.database', ':memory:');

        return $app;
    }

    public function test_customer_can_submit_only_after_a_completed_purchase_and_cannot_submit_twice(): void
    {
        $product = $this->product('REV-001');
        $customerUser = $this->customerUser('Review Customer');
        $customer = $customerUser->customer;
        $token = $customerUser->createToken('reviews-test')->plainTextToken;

        $this->withToken($token)
            ->postJson('/api/customer/products/'.$product->part_number.'/reviews', ['rating' => 5, 'review_text' => ' Excellent fit. '])
            ->assertUnprocessable()
            ->assertJsonPath('message', 'A completed purchase is required before reviewing this product.');

        $this->completedOrder($customer, $product, $this->branch('Review Branch'));

        $this->withToken($token)
            ->getJson('/api/customer/products/'.$product->part_number.'/reviews/eligibility')
            ->assertOk()
            ->assertJsonPath('eligible', true);

        $this->withToken($token)
            ->postJson('/api/customer/products/'.$product->part_number.'/reviews', ['rating' => 5, 'review_text' => ' Excellent fit. '])
            ->assertCreated()
            ->assertJsonPath('review.status', Review::STATUS_PENDING)
            ->assertJsonPath('review.verified_purchase', true)
            ->assertJsonPath('review.review_text', 'Excellent fit.');

        $this->withToken($token)
            ->postJson('/api/customer/products/'.$product->part_number.'/reviews', ['rating' => 4, 'review_text' => 'Again'])
            ->assertStatus(409);
    }

    public function test_public_reviews_only_include_published_records_and_admin_can_moderate(): void
    {
        $product = $this->product('REV-002');
        $branch = $this->branch('Moderation Branch');
        $customer = $this->customerUser('Public Review Customer')->customer;
        $order = $this->completedOrder($customer, $product, $branch);
        $item = $order->items()->first();
        $pending = Review::create(['product_id' => $product->id, 'customer_id' => $customer->id, 'order_id' => $order->id, 'order_item_id' => $item->id, 'rating' => 2, 'review_text' => 'Pending', 'status' => Review::STATUS_PENDING, 'verified_purchase' => true]);
        $secondCustomer = $this->customerUser('Second Review Customer')->customer;
        $secondOrder = $this->completedOrder($secondCustomer, $product, $branch);
        Review::create(['product_id' => $product->id, 'customer_id' => $secondCustomer->id, 'order_id' => $secondOrder->id, 'order_item_id' => $secondOrder->items()->first()->id, 'rating' => 5, 'review_text' => 'Visible', 'status' => Review::STATUS_PUBLISHED, 'verified_purchase' => true, 'published_at' => now()]);

        $this->getJson('/api/products/'.$product->part_number.'/reviews')
            ->assertOk()
            ->assertJsonPath('summary.published', 1)
            ->assertJsonPath('summary.average_rating', 5)
            ->assertJsonCount(1, 'reviews')
            ->assertJsonPath('reviews.0.review_text', 'Visible');

        $admin = $this->adminUser('reviews-admin@example.com');
        $adminToken = $admin->createToken('reviews-admin-test')->plainTextToken;

        $this->withToken($adminToken)
            ->getJson('/api/admin/reviews')
            ->assertOk()
            ->assertJsonPath('summary.total', 2);

        $this->withToken($adminToken)
            ->patchJson('/api/admin/reviews/'.$pending->id.'/publish')
            ->assertOk()
            ->assertJsonPath('review.status', Review::STATUS_PUBLISHED);

        $this->getJson('/api/products/'.$product->part_number.'/reviews')
            ->assertJsonPath('summary.published', 2)
            ->assertJsonCount(2, 'reviews');
    }

    public function test_staff_reviews_are_branch_scoped_and_staff_can_respond_and_flag(): void
    {
        $product = $this->product('REV-003');
        $branch = $this->branch('Staff Review Branch');
        $otherBranch = $this->branch('Other Review Branch');
        $customer = $this->customerUser('Staff Review Customer')->customer;
        $order = $this->completedOrder($customer, $product, $branch);
        $item = $order->items()->first();
        $review = Review::create(['product_id' => $product->id, 'customer_id' => $customer->id, 'order_id' => $order->id, 'order_item_id' => $item->id, 'rating' => 4, 'review_text' => 'Please check this.', 'status' => Review::STATUS_PENDING, 'verified_purchase' => true]);
        $otherCustomer = $this->customerUser('Other Branch Customer')->customer;
        $otherOrder = $this->completedOrder($otherCustomer, $product, $otherBranch);
        $otherItem = $otherOrder->items()->first();
        $otherReview = Review::create(['product_id' => $product->id, 'customer_id' => $otherCustomer->id, 'order_id' => $otherOrder->id, 'order_item_id' => $otherItem->id, 'rating' => 1, 'review_text' => 'Other branch.', 'status' => Review::STATUS_PENDING, 'verified_purchase' => true]);
        $staff = $this->staffUser($branch, 'staff-review@example.com');
        $token = $staff->createToken('staff-reviews-test')->plainTextToken;

        $this->withToken($token)->getJson('/api/staff/reviews')->assertOk()->assertJsonPath('meta.total', 1);
        $this->withToken($token)->getJson('/api/staff/reviews/'.$otherReview->id)->assertNotFound();
        $this->withToken($token)->postJson('/api/staff/reviews/'.$review->id.'/response', ['response_text' => 'Thanks for your feedback.'])->assertOk()->assertJsonPath('review.response.text', 'Thanks for your feedback.');
        $this->withToken($token)->patchJson('/api/staff/reviews/'.$review->id.'/flag', ['flag_reason' => 'Needs Admin review.'])->assertOk()->assertJsonPath('review.status', Review::STATUS_FLAGGED);
    }

    private function product(string $partNumber): Product
    {
        $category = Category::create(['name' => 'Review Parts '.$partNumber, 'description' => 'Review test category', 'status' => 'active']);

        return Product::create(['category_id' => $category->id, 'name' => 'Review Product', 'part_number' => $partNumber, 'brand' => 'ALD', 'description' => 'Review product', 'price' => 100, 'img_url' => '/review.png', 'availability_status' => 'active', 'status' => 'active']);
    }

    private function branch(string $name): Branch
    {
        return Branch::create(['name' => $name, 'address' => 'Test address', 'contact_number' => '09170000000', 'pickup_available' => true, 'status' => 'active']);
    }

    private function customerUser(string $name): User
    {
        $user = User::create(['name' => $name, 'email' => strtolower(str_replace(' ', '.', $name)).uniqid().'@example.com', 'password' => Hash::make('password'), 'status' => 'active', 'role' => 'customer']);
        $user->customer()->create(['full_name' => $name, 'contact_number' => '09170000000', 'email' => $user->email]);

        return $user->fresh('customer');
    }

    private function completedOrder(Customer $customer, Product $product, Branch $branch): OrderRequest
    {
        $order = OrderRequest::create(['order_reference' => 'REV-ORDER-'.uniqid(), 'customer_id' => $customer->id, 'branch_id' => $branch->id, 'fulfillment_type' => 'pickup', 'order_status' => 'completed', 'subtotal' => 100, 'delivery_fee' => 0, 'total_amount' => 100]);
        $order->items()->create(['product_id' => $product->id, 'product_name' => $product->name, 'unit_price' => 100, 'quantity' => 1, 'subtotal' => 100]);

        return $order->fresh('items');
    }

    private function staffUser(Branch $branch, string $email): User
    {
        return User::create(['name' => 'Review Staff', 'email' => $email, 'password' => Hash::make('password'), 'branch_id' => $branch->id, 'status' => 'active', 'role' => 'staff']);
    }

    private function adminUser(string $email): User
    {
        return User::create(['name' => 'Review Admin', 'email' => $email, 'password' => Hash::make('password'), 'status' => 'active', 'role' => 'admin']);
    }
}
