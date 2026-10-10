<?php

namespace App\Services;

use App\Models\MediaAsset;
use App\Models\Message;
use App\Models\Payment;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Pagination\LengthAwarePaginator;
use Symfony\Component\HttpKernel\Exception\HttpException;

class MediaAssetService
{
    public function __construct(private readonly CloudinaryService $cloudinaryService) {}

    /**
     * @param  array<string, mixed>  $asset
     * @param  array<string, mixed>|null  $metadata
     */
    public function registerUploadedAsset(
        array $asset,
        string $purpose,
        string $linkedType,
        int $linkedId,
        ?User $actor = null,
        ?array $metadata = null,
    ): MediaAsset {
        return $this->registerReference(
            secureUrl: (string) ($asset['secure_url'] ?? ''),
            publicId: $asset['public_id'] ?? null,
            purpose: $purpose,
            linkedType: $linkedType,
            linkedId: $linkedId,
            actor: $actor,
            metadata: $metadata,
            originalFilename: $asset['original_filename'] ?? null,
            mimeType: $asset['mime_type'] ?? null,
            bytes: isset($asset['bytes']) ? (int) $asset['bytes'] : null,
            resourceType: (string) ($asset['resource_type'] ?? 'image'),
        );
    }

    /**
     * @param  array<string, mixed>|null  $metadata
     */
    public function registerReference(
        string $secureUrl,
        ?string $publicId,
        string $purpose,
        string $linkedType,
        int $linkedId,
        ?User $actor = null,
        ?array $metadata = null,
        ?string $originalFilename = null,
        ?string $mimeType = null,
        ?int $bytes = null,
        string $resourceType = 'image',
    ): MediaAsset {
        $secureUrl = trim($secureUrl);
        $publicId = $this->nullableTrim($publicId);

        if ($secureUrl === '') {
            throw new HttpException(422, 'A media URL is required to register an asset.');
        }

        $asset = $publicId !== null
            ? MediaAsset::query()->where('cloudinary_public_id', $publicId)->first()
            : MediaAsset::query()
                ->where('purpose', $purpose)
                ->where('linked_type', $linkedType)
                ->where('linked_id', $linkedId)
                ->whereNull('cloudinary_public_id')
                ->first();

        $values = [
            'cloudinary_public_id' => $publicId,
            'secure_url' => $secureUrl,
            'resource_type' => $resourceType,
            'purpose' => $purpose,
            'linked_type' => $linkedType,
            'linked_id' => $linkedId,
            'status' => MediaAsset::STATUS_ACTIVE,
            'original_filename' => $originalFilename,
            'mime_type' => $mimeType,
            'bytes' => $bytes,
            'uploaded_by_user_id' => $actor?->id,
            'uploaded_at' => now(),
            'deleted_by_user_id' => null,
            'deleted_at' => null,
            'metadata' => $metadata,
            'cleanup_error' => null,
        ];

        if ($asset) {
            $asset->fill($values);
            $asset->save();

            return $asset->fresh(['uploadedBy:id,name,email']);
        }

        return MediaAsset::query()->create($values)->load('uploadedBy:id,name,email');
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array<string, mixed>
     */
    public function index(array $filters): array
    {
        $this->reconcileMissingOwners();

        $query = MediaAsset::query()->with([
            'uploadedBy:id,name,email',
            'deletedBy:id,name,email',
        ]);

        $this->applyFilters($query, $filters);

        $sort = (string) ($filters['sort'] ?? 'newest');
        match ($sort) {
            'oldest' => $query->orderBy('uploaded_at')->orderBy('id'),
            'status' => $query->orderBy('status')->orderByDesc('uploaded_at')->orderByDesc('id'),
            'type' => $query->orderBy('purpose')->orderByDesc('uploaded_at')->orderByDesc('id'),
            default => $query->orderByDesc('uploaded_at')->orderByDesc('id'),
        };

        $assets = $query->paginate((int) ($filters['per_page'] ?? 10));

        return [
            'summary' => $this->summary(),
            'types' => $this->purposeOptions(),
            'statuses' => $this->statusOptions(),
            'media' => $assets->getCollection()
                ->map(fn (MediaAsset $asset): array => $this->payload($asset))
                ->values(),
            'meta' => $this->paginationMeta($assets),
        ];
    }

    public function show(MediaAsset $asset): array
    {
        return [
            'media' => $this->payload($asset->load([
                'uploadedBy:id,name,email',
                'deletedBy:id,name,email',
            ])),
        ];
    }

    public function deleteOrphaned(MediaAsset $asset, User $actor): MediaAsset
    {
        if ($asset->status !== MediaAsset::STATUS_ORPHANED) {
            throw new HttpException(409, 'Only orphaned media assets can be permanently deleted here.');
        }

        return $this->cleanupAsset($asset, $actor);
    }

    public function retryCleanup(MediaAsset $asset, User $actor): MediaAsset
    {
        if ($asset->status !== MediaAsset::STATUS_CLEANUP_FAILED) {
            throw new HttpException(409, 'Only media assets with cleanup failures can be retried.');
        }

        return $this->cleanupAsset($asset, $actor);
    }

    public function cleanupOwnerAssets(string $linkedType, int $linkedId, ?User $actor = null): void
    {
        MediaAsset::query()
            ->where('linked_type', $linkedType)
            ->where('linked_id', $linkedId)
            ->where('status', '!=', MediaAsset::STATUS_DELETED)
            ->get()
            ->each(fn (MediaAsset $asset): MediaAsset => $this->cleanupAsset($asset, $actor));
    }

    public function cleanupLinkedAsset(
        string $linkedType,
        int $linkedId,
        ?string $publicId,
        ?string $secureUrl,
        ?User $actor = null,
    ): void {
        $publicId = $this->nullableTrim($publicId);

        if ($publicId === null) {
            return;
        }

        $asset = MediaAsset::query()
            ->where('linked_type', $linkedType)
            ->where('linked_id', $linkedId)
            ->where('cloudinary_public_id', $publicId)
            ->first();

        if (! $asset && trim((string) $secureUrl) !== '') {
            $asset = $this->registerReference(
                secureUrl: (string) $secureUrl,
                publicId: $publicId,
                purpose: match ($linkedType) {
                    'product' => MediaAsset::PURPOSE_PRODUCT_IMAGE,
                    'payment' => MediaAsset::PURPOSE_PAYMENT_PROOF,
                    'message' => MediaAsset::PURPOSE_MESSAGE_ATTACHMENT,
                    default => 'legacy_asset',
                },
                linkedType: $linkedType,
                linkedId: $linkedId,
                actor: $actor,
            );
        }

        if ($asset) {
            $this->cleanupAsset($asset, $actor);
        }
    }

    /** @return array<int, array{value: string, label: string}> */
    public function purposeOptions(): array
    {
        return collect(MediaAsset::PURPOSE_VALUES)
            ->map(fn (string $purpose): array => [
                'value' => $purpose,
                'label' => $this->purposeLabel($purpose),
            ])
            ->all();
    }

    /** @return array<int, array{value: string, label: string}> */
    public function statusOptions(): array
    {
        return collect(MediaAsset::STATUS_VALUES)
            ->map(fn (string $status): array => [
                'value' => $status,
                'label' => $this->statusLabel($status),
            ])
            ->all();
    }

    private function cleanupAsset(MediaAsset $asset, ?User $actor): MediaAsset
    {
        $publicId = $this->nullableTrim($asset->cloudinary_public_id);

        if ($publicId === null) {
            $asset->forceFill([
                'status' => MediaAsset::STATUS_CLEANUP_FAILED,
                'cleanup_error' => 'The Cloudinary public ID is unavailable, so the physical asset could not be removed safely.',
            ])->save();

            return $asset->fresh(['uploadedBy:id,name,email', 'deletedBy:id,name,email']);
        }

        if ($this->cloudinaryService->deleteImage($publicId)) {
            $asset->forceFill([
                'status' => MediaAsset::STATUS_DELETED,
                'deleted_by_user_id' => $actor?->id,
                'deleted_at' => now(),
                'cleanup_error' => null,
            ])->save();
        } else {
            $asset->forceFill([
                'status' => MediaAsset::STATUS_CLEANUP_FAILED,
                'cleanup_error' => 'Cloudinary did not confirm deletion. Retry cleanup when the provider is available.',
            ])->save();
        }

        return $asset->fresh(['uploadedBy:id,name,email', 'deletedBy:id,name,email']);
    }

    private function reconcileMissingOwners(): void
    {
        MediaAsset::query()
            ->whereIn('status', [MediaAsset::STATUS_ACTIVE, MediaAsset::STATUS_PENDING])
            ->whereNotNull('linked_type')
            ->whereNotNull('linked_id')
            ->orderBy('id')
            ->chunkById(100, function (EloquentCollection $assets): void {
                foreach ($assets as $asset) {
                    if (! $this->ownerExists($asset)) {
                        $asset->forceFill([
                            'status' => MediaAsset::STATUS_ORPHANED,
                            'cleanup_error' => 'The linked ALD record no longer exists.',
                        ])->save();
                    }
                }
            });
    }

    private function ownerExists(MediaAsset $asset): bool
    {
        return match ($asset->linked_type) {
            'product' => Product::query()->whereKey($asset->linked_id)->exists(),
            'payment' => Payment::query()->whereKey($asset->linked_id)->exists(),
            'message' => Message::query()->whereKey($asset->linked_id)->exists(),
            default => false,
        };
    }

    /** @param array<string, mixed> $filters */
    private function applyFilters(Builder $query, array $filters): void
    {
        $purpose = trim((string) ($filters['type'] ?? ''));
        $status = trim((string) ($filters['status'] ?? ''));
        $search = trim((string) ($filters['search'] ?? ''));

        if ($purpose !== '') {
            $query->where('purpose', $purpose);
        }

        if ($status !== '') {
            $query->where('status', $status);
        }

        if ($search === '') {
            return;
        }

        $operator = $query->getModel()->getConnection()->getDriverName() === 'pgsql'
            ? 'ilike'
            : 'like';
        $term = "%{$search}%";

        $query->where(function (Builder $searchQuery) use ($operator, $term): void {
            $searchQuery
                ->where('cloudinary_public_id', $operator, $term)
                ->orWhere('secure_url', $operator, $term)
                ->orWhere('original_filename', $operator, $term)
                ->orWhere('purpose', $operator, $term)
                ->orWhere('linked_type', $operator, $term)
                ->orWhereRaw("CAST(metadata AS TEXT) {$operator} ?", [$term])
                ->orWhere(function (Builder $linkedQuery) use ($operator, $term): void {
                    $linkedQuery
                        ->where('linked_type', 'product')
                        ->whereIn('linked_id', Product::query()
                            ->where(function (Builder $productQuery) use ($operator, $term): void {
                                $productQuery
                                    ->where('name', $operator, $term)
                                    ->orWhere('part_number', $operator, $term);
                            })
                            ->select('id'));
                })
                ->orWhere(function (Builder $linkedQuery) use ($operator, $term): void {
                    $linkedQuery
                        ->where('linked_type', 'payment')
                        ->whereIn('linked_id', Payment::query()
                            ->where('payment_reference', $operator, $term)
                            ->select('id'));
                })
                ->orWhere(function (Builder $linkedQuery) use ($operator, $term): void {
                    $linkedQuery
                        ->where('linked_type', 'message')
                        ->whereIn('linked_id', Message::query()
                            ->where('body', $operator, $term)
                            ->select('id'));
                })
                ->orWhere('linked_id', is_numeric($search) ? (int) $search : -1);
        });
    }

    private function summary(): array
    {
        $query = MediaAsset::query();

        return [
            'total' => (clone $query)->count(),
            'active' => (clone $query)->where('status', MediaAsset::STATUS_ACTIVE)->count(),
            'pending' => (clone $query)->where('status', MediaAsset::STATUS_PENDING)->count(),
            'orphaned' => (clone $query)->where('status', MediaAsset::STATUS_ORPHANED)->count(),
            'canceled' => (clone $query)->where('status', MediaAsset::STATUS_CANCELED)->count(),
            'deleted' => (clone $query)->where('status', MediaAsset::STATUS_DELETED)->count(),
            'cleanup_failed' => (clone $query)->where('status', MediaAsset::STATUS_CLEANUP_FAILED)->count(),
        ];
    }

    /** @return array<string, mixed> */
    private function payload(MediaAsset $asset): array
    {
        return [
            'id' => $asset->id,
            'cloudinary_public_id' => $asset->cloudinary_public_id,
            'secure_url' => $asset->secure_url,
            'resource_type' => $asset->resource_type,
            'purpose' => $asset->purpose,
            'purpose_label' => $this->purposeLabel($asset->purpose),
            'status' => $asset->status,
            'status_label' => $this->statusLabel($asset->status),
            'original_filename' => $asset->original_filename,
            'mime_type' => $asset->mime_type,
            'bytes' => $asset->bytes,
            'uploaded_at' => $asset->uploaded_at?->toISOString(),
            'deleted_at' => $asset->deleted_at?->toISOString(),
            'cleanup_error' => $asset->cleanup_error,
            'metadata' => $asset->metadata,
            'uploaded_by' => $asset->uploadedBy?->only(['id', 'name', 'email']),
            'deleted_by' => $asset->deletedBy?->only(['id', 'name', 'email']),
            'linked_record' => $this->linkedRecord($asset),
            'can_delete' => $asset->status === MediaAsset::STATUS_ORPHANED
                && $this->nullableTrim($asset->cloudinary_public_id) !== null,
            'can_retry_cleanup' => $asset->status === MediaAsset::STATUS_CLEANUP_FAILED
                && $this->nullableTrim($asset->cloudinary_public_id) !== null,
        ];
    }

    /** @return array<string, mixed>|null */
    private function linkedRecord(MediaAsset $asset): ?array
    {
        if (! $asset->linked_type || ! $asset->linked_id) {
            return null;
        }

        return match ($asset->linked_type) {
            'product' => $this->productLink($asset->linked_id),
            'payment' => $this->paymentLink($asset->linked_id),
            'message' => $this->messageLink($asset->linked_id),
            default => [
                'type' => $asset->linked_type,
                'id' => $asset->linked_id,
                'exists' => false,
                'title' => 'Unsupported linked record',
                'destination' => null,
            ],
        };
    }

    /** @return array<string, mixed> */
    private function productLink(int $id): array
    {
        $product = Product::query()->find($id);

        return [
            'type' => 'product',
            'id' => $id,
            'exists' => $product !== null,
            'title' => $product?->name ?? 'Product unavailable',
            'reference' => $product?->part_number,
            'destination' => '/admin/products',
        ];
    }

    /** @return array<string, mixed> */
    private function paymentLink(int $id): array
    {
        $payment = Payment::query()->with('order:id,order_reference')->find($id);

        return [
            'type' => 'payment',
            'id' => $id,
            'exists' => $payment !== null,
            'title' => $payment?->payment_reference ?: 'Payment #'.$id,
            'reference' => $payment?->order?->order_reference,
            'destination' => '/admin/payments',
        ];
    }

    /** @return array<string, mixed> */
    private function messageLink(int $id): array
    {
        $message = Message::query()->with('conversation:id')->find($id);

        return [
            'type' => 'message',
            'id' => $id,
            'exists' => $message !== null,
            'title' => $message ? 'Conversation #'.$message->conversation_id : 'Message unavailable',
            'reference' => $message ? 'Message #'.$id : null,
            'destination' => '/admin/messages',
        ];
    }

    private function purposeLabel(string $purpose): string
    {
        return match ($purpose) {
            MediaAsset::PURPOSE_PRODUCT_IMAGE => 'Product Image',
            MediaAsset::PURPOSE_PAYMENT_PROOF => 'Payment Proof',
            MediaAsset::PURPOSE_CONTACT_INQUIRY_ATTACHMENT => 'Contact Inquiry',
            MediaAsset::PURPOSE_MESSAGE_ATTACHMENT => 'Message Attachment',
            default => ucwords(str_replace('_', ' ', $purpose)),
        };
    }

    private function statusLabel(string $status): string
    {
        return $status === MediaAsset::STATUS_CLEANUP_FAILED
            ? 'Cleanup Failed'
            : ucwords(str_replace('_', ' ', $status));
    }

    private function nullableTrim(?string $value): ?string
    {
        $value = trim((string) $value);

        return $value === '' ? null : $value;
    }

    private function paginationMeta(LengthAwarePaginator $assets): array
    {
        return [
            'current_page' => $assets->currentPage(),
            'last_page' => max(1, $assets->lastPage()),
            'per_page' => $assets->perPage(),
            'total' => $assets->total(),
        ];
    }
}
