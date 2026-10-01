<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreOrderRequestRequest;
use App\Models\OrderRequest;
use App\Services\OrderRequestCreator;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class OrderRequestController extends Controller
{
    public function __construct(
        private readonly OrderRequestCreator $orderRequestCreator,
    ) {}

    public function store(StoreOrderRequestRequest $request): JsonResponse
    {
        $authorizationHeader = trim((string) $request->header('Authorization'));
        $user = Auth::guard('sanctum')->user();

        if ($authorizationHeader !== '' && ! $user) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        if ($user && $user->role !== 'customer') {
            return response()->json([
                'message' => 'Only customer accounts may submit orders.',
            ], 403);
        }

        $order = $this->orderRequestCreator->create($request->validated(), $user);

        return response()->json([
            'message' => 'Order request submitted successfully.',
            'order' => $this->orderPayload($order),
        ], 201);
    }

    private function orderPayload(OrderRequest $order): array
    {
        $payload = [
            'id' => $order->id,
            'reference' => $order->order_reference,
            'status' => $order->order_status,
            'payment_status' => 'unpaid',
            'fulfillment_method' => $order->fulfillment_type,
            'branch' => $order->branch?->only([
                'id',
                'name',
                'address',
                'contact_number',
            ]),
            'customer' => $order->customer?->only([
                'id',
                'full_name',
                'contact_number',
                'email',
                'address',
            ]),
            'items' => $order->items->map(fn ($item): array => [
                'product_id' => $item->product_id,
                'part_number' => $item->product?->part_number,
                'name' => $item->product_name,
                'unit_price' => (float) $item->unit_price,
                'quantity' => $item->quantity,
                'line_total' => (float) $item->subtotal,
            ])->values()->all(),
            'subtotal' => (float) $order->subtotal,
            'delivery_fee' => (float) $order->delivery_fee,
            'estimated_total' => (float) $order->total_amount,
            'customer_notes' => $order->customer_notes,
            'created_at' => $order->created_at?->toISOString(),
        ];

        if ($order->fulfillment_type === 'pickup') {
            $payload['pickup'] = [
                'branch_id' => $order->pickupRequest?->branch_id,
                'status' => $order->pickupRequest?->pickup_status,
            ];
        } else {
            $payload['delivery'] = [
                'branch_id' => $order->deliveryRequest?->branch_id,
                'address' => $order->deliveryRequest?->delivery_address,
                'status' => $order->deliveryRequest?->delivery_status,
                'remarks' => $order->deliveryRequest?->remarks,
            ];
        }

        return $payload;
    }
}
