<?php

namespace App\Http\Controllers;

use App\Http\Requests\CustomerNotificationIndexRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;

class CustomerNotificationController extends Controller
{
    public function index(CustomerNotificationIndexRequest $request): JsonResponse
    {
        $user = $request->user();
        $filters = $request->validated();
        $query = $user->notifications()->latest();
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
            'unread_count' => $this->unreadCount($user),
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
        $record = $request->user()->notifications()->whereKey($notification)->first();

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
        $updated = $request->user()->unreadNotifications()->update(['read_at' => now()]);

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
        return $user->unreadNotifications()->count();
    }

    private function present(DatabaseNotification $notification): array
    {
        $data = is_array($notification->data) ? $notification->data : [];
        $reference = is_array($data['reference'] ?? null) ? $data['reference'] : [];

        return [
            'id' => (string) $notification->id,
            'type' => is_string($data['notification_type'] ?? null) ? $data['notification_type'] : 'order_update',
            'category' => is_string($data['category'] ?? null) ? $data['category'] : 'orders',
            'title' => is_string($data['title'] ?? null) ? $data['title'] : 'Account update',
            'message' => is_string($data['message'] ?? null) ? $data['message'] : 'There is an update to your ALD Motorshop account.',
            'read' => $notification->read_at !== null,
            'read_at' => $notification->read_at?->toISOString(),
            'created_at' => $notification->created_at?->toISOString(),
            'reference' => [
                'type' => is_string($reference['type'] ?? null) ? $reference['type'] : null,
                'order_id' => isset($reference['order_id']) ? (int) $reference['order_id'] : null,
                'order_reference' => is_string($reference['order_reference'] ?? null) ? $reference['order_reference'] : null,
                'conversation_id' => isset($reference['conversation_id']) ? (int) $reference['conversation_id'] : null,
            ],
        ];
    }
}
