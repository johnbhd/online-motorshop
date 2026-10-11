<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateCustomerPasswordRequest;
use App\Http\Requests\UpdateCustomerProfileRequest;
use App\Models\User;
use App\Services\PsgcLocationDataUnavailable;
use App\Services\PsgcLocationSelectionException;
use App\Services\PsgcLocationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CustomerProfileController extends Controller
{
    public function __construct(private readonly PsgcLocationService $locationService) {}

    public function show(Request $request): JsonResponse
    {
        $user = $request->user()->loadMissing('customer');

        return response()->json(['user' => $this->profilePayload($user)]);
    }

    public function update(UpdateCustomerProfileRequest $request): JsonResponse
    {
        $user = $request->user()->loadMissing('customer');
        $customer = $user->customer;

        if (! $customer) {
            return response()->json([
                'message' => 'Customer profile not found.',
                'errors' => ['customer' => ['The authenticated customer profile is missing.']],
            ], 422);
        }

        $validated = $request->validated();
        $locationFieldsProvided = array_key_exists('city_municipality_code', $validated)
            || array_key_exists('barangay_code', $validated)
            || array_key_exists('city_municipality', $validated)
            || array_key_exists('barangay', $validated);
        $coordinatesProvided = array_key_exists('latitude', $validated)
            || array_key_exists('longitude', $validated);
        $location = null;

        if ($locationFieldsProvided) {
            $cityCode = $validated['city_municipality_code'] ?? null;
            $barangayCode = $validated['barangay_code'] ?? null;
            $cityName = $validated['city_municipality'] ?? null;
            $barangayName = $validated['barangay'] ?? null;

            if ($cityCode === null && $barangayCode === null && $cityName === null && $barangayName === null) {
                $location = [
                    'city_municipality_code' => null,
                    'barangay_code' => null,
                    'city' => null,
                    'barangay' => null,
                ];
            } else {
                try {
                    $location = $this->locationService->resolveLocation(
                        $cityCode,
                        $barangayCode,
                        $cityName,
                        $barangayName,
                    );
                } catch (PsgcLocationSelectionException $exception) {
                    return response()->json([
                        'message' => $exception->getMessage(),
                        'errors' => array_filter($exception->errors()),
                    ], 422);
                } catch (PsgcLocationDataUnavailable $exception) {
                    return response()->json([
                        'message' => 'Location data is currently unavailable.',
                    ], 503);
                }
            }
        }

        DB::transaction(function () use ($user, $customer, $validated, $locationFieldsProvided, $location, $coordinatesProvided): void {
            $user->fill([
                'name' => $validated['name'],
                'email' => $validated['email'],
            ]);
            $user->save();

            $customer->fill([
                'full_name' => $validated['name'],
                'email' => $validated['email'],
                'contact_number' => $validated['contact_number'],
                'address' => $validated['address'] ?? null,
            ]);

            if ($locationFieldsProvided) {
                $customer->fill($location ?? [
                    'city_municipality_code' => null,
                    'barangay_code' => null,
                    'city' => null,
                    'barangay' => null,
                ]);
            }

            if ($coordinatesProvided) {
                $customer->fill([
                    'latitude' => $validated['latitude'] ?? null,
                    'longitude' => $validated['longitude'] ?? null,
                ]);
            }

            $customer->save();
        });

        $user->load('customer');

        return response()->json([
            'message' => 'Profile updated successfully.',
            'user' => $this->profilePayload($user),
        ]);
    }

    public function updatePassword(UpdateCustomerPasswordRequest $request): JsonResponse
    {
        $user = $request->user();
        $currentTokenId = $user->currentAccessToken()?->getKey();

        DB::transaction(function () use ($user, $request, $currentTokenId): void {
            $user->forceFill(['password' => $request->validated('password')])->save();

            $tokens = $user->tokens();

            if ($currentTokenId !== null) {
                $tokens->where('id', '!=', $currentTokenId);
            }

            $tokens->delete();
        });

        return response()->json([
            'message' => 'Password updated successfully. Other active sessions have been signed out.',
        ]);
    }

    private function profilePayload(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'status' => $user->status,
            'customer' => $user->customer?->only([
                'id',
                'full_name',
                'contact_number',
                'email',
                'address',
                'city_municipality_code',
                'barangay_code',
                'city',
                'barangay',
                'latitude',
                'longitude',
            ]),
        ];
    }
}
