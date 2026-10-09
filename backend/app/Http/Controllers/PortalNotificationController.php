<?php

namespace App\Http\Controllers;

use App\Http\Requests\PortalNotificationIndexRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;

class PortalNotificationController extends Controller
{
    public function index(PortalNotificationIndexRequest $request): JsonResponse
    {
        $user = $request->user();
        $filters = $request->validated();
        $query = $user->notifications()
            ->where('type', \App\Notifications\StaffAdminNotification::class)
            ->latest();
        $category = $filters['category'] ?? 'all';

        if ($category === 'unread') {
            $query->whereNull('read_at');
        } elseif ($category !== 'all') {
            $this->whereCategory($query, $category);
        }

        $notifications = $query->paginate($filters['per_page'] ?? 10);

        return response()->json([
            'notifications' => $notifications->getCollection()
                ->map(fn (DatabaseNotification $notification): array => $this->present($notification))
                ->values(),
            'unread_count' => $user->unreadNotifications()
                ->where('type', \App\Notifications\StaffAdminNotification::class)
                ->count(),
            'meta' => [
                'current_page' => $notifications->currentPage(),
                'last_page' => $notifications->lastPage(),
                'per_page' => $notifications->perPage(),
                'total' => $notifications->total(),
            ],
        ]);
    }

    public function markRead(Request $request, string $notification): JsonResponse
    {
        $record = $request->user()->notifications()
            ->where('type', \App\Notifications\StaffAdminNotification::class)
            ->whereKey($notification)
            ->first();

        if (! $record) {
            return response()->json(['message' => 'Notification not found.'], 404);
        }

        $record->markAsRead();

        return response()->json([
            'notification' => $this->present($record->fresh()),
            'unread_count' => $this->unreadCount($request->user()),
        ]);
    }

    public function markAllRead(Request $request): JsonResponse
    {
        $updated = $request->user()->unreadNotifications()
            ->where('type', \App\Notifications\StaffAdminNotification::class)
            ->update(['read_at' => now()]);

        return response()->json(['updated' => $updated, 'unread_count' => $this->unreadCount($request->user())]);
    }

    private function whereCategory($query, string $category): void
    {
        if ($query->getModel()->getConnection()->getDriverName() === 'pgsql') {
            $query->whereRaw("data::jsonb->>'category' = ?", [$category]);
        } else {
            $query->where('data->category', $category);
        }
    }

    private function unreadCount($user): int
    {
        return $user->unreadNotifications()
            ->where('type', \App\Notifications\StaffAdminNotification::class)
            ->count();
    }

    private function present(DatabaseNotification $notification): array
    {
        $data = is_array($notification->data) ? $notification->data : [];
        $reference = is_array($data['reference'] ?? null) ? $data['reference'] : [];

        return [
            'id' => (string) $notification->id,
            'type' => is_string($data['notification_type'] ?? null) ? $data['notification_type'] : 'portal_update',
            'category' => is_string($data['category'] ?? null) ? $data['category'] : 'orders',
            'title' => is_string($data['title'] ?? null) ? $data['title'] : 'Portal update',
            'message' => is_string($data['message'] ?? null) ? $data['message'] : 'There is an update in your ALD Motorshop portal.',
            'read' => $notification->read_at !== null,
            'read_at' => $notification->read_at?->toISOString(),
            'created_at' => $notification->created_at?->toISOString(),
            'reference' => [
                'type' => is_string($reference['type'] ?? null) ? $reference['type'] : null,
                'order_id' => isset($reference['order_id']) ? (int) $reference['order_id'] : null,
                'order_reference' => is_string($reference['order_reference'] ?? null) ? $reference['order_reference'] : null,
                'payment_id' => isset($reference['payment_id']) ? (int) $reference['payment_id'] : null,
                'pickup_id' => isset($reference['pickup_id']) ? (int) $reference['pickup_id'] : null,
                'delivery_id' => isset($reference['delivery_id']) ? (int) $reference['delivery_id'] : null,
                'conversation_id' => isset($reference['conversation_id']) ? (int) $reference['conversation_id'] : null,
                'branch_id' => isset($reference['branch_id']) ? (int) $reference['branch_id'] : null,
            ],
        ];
    }
}
