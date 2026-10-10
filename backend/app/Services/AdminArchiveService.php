<?php

namespace App\Services;

use App\Models\AdminArchive;
use App\Models\Brand;
use App\Models\Branch;
use App\Models\Category;
use App\Models\Customer;
use App\Models\OrderRequest;
use App\Models\Payment;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\HttpException;

class AdminArchiveService
{
    public function __construct(private readonly CloudinaryService $cloudinaryService) {}

    /**
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    public function index(array $filters): array
    {
        $type = isset($filters['type']) && $filters['type'] !== ''
            ? (string) $filters['type']
            : null;
        $search = trim((string) ($filters['search'] ?? ''));
        $perPage = (int) ($filters['per_page'] ?? 10);
        $page = (int) ($filters['page'] ?? 1);

        $archives = AdminArchive::query()
            ->when($type !== null, fn (Builder $query): Builder => $query->where('archive_type', $type))
            ->orderByDesc('archived_at')
            ->orderByDesc('id')
            ->get();

        $items = $archives
            ->map(fn (AdminArchive $archive): array => $this->archivePayload($archive))
            ->filter(function (array $item) use ($search): bool {
                if ($search === '') {
                    return true;
                }

                return str_contains(
                    strtolower(json_encode($item, JSON_THROW_ON_ERROR)),
                    strtolower($search),
                );
            })
            ->values();

        $paginator = new LengthAwarePaginator(
            $items->forPage($page, $perPage)->values(),
            $items->count(),
            $perPage,
            $page,
            ['path' => request()->url()],
        );

        return [
            'archives' => $paginator->items(),
            'types' => $this->types(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => max(1, $paginator->lastPage()),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ];
    }

    public function archive(string $type, int $recordId, User $actor): array
    {
        $this->definition($type);
        $record = $this->resolveRecord($type, $recordId);

        if (AdminArchive::query()
            ->where('archive_type', $type)
            ->where('archive_id', $record->getKey())
            ->exists()) {
            throw new HttpException(409, 'This record is already archived.');
        }

        $archive = DB::transaction(fn (): AdminArchive => AdminArchive::query()->create([
            'archive_type' => $type,
            'archive_id' => $record->getKey(),
            'archived_by' => $actor->getKey(),
            'archived_at' => now(),
        ]));

        return $this->archivePayload($archive);
    }

    /** @return array<string, mixed> */
    public function restore(string $type, int $recordId): array
    {
        $this->definition($type);
        $archive = $this->archiveRecord($type, $recordId);
        $record = $this->resolveRecord($type, $recordId);

        $this->assertRestorable($type, $record);

        DB::transaction(fn (): bool => (bool) $archive->delete());

        return $this->restoredPayload($type, $record);
    }

    /** @return array<string, mixed> */
    public function permanentlyDelete(string $type, int $recordId): array
    {
        $this->definition($type);
        $archive = $this->archiveRecord($type, $recordId);
        $record = $this->resolveRecord($type, $recordId);

        $this->assertPermanentlyDeletable($type, $record);

        $cloudinaryPublicId = match ($type) {
            'product' => $record->img_public_id,
            'payment' => $record->proof_image_public_id,
            default => null,
        };

        DB::transaction(function () use ($archive, $record): void {
            $record->delete();
            $archive->delete();
        });

        if ($cloudinaryPublicId) {
            $this->cloudinaryService->deleteImage($cloudinaryPublicId);
        }

        return [
            'id' => (int) $recordId,
            'archive_type' => $type,
            'destination' => $this->definition($type)['destination'],
        ];
    }

    public function excludeArchived(Builder $query, string $type, string $column = 'id'): Builder
    {
        $qualifiedColumn = $query->getModel()->qualifyColumn($column);

        return $query->whereNotExists(function ($archiveQuery) use ($type, $qualifiedColumn): void {
            $archiveQuery
                ->from('admin_archives')
                ->where('archive_type', $type)
                ->whereColumn('admin_archives.archive_id', $qualifiedColumn);
        });
    }

    /** @return array<int, array<string, string>> */
    public function types(): array
    {
        return collect($this->definitions())
            ->map(fn (array $definition, string $type): array => [
                'value' => $type,
                'label' => $definition['label'],
                'destination' => $definition['destination'],
            ])
            ->values()
            ->all();
    }

    /** @return array<string, mixed> */
    private function archivePayload(AdminArchive $archive): array
    {
        $type = (string) $archive->archive_type;
        $record = $this->findRecord($type, (int) $archive->archive_id);
        $definition = $this->definition($type);

        return [
            'id' => (int) $archive->archive_id,
            'archive_id' => (int) $archive->archive_id,
            'archive_type' => $type,
            'label' => $definition['label'],
            'destination' => $definition['destination'],
            'archived_at' => $archive->archived_at?->toISOString(),
            'archived_by' => $archive->archived_by,
            'record_exists' => $record !== null,
            'record' => $record ? $this->recordSummary($type, $record) : null,
        ];
    }

    /** @return array<string, mixed> */
    private function restoredPayload(string $type, Model $record): array
    {
        return [
            'id' => (int) $record->getKey(),
            'archive_type' => $type,
            'destination' => $this->definition($type)['destination'],
            'record' => $this->recordSummary($type, $record),
        ];
    }

    /** @return array<string, mixed> */
    private function recordSummary(string $type, Model $record): array
    {
        $summary = [
            'id' => (int) $record->getKey(),
            'created_at' => $record->created_at?->toISOString(),
        ];

        return match ($type) {
            'order' => [
                ...$summary,
                'reference' => $record->order_reference,
                'title' => $record->order_reference,
                'status' => $record->order_status,
                'fulfillment_type' => $record->fulfillment_type,
                'relationships' => [
                    'items' => $record->items()->count(),
                    'payments' => $record->payments()->count(),
                    'pickup' => $record->pickupRequest()->exists(),
                    'delivery' => $record->deliveryRequest()->exists(),
                    'reviews' => $record->reviews()->count(),
                ],
            ],
            'payment' => [
                ...$summary,
                'reference' => $record->payment_reference,
                'title' => $record->payment_reference ?: 'Payment #'.$record->id,
                'status' => $record->payment_status,
                'payment_method' => $record->payment_method,
                'order_id' => $record->order_id,
            ],
            'product' => [
                ...$summary,
                'reference' => $record->part_number,
                'title' => $record->name,
                'status' => $record->status,
                'availability_status' => $record->availability_status,
                'image_url' => $record->img_url,
            ],
            'customer' => [
                ...$summary,
                'reference' => 'Customer #'.$record->id,
                'title' => $record->full_name,
                'status' => $record->user?->status,
                'email' => $record->email,
                'relationships' => [
                    'orders' => $record->orderRequests()->count(),
                    'conversations' => $record->conversations()->count(),
                    'reviews' => $record->reviews()->count(),
                ],
            ],
            'branch' => [
                ...$summary,
                'reference' => 'Branch #'.$record->id,
                'title' => $record->name,
                'status' => $record->status,
                'relationships' => [
                    'staff' => $record->users()->where('role', 'staff')->count(),
                    'orders' => $record->orderRequests()->count(),
                ],
            ],
            'staff' => [
                ...$summary,
                'reference' => 'Staff #'.$record->id,
                'title' => $record->name,
                'status' => $record->status,
                'email' => $record->email,
                'branch' => $record->branch?->name,
            ],
            'category', 'brand' => [
                ...$summary,
                'reference' => ucfirst($type).' #'.$record->id,
                'title' => $record->name,
                'status' => $record->status,
                'relationships' => [
                    'products' => $record->products()->count(),
                ],
            ],
            default => $summary,
        };
    }

    private function archiveRecord(string $type, int $recordId): AdminArchive
    {
        $archive = AdminArchive::query()
            ->where('archive_type', $type)
            ->where('archive_id', $recordId)
            ->first();

        abort_if($archive === null, 404, 'Archived record not found.');

        return $archive;
    }

    private function resolveRecord(string $type, int $recordId): Model
    {
        $record = $this->findRecord($type, $recordId);

        abort_if($record === null, 404, 'Record not found.');

        return $record;
    }

    private function findRecord(string $type, int $recordId): ?Model
    {
        $definition = $this->definition($type);
        $record = $definition['model']::query()->find($recordId);

        if ($record === null) {
            return null;
        }

        return $this->recordMatchesType($type, $record) ? $record : null;
    }

    private function recordMatchesType(string $type, Model $record): bool
    {
        return match ($type) {
            'customer' => $record->user_id === null || $record->user?->role === 'customer',
            'staff' => $record->role === 'staff',
            default => true,
        };
    }

    private function assertRestorable(string $type, Model $record): void
    {
        $message = match ($type) {
            'order' => $record->customer()->exists()
                && ($record->branch_id === null || $record->branch()->exists())
                && ($record->assigned_staff_id === null || $record->assignedStaff()->exists())
                ? null
                : 'This order cannot be restored because one of its required relationships is no longer available.',
            'product' => $record->category()->exists()
                ? null
                : 'This product cannot be restored because its Category is no longer available.',
            'payment' => $record->order()->exists()
                ? null
                : 'This payment cannot be restored because its Order is no longer available.',
            'customer' => $record->user_id === null || $record->user()->exists()
                ? null
                : 'This customer cannot be restored because its account is no longer available.',
            'staff' => $record->branch_id === null || $record->branch()->exists()
                ? null
                : 'This staff account cannot be restored because its Branch is no longer available.',
            default => null,
        };

        if ($message !== null) {
            throw new HttpException(409, $message);
        }
    }

    private function assertPermanentlyDeletable(string $type, Model $record): void
    {
        $hasReferences = match ($type) {
            'order' => $record->items()->exists()
                || $record->payments()->exists()
                || $record->pickupRequest()->exists()
                || $record->deliveryRequest()->exists()
                || $record->reviews()->exists(),
            'product' => $record->orderItems()->exists() || $record->reviews()->exists(),
            'customer' => $record->user_id !== null
                || $record->orderRequests()->exists()
                || $record->conversations()->exists()
                || $record->reviews()->exists(),
            'branch' => $record->users()->exists()
                || $record->orderRequests()->exists()
                || $record->pickupRequests()->exists()
                || $record->deliveryRequests()->exists(),
            'staff' => $record->assignedOrders()->exists()
                || $record->verifiedPayments()->exists()
                || $record->assignedPickupRequests()->exists()
                || $record->assignedDeliveryRequests()->exists()
                || $record->sentMessages()->exists()
                || $record->customer()->exists(),
            'category', 'brand' => $record->products()->exists(),
            default => false,
        };

        if ($hasReferences) {
            throw new HttpException(
                409,
                'This record cannot be permanently deleted because existing records still reference it.',
            );
        }
    }

    /** @return array<string, mixed> */
    private function definition(string $type): array
    {
        $definition = $this->definitions()[$type] ?? null;

        abort_if($definition === null, 404, 'Archive type not found.');

        return $definition;
    }

    /** @return array<string, array<string, mixed>> */
    private function definitions(): array
    {
        return [
            'order' => [
                'model' => OrderRequest::class,
                'label' => 'Order',
                'destination' => '/admin/orders',
            ],
            'payment' => [
                'model' => Payment::class,
                'label' => 'Payment',
                'destination' => '/admin/payments',
            ],
            'product' => [
                'model' => Product::class,
                'label' => 'Product',
                'destination' => '/admin/products',
            ],
            'customer' => [
                'model' => Customer::class,
                'label' => 'Customer',
                'destination' => '/admin/customers',
            ],
            'branch' => [
                'model' => Branch::class,
                'label' => 'Branch',
                'destination' => '/admin/branches',
            ],
            'staff' => [
                'model' => User::class,
                'label' => 'Staff',
                'destination' => '/admin/staff-management',
            ],
            'category' => [
                'model' => Category::class,
                'label' => 'Category',
                'destination' => '/admin/categories-brands',
            ],
            'brand' => [
                'model' => Brand::class,
                'label' => 'Brand',
                'destination' => '/admin/categories-brands',
            ],
        ];
    }
}
