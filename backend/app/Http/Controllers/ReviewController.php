<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\OrderRequest;
use App\Models\Product;
use App\Models\Review;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class ReviewController extends Controller
{
    public function publicIndex(string $identifier): JsonResponse
    {
        $product = $this->product($identifier);

        if (! $product) {
            return response()->json(['message' => 'Product not found.'], 404);
        }

        $reviews = Review::query()
            ->where('product_id', $product->id)
            ->where('status', Review::STATUS_PUBLISHED)
            ->with(['customer.user:id,name', 'responseUser:id,name'])
            ->latest('published_at')->latest('id')->paginate(20);

        return response()->json([
            'product' => ['id' => $product->id, 'part_number' => $product->part_number],
            'summary' => $this->summary($product->id),
            'reviews' => $reviews->getCollection()->map(fn (Review $review): array => $this->payload($review, true))->values(),
            'meta' => $this->pagination($reviews),
        ]);
    }

    public function eligibility(Request $request, string $identifier): JsonResponse
    {
        $product = $this->product($identifier);
        $customer = $request->user()?->customer;

        if (! $product) {
            return response()->json(['message' => 'Product not found.'], 404);
        }
        if (! $customer) {
            return response()->json(['message' => 'Customer profile not found.'], 404);
        }

        $existing = Review::query()->where('customer_id', $customer->id)->where('product_id', $product->id)
            ->with(['product', 'order', 'responseUser:id,name'])->first();
        $completedItem = $this->completedItem($customer, $product->id);

        return response()->json([
            'eligible' => $completedItem !== null && $existing === null,
            'reason' => $existing ? 'already_reviewed' : ($completedItem ? null : 'completed_purchase_required'),
            'existing_review' => $existing ? $this->payload($existing) : null,
        ]);
    }

    public function store(Request $request, string $identifier): JsonResponse
    {
        $validated = $request->validate([
            'rating' => ['required', 'integer', 'between:1,5'],
            'review_text' => ['required', 'string', 'max:2000'],
        ]);
        $product = $this->product($identifier);
        $customer = $request->user()?->customer;

        if (! $product) {
            return response()->json(['message' => 'Product not found.'], 404);
        }
        if (! $customer) {
            return response()->json(['message' => 'Customer profile not found.'], 404);
        }

        $reviewText = trim($validated['review_text']);
        if ($reviewText === '') {
            throw ValidationException::withMessages(['review_text' => ['The review text cannot be empty.']]);
        }

        $completedItem = $this->completedItem($customer, $product->id);
        if (! $completedItem) {
            return response()->json(['message' => 'A completed purchase is required before reviewing this product.'], 422);
        }
        if (Review::query()->where('customer_id', $customer->id)->where('product_id', $product->id)->exists()) {
            return response()->json(['message' => 'You have already reviewed this product.'], 409);
        }

        $review = DB::transaction(fn (): Review => Review::create([
            'product_id' => $product->id,
            'customer_id' => $customer->id,
            'order_id' => $completedItem->order_id,
            'order_item_id' => $completedItem->id,
            'rating' => $validated['rating'],
            'review_text' => $reviewText,
            'status' => Review::STATUS_PENDING,
            'verified_purchase' => true,
        ]));
        $review->load(['product', 'customer.user:id,name', 'order.branch', 'responseUser:id,name']);

        return response()->json(['message' => 'Review submitted for moderation.', 'review' => $this->payload($review)], 201);
    }

    public function staffIndex(Request $request): JsonResponse
    {
        $staff = $request->user();
        if (! $staff?->branch_id) {
            return response()->json(['message' => 'Staff branch is not configured.'], 403);
        }

        return $this->managementIndex($request, $this->scopedQuery($staff->branch_id));
    }

    public function staffShow(Request $request, Review $review): JsonResponse
    {
        $scoped = $this->scopedQuery($request->user()?->branch_id)->find($review->id);
        if (! $scoped) {
            return response()->json(['message' => 'Review not found.'], 404);
        }

        return response()->json(['review' => $this->payload($scoped)]);
    }

    public function staffResponse(Request $request, Review $review): JsonResponse
    {
        $validated = $request->validate(['response_text' => ['required', 'string', 'max:2000']]);
        $scoped = $this->scopedQuery($request->user()?->branch_id)->find($review->id);
        if (! $scoped) {
            return response()->json(['message' => 'Review not found.'], 404);
        }

        $responseText = trim($validated['response_text']);
        if ($responseText === '') {
            throw ValidationException::withMessages(['response_text' => ['The response cannot be empty.']]);
        }

        $scoped->update(['response_text' => $responseText, 'response_user_id' => $request->user()->id, 'response_at' => now()]);
        $scoped->load(['product', 'customer.user:id,name', 'order.branch', 'responseUser:id,name']);

        return response()->json(['message' => 'Staff response saved.', 'review' => $this->payload($scoped)]);
    }

    public function staffFlag(Request $request, Review $review): JsonResponse
    {
        $validated = $request->validate(['flag_reason' => ['nullable', 'string', 'max:1000']]);
        $scoped = $this->scopedQuery($request->user()?->branch_id)->find($review->id);
        if (! $scoped) {
            return response()->json(['message' => 'Review not found.'], 404);
        }
        if ($scoped->status === Review::STATUS_HIDDEN) {
            return response()->json(['message' => 'Hidden reviews cannot be flagged.'], 422);
        }

        $scoped->update([
            'status' => Review::STATUS_FLAGGED,
            'flag_reason' => isset($validated['flag_reason']) ? trim($validated['flag_reason']) : null,
            'flagged_by' => $request->user()->id,
            'flagged_at' => now(),
        ]);
        $scoped->load(['product', 'customer.user:id,name', 'order.branch', 'responseUser:id,name']);

        return response()->json(['message' => 'Review flagged for Admin attention.', 'review' => $this->payload($scoped)]);
    }

    public function adminIndex(Request $request): JsonResponse
    {
        return $this->managementIndex($request, Review::query());
    }

    public function adminShow(Review $review): JsonResponse
    {
        $review->load(['product', 'customer.user:id,name', 'order.branch', 'responseUser:id,name']);

        return response()->json(['review' => $this->payload($review)]);
    }

    public function moderate(Request $request, Review $review, string $action): JsonResponse
    {
        $allowedActions = ['publish', 'hide', 'restore', 'resolve-flag'];
        if (! in_array($action, $allowedActions, true)) {
            return response()->json(['message' => 'Unsupported review action.'], 422);
        }

        $nextStatus = match ($action) {
            'publish' => Review::STATUS_PUBLISHED,
            'hide' => Review::STATUS_HIDDEN,
            default => Review::STATUS_PENDING,
        };
        $valid = match ($action) {
            'publish' => in_array($review->status, [Review::STATUS_PENDING, Review::STATUS_FLAGGED], true),
            'hide' => $review->status !== Review::STATUS_HIDDEN,
            'restore' => $review->status === Review::STATUS_HIDDEN,
            'resolve-flag' => $review->status === Review::STATUS_FLAGGED,
        };
        if (! $valid) {
            return response()->json(['message' => 'This review cannot take that moderation action from its current state.'], 422);
        }

        $review->update([
            'status' => $nextStatus,
            'moderated_by' => $request->user()->id,
            'moderated_at' => now(),
            'published_at' => $nextStatus === Review::STATUS_PUBLISHED ? now() : null,
            'hidden_at' => $nextStatus === Review::STATUS_HIDDEN ? now() : null,
            'flag_reason' => $action === 'resolve-flag' ? null : $review->flag_reason,
            'flagged_by' => $action === 'resolve-flag' ? null : $review->flagged_by,
            'flagged_at' => $action === 'resolve-flag' ? null : $review->flagged_at,
        ]);
        $review->load(['product', 'customer.user:id,name', 'order.branch', 'responseUser:id,name']);

        return response()->json(['message' => 'Review status updated.', 'review' => $this->payload($review)]);
    }

    private function managementIndex(Request $request, Builder $query): JsonResponse
    {
        $filters = $request->validate([
            'status' => ['sometimes', 'string', Rule::in(Review::STATUSES)],
            'search' => ['sometimes', 'string', 'max:100'],
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1', 'max:100'],
        ]);
        $this->applyFilters($query, $filters);
        $reviews = $query->with(['product:id,part_number,name', 'customer.user:id,name', 'order.branch:id,name', 'responseUser:id,name'])
            ->latest('id')->paginate($filters['per_page'] ?? 20);

        return response()->json([
            'summary' => $this->summary(null, $query),
            'reviews' => $reviews->getCollection()->map(fn (Review $review): array => $this->payload($review))->values(),
            'meta' => $this->pagination($reviews),
        ]);
    }

    private function applyFilters(Builder $query, array $filters): void
    {
        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        if (! empty($filters['search'])) {
            $term = '%'.strtolower($filters['search']).'%';
            $query->where(function (Builder $search) use ($term): void {
                $search->whereHas('customer', fn (Builder $customer) => $customer->whereRaw('LOWER(full_name) LIKE ?', [$term]))
                    ->orWhereHas('product', fn (Builder $product) => $product->whereRaw('LOWER(name) LIKE ?', [$term]))
                    ->orWhereRaw('LOWER(review_text) LIKE ?', [$term]);
            });
        }
    }

    private function scopedQuery(?int $branchId): Builder
    {
        return Review::query()->whereHas('order', fn (Builder $order) => $order->where('branch_id', $branchId))
            ->with(['product', 'customer.user:id,name', 'order.branch', 'responseUser:id,name']);
    }

    private function completedItem(Customer $customer, int $productId): mixed
    {
        return $customer->orderRequests()->where('order_status', 'completed')
            ->whereHas('items', fn (Builder $item) => $item->where('product_id', $productId))
            ->with(['items' => fn ($items) => $items->where('product_id', $productId)])
            ->latest('id')->get()->flatMap(fn (OrderRequest $order) => $order->items)->first();
    }

    private function product(string $identifier): ?Product
    {
        return Product::query()->where('status', 'active')->where('part_number', $identifier)->first();
    }

    private function summary(?int $productId = null, ?Builder $baseQuery = null): array
    {
        $query = $baseQuery ? clone $baseQuery : Review::query();
        if ($productId !== null) {
            $query->where('product_id', $productId);
        }
        $published = (clone $query)->where('status', Review::STATUS_PUBLISHED);

        return [
            'total' => (clone $query)->count(),
            'average_rating' => round((float) ($published->avg('rating') ?? 0), 1),
            'published' => (clone $query)->where('status', Review::STATUS_PUBLISHED)->count(),
            'pending_review' => (clone $query)->where('status', Review::STATUS_PENDING)->count(),
            'flagged' => (clone $query)->where('status', Review::STATUS_FLAGGED)->count(),
            'hidden' => (clone $query)->where('status', Review::STATUS_HIDDEN)->count(),
            'awaiting_reply' => (clone $query)->whereNull('response_text')->whereIn('status', [Review::STATUS_PUBLISHED, Review::STATUS_PENDING])->count(),
            'needs_admin_review' => (clone $query)->where('status', Review::STATUS_FLAGGED)->count(),
        ];
    }

    private function payload(Review $review, bool $public = false): array
    {
        $customerName = $review->customer?->full_name ?? $review->customer?->user?->name ?? 'Customer';
        $parts = array_values(array_filter(preg_split('/\s+/', trim($customerName)) ?: []));
        $initials = collect($parts)->map(fn (string $part): string => strtoupper($part[0]))->take(2)->implode('');
        $payload = [
            'id' => $review->id,
            'rating' => $review->rating,
            'review_text' => $review->review_text,
            'status' => $review->status,
            'verified_purchase' => (bool) $review->verified_purchase,
            'customer' => ['id' => $review->customer_id, 'name' => $customerName, 'initials' => $initials],
            'product' => $review->product ? ['id' => $review->product->id, 'part_number' => $review->product->part_number, 'name' => $review->product->name] : null,
            'order_reference' => $review->order?->order_reference,
            'branch' => $review->order?->branch?->name,
            'response' => $review->response_text ? ['text' => $review->response_text, 'author' => $review->responseUser?->name, 'created_at' => $review->response_at?->toISOString()] : null,
            'flag_reason' => $review->flag_reason,
            'created_at' => $review->created_at?->toISOString(),
            'published_at' => $review->published_at?->toISOString(),
            'updated_at' => $review->updated_at?->toISOString(),
        ];
        if ($public) {
            unset($payload['status'], $payload['flag_reason'], $payload['order_reference'], $payload['branch'], $payload['updated_at']);
        }

        return $payload;
    }

    private function pagination($paginator): array
    {
        return ['current_page' => $paginator->currentPage(), 'last_page' => $paginator->lastPage(), 'per_page' => $paginator->perPage(), 'total' => $paginator->total()];
    }
}
