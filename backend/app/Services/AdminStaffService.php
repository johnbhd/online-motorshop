<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Hash;

class AdminStaffService
{
    public function __construct(
        private readonly AdminStaffPresenter $presenter,
        private readonly AdminArchiveService $archiveService,
    ) {}

    public function index(array $filters): array
    {
        $query = $this->staffQuery();
        $this->applyFilters($query, $filters);

        $staff = $query
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->paginate((int) ($filters['per_page'] ?? 10));

        $summary = $this->archiveService->excludeArchived(User::query(), 'staff')->where('role', 'staff');

        return [
            'summary' => [
                'total_staff' => (clone $summary)->count(),
                'active_staff' => (clone $summary)->where('status', 'active')->count(),
                'inactive_staff' => (clone $summary)->where('status', 'inactive')->count(),
            ],
            'staff' => $staff->getCollection()
                ->map(fn (User $user): array => $this->presenter->staff($user))
                ->values(),
            'meta' => $this->paginationMeta($staff),
        ];
    }

    public function find(User $staff): User
    {
        if ($staff->role !== 'staff') {
            abort(404);
        }

        return $this->staffQuery()->findOrFail($staff->getKey());
    }

    public function create(array $attributes): User
    {
        $password = $attributes['password'];
        unset($attributes['password'], $attributes['password_confirmation']);

        $staff = User::query()->create(array_merge($attributes, [
            'password' => Hash::make($password),
            'role' => 'staff',
            'status' => $attributes['status'] ?? 'active',
        ]));

        return $this->find($staff);
    }

    public function update(User $staff, array $attributes): User
    {
        $staff = $this->find($staff);
        $wasActive = $staff->status === 'active';

        $staff->fill([
            ...array_intersect_key($attributes, array_flip(['name', 'email', 'branch_id', 'status'])),
            'role' => 'staff',
        ]);
        $staff->save();

        if ($wasActive && $staff->status !== 'active') {
            $staff->tokens()->delete();
        }

        return $this->find($staff);
    }

    public function updatePassword(User $staff, string $password): User
    {
        $staff = $this->find($staff);
        $staff->password = Hash::make($password);
        $staff->save();
        $staff->tokens()->delete();

        return $this->find($staff);
    }

    public function delete(User $staff): bool
    {
        $staff = $this->find($staff);

        if ($this->hasReferences($staff)) {
            return false;
        }

        $staff->tokens()->delete();

        return (bool) $staff->delete();
    }

    private function staffQuery(): Builder
    {
        return $this->archiveService->excludeArchived(User::query(), 'staff')
            ->where('role', 'staff')
            ->with('branch:id,name')
            ->withCount([
                'assignedOrders as orders_handled_count',
                'verifiedPayments as payments_verified_count',
                'assignedPickupRequests as pickup_requests_count',
                'assignedDeliveryRequests as delivery_requests_count',
                'sentMessages as messages_sent_count',
            ]);
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
                    ->orWhere('email', $operator, $term);
            });
        }

        if (array_key_exists('branch_id', $filters) && $filters['branch_id'] !== null) {
            $query->where('branch_id', $filters['branch_id']);
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }
    }

    private function hasReferences(User $staff): bool
    {
        return $staff->assignedOrders()->exists()
            || $staff->verifiedPayments()->exists()
            || $staff->assignedPickupRequests()->exists()
            || $staff->assignedDeliveryRequests()->exists()
            || $staff->sentMessages()->exists()
            || $staff->customer()->exists();
    }

    private function paginationMeta($staff): array
    {
        return [
            'current_page' => $staff->currentPage(),
            'last_page' => $staff->lastPage(),
            'per_page' => $staff->perPage(),
            'total' => $staff->total(),
        ];
    }
}
