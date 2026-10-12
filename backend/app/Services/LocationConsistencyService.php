<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class LocationConsistencyService
{
    public function __construct(
        private readonly ReverseGeocodeService $reverseGeocodeService,
        private readonly PsgcLocationService $psgcLocationService,
    ) {}

    /**
     * Validate a submitted location against the provider result when a pin is
     * present. Provider failures remain non-fatal so users can save manually.
     *
     * @param  array{latitude: mixed, longitude: mixed, city?: mixed, city_municipality?: mixed, city_municipality_code?: mixed, barangay?: mixed, barangay_code?: mixed}  $location
     */
    public function validate(array $location): void
    {
        if (! is_numeric($location['latitude'] ?? null) || ! is_numeric($location['longitude'] ?? null)) {
            return;
        }

        try {
            $detected = $this->reverseGeocodeService->reverse(
                (float) $location['latitude'],
                (float) $location['longitude'],
            );
        } catch (ReverseGeocodeUnavailable) {
            return;
        }

        try {
            $cityMatch = $this->psgcLocationService->matchCity($detected['city_municipality']);
            $barangayMatch = $cityMatch === null
                ? null
                : $this->psgcLocationService->matchBarangay(
                    $detected['barangay'],
                    $cityMatch['code'],
                );
        } catch (PsgcLocationDataUnavailable $exception) {
            Log::warning('Location consistency could not read PSGC data.', [
                'reason' => $exception->getMessage(),
            ]);

            return;
        }

        $errors = [];

        if ($cityMatch !== null && ! $this->matches(
            $location['city_municipality_code'] ?? null,
            $location['city_municipality'] ?? $location['city'] ?? null,
            $cityMatch['code'],
            $cityMatch['name'],
        )) {
            $errors['city'] = ['The selected city or municipality does not match the pinned location.'];
            $errors['city_municipality_code'] = ['Choose the city or municipality detected for this map pin.'];
        }

        if ($barangayMatch !== null && $cityMatch !== null && ! $this->matches(
            $location['barangay_code'] ?? null,
            $location['barangay'] ?? null,
            $barangayMatch['code'],
            $barangayMatch['name'],
        )) {
            $errors['barangay'] = ['The selected barangay does not match the pinned location.'];
            $errors['barangay_code'] = ['Choose the barangay detected for this map pin.'];
        }

        if ($errors !== []) {
            throw new LocationMismatchException(
                'The selected address does not match the pinned map location.',
                $errors,
            );
        }
    }

    private function matches(
        mixed $submittedCode,
        mixed $submittedName,
        string $canonicalCode,
        string $canonicalName,
    ): bool {
        $submittedCode = is_string($submittedCode) || is_numeric($submittedCode)
            ? trim((string) $submittedCode)
            : '';

        if ($submittedCode !== '') {
            return $submittedCode === $canonicalCode;
        }

        if (blank($submittedName)) {
            return true;
        }

        return $this->normalizeName($submittedName) === $this->normalizeName($canonicalName);
    }

    private function normalizeName(mixed $value): string
    {
        $value = Str::ascii(trim((string) $value));
        $value = mb_strtolower($value);
        $value = preg_replace('/[^a-z0-9]+/', ' ', $value) ?? '';
        $value = preg_replace('/^(city|municipality)\s+of\s+/', '', $value) ?? $value;
        $value = preg_replace('/\s+(city|municipality)$/', '', $value) ?? $value;
        $value = preg_replace('/^(barangay|brgy)\s+/', '', $value) ?? $value;

        return trim($value);
    }
}
