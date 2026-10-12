<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class ReverseGeocodeService
{
    /**
     * @return array{city_municipality: string|null, barangay: string|null, area: string|null}
     */
    public function reverse(float $latitude, float $longitude): array
    {
        $latitude = round($latitude, 5);
        $longitude = round($longitude, 5);
        $cacheKey = sprintf('reverse-geocode:%s:%s', $latitude, $longitude);

        return Cache::remember(
            $cacheKey,
            now()->addDay(),
            fn (): array => $this->request($latitude, $longitude),
        );
    }

    /**
     * @return array{city_municipality: string|null, barangay: string|null, area: string|null}
     */
    private function request(float $latitude, float $longitude): array
    {
        $url = trim((string) config('services.reverse_geocoder.url'));

        if ($url === '') {
            throw new ReverseGeocodeUnavailable('The reverse geocoder is not configured.');
        }

        $timeout = max(1, (int) config('services.reverse_geocoder.timeout', 8));
        $userAgent = trim((string) config('services.reverse_geocoder.user_agent'));

        try {
            $request = Http::timeout($timeout)
                ->connectTimeout($timeout)
                ->acceptJson();

            if ($userAgent !== '') {
                $request = $request->withHeaders(['User-Agent' => $userAgent]);
            }

            $response = $request->get($url, [
                'lat' => $latitude,
                'lon' => $longitude,
                'format' => 'jsonv2',
                'addressdetails' => 1,
                'zoom' => 18,
            ]);

            if (! $response->successful()) {
                throw new ReverseGeocodeUnavailable('The reverse geocoder returned an unsuccessful response.');
            }

            $address = $response->json('address');

            if (! is_array($address)) {
                throw new ReverseGeocodeUnavailable('The reverse geocoder returned an invalid response.');
            }

            return [
                'city_municipality' => $this->firstValue($address, [
                    'city',
                    'municipality',
                    'town',
                    'county',
                ]),
                // Only an explicit provider Barangay field is a Barangay
                // candidate. Lower-level locality fields are area context
                // until the PSGC service confirms a canonical match.
                'barangay' => $this->firstValue($address, ['barangay']),
                'area' => $this->firstValue($address, [
                    'suburb',
                    'district',
                    'city_district',
                    'quarter',
                    'neighbourhood',
                    'neighborhood',
                    'borough',
                    'village',
                ]),
            ];
        } catch (ReverseGeocodeUnavailable $exception) {
            Log::warning('Reverse geocoding was unavailable.', [
                'provider' => config('services.reverse_geocoder.provider', 'nominatim'),
                'reason' => $exception->getMessage(),
            ]);

            throw $exception;
        } catch (Throwable $exception) {
            Log::warning('Reverse geocoding failed.', [
                'provider' => config('services.reverse_geocoder.provider', 'nominatim'),
                'exception' => $exception::class,
            ]);

            throw new ReverseGeocodeUnavailable('The reverse geocoder could not be reached.', 0, $exception);
        }
    }

    /**
     * @param  array<string, mixed>  $address
     * @param  array<int, string>  $keys
     */
    private function firstValue(array $address, array $keys): ?string
    {
        foreach ($keys as $key) {
            $value = $address[$key] ?? null;

            if (is_string($value) && trim($value) !== '') {
                return trim($value);
            }
        }

        return null;
    }
}
