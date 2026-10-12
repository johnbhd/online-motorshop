<?php

namespace App\Services;

use App\Models\Branch;
use Illuminate\Database\Eloquent\Builder;

class AdminBranchService
{
    public function __construct(
        private readonly AdminBranchPresenter $presenter,
        private readonly AdminArchiveService $archiveService,
    ) {}

    public function index(array $filters): array
    {
        $query = $this->branchQuery();
        $this->applyFilters($query, $filters);

        $branches = $query
            ->orderBy('name')
            ->paginate((int) ($filters['per_page'] ?? 10));

        $summaryQuery = $this->archiveService->excludeArchived(Branch::query(), 'branch');

        return [
            'summary' => [
                'total_branches' => (clone $summaryQuery)->count(),
                'active_branches' => (clone $summaryQuery)->where('status', 'active')->count(),
                'pickup_available_branches' => (clone $summaryQuery)->where('pickup_available', '1')->count(),
                'active_staff' => $this->activeStaffCount(),
            ],
            'branches' => $branches->getCollection()
                ->map(fn (Branch $branch): array => $this->presenter->branch($branch))
                ->values(),
            'meta' => $this->paginationMeta($branches),
        ];
    }

    public function find(Branch $branch): Branch
    {
        return $this->branchQuery()
            ->with([
                'users' => fn ($query) => $query
                    ->where('role', 'staff')
                    ->orderBy('name')
                    ->select(['id', 'branch_id', 'name', 'email', 'role', 'status']),
            ])
            ->findOrFail($branch->getKey());
    }

    public function create(array $attributes): Branch
    {
        return $this->branchQuery()
            ->getModel()
            ->newQuery()
            ->create($attributes)
            ->loadCount($this->countRelations());
    }

    public function update(Branch $branch, array $attributes): Branch
    {
        $branch->fill($attributes);
        $branch->save();

        return $this->find($branch);
    }

    public function delete(Branch $branch): bool
    {
        $hasReferences = $branch->users()->exists()
            || $branch->orderRequests()->exists()
            || $branch->pickupRequests()->exists()
            || $branch->deliveryRequests()->exists();

        return ! $hasReferences && (bool) $branch->delete();
    }

    private function branchQuery(): Builder
    {
        return $this->archiveService
            ->excludeArchived(Branch::query(), 'branch')
            ->withCount($this->countRelations());
    }

    private function countRelations(): array
    {
        return [
            'users as staff_count' => fn ($query) => $this->archiveService
                ->excludeArchived($query, 'staff')
                ->where('role', 'staff'),
            'users as active_staff_count' => fn ($query) => $this->archiveService
                ->excludeArchived($query, 'staff')
                ->where('role', 'staff')
                ->where('status', 'active'),
            'orderRequests as order_count',
            'pickupRequests as pickup_count',
            'deliveryRequests as delivery_count',
        ];
    }

    private function applyFilters(Builder $query, array $filters): void
    {
        if (! empty($filters['search'])) {
            $operator = $query->getModel()->getConnection()->getDriverName() === 'pgsql'
                ? 'ilike'
                : 'like';
            $term = '%'.trim((string) $filters['search']).'%';

            $query->where(function (Builder $searchQuery) use ($operator, $term): void {
                $searchQuery
                    ->where('name', $operator, $term)
                    ->orWhere('address', $operator, $term)
                    ->orWhere('contact_number', $operator, $term);
            });
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (array_key_exists('pickup_available', $filters)) {
            $pickupAvailable = filter_var(
                $filters['pickup_available'],
                FILTER_VALIDATE_BOOLEAN,
            );

            $query->where('pickup_available', $pickupAvailable ? '1' : '0');
        }
    }

    private function activeStaffCount(): int
    {
        $query = $this->archiveService->excludeArchived(Branch::query(), 'branch');

        return (int) $query
            ->join('users', 'users.branch_id', '=', 'branches.id')
            ->whereNotExists(function ($archiveQuery): void {
                $archiveQuery
                    ->from('admin_archives')
                    ->where('archive_type', 'staff')
                    ->whereColumn('admin_archives.archive_id', 'users.id');
            })
            ->where('users.role', 'staff')
            ->where('users.status', 'active')
            ->count('users.id');
    }

    private function paginationMeta($branches): array
    {
        return [
            'current_page' => $branches->currentPage(),
            'last_page' => $branches->lastPage(),
            'per_page' => $branches->perPage(),
            'total' => $branches->total(),
        ];
    }
}
