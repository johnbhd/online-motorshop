<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\AdminCustomerIndexRequest;
use App\Http\Requests\UpdateAdminCustomerRequest;
use App\Models\Customer;
use App\Services\AdminCustomerPresenter;
use App\Services\AdminCustomerService;
use Illuminate\Http\JsonResponse;

class AdminCustomersController extends Controller
{
    public function __construct(
        private readonly AdminCustomerService $service,
        private readonly AdminCustomerPresenter $presenter,
    ) {}

    public function index(AdminCustomerIndexRequest $request): JsonResponse
    {
        return response()->json($this->service->index($request->validated()));
    }

    public function data(AdminCustomerIndexRequest $request): JsonResponse
    {
        return $this->index($request);
    }

    public function show(AdminCustomerIndexRequest $request, Customer $customer): JsonResponse
    {
        return response()->json($this->service->details(
            $customer,
            (int) ($request->validated()['order_per_page'] ?? 10),
        ));
    }

    public function update(UpdateAdminCustomerRequest $request, Customer $customer): JsonResponse
    {
        return response()->json([
            'message' => 'Customer updated successfully.',
            'customer' => $this->presenter->summary(
                $this->service->update($customer, $request->validated()),
            ),
        ]);
    }

    public function destroy(Customer $customer): JsonResponse
    {
        $this->service->delete($customer);

        return response()->json([
            'message' => 'Guest customer deleted successfully.',
        ]);
    }
}
