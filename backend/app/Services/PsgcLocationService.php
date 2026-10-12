<?php

namespace App\Services;

use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Storage;
use JsonException;

class PsgcLocationService
{
    private const CITIES_PATH = 'cities-municipalities.json';

    private const BARANGAYS_PATH = 'barangays.json';

    /**
     * @return array<int, array<string, string|null>>
     */
    public function cities(?string $query = null): array
    {
        $cities = $this->citiesDataset();
        $normalizedQuery = mb_strtolower(trim((string) $query));

        if ($normalizedQuery === '') {
            return $cities;
        }

        return array_values(array_filter(
            $cities,
            static fn (array $city): bool => str_contains(mb_strtolower((string) $city['name']), $normalizedQuery)
                || str_contains(mb_strtolower((string) $city['code']), $normalizedQuery),
        ));
    }

    /**
     * @return array<string, string|null>|null
     */
    public function city(string $code): ?array
    {
        foreach ($this->citiesDataset() as $city) {
            if ($city['code'] === $code) {
                return $city;
            }
        }

        return null;
    }

    /**
     * @return array<int, array{code: string, name: string}>
     */
    public function barangaysForCity(string $cityCode): array
    {
        if ($this->city($cityCode) === null) {
            return [];
        }

        return $this->barangaysByCity()[$cityCode] ?? [];
    }

    /**
     * Resolve verified PSGC codes while allowing validated custom location text.
     *
     * A code always wins over its submitted name so clients cannot override a
     * canonical PSGC label. Without a code, the trimmed custom name is kept.
     * A barangay code is only accepted with a verified city/municipality code so
     * a custom city cannot be paired with a barangay from another city.
     *
     * @return array{city_municipality_code: string|null, barangay_code: string|null, city: string, barangay: string}
     */
    public function resolveLocation(
        ?string $cityCode,
        ?string $barangayCode,
        ?string $cityName,
        ?string $barangayName,
    ): array {
        $cityCode = $this->normalizeCode($cityCode);
        $barangayCode = $this->normalizeCode($barangayCode);
        $cityName = $this->normalizeName($cityName);
        $barangayName = $this->normalizeName($barangayName);
        $errors = [];
        $city = null;
        $barangay = null;

        if ($cityCode !== null) {
            $city = $this->city($cityCode);

            if ($city === null) {
                $errors['city_municipality_code'] = ['Choose a valid city or municipality.'];
            }
        } elseif ($cityName === null) {
            $errors['city_municipality'] = ['Enter a city or municipality.'];
        }

        if ($barangayCode !== null) {
            if ($cityCode === null) {
                $errors['city_municipality_code'] = [
                    'Choose a verified city or municipality before using a barangay code.',
                ];
            } elseif ($city !== null) {
                foreach ($this->barangaysByCity()[$cityCode] ?? [] as $candidate) {
                    if ($candidate['code'] === $barangayCode) {
                        $barangay = $candidate;
                        break;
                    }
                }

                if ($barangay === null) {
                    $errors['barangay_code'] = [
                        'Choose a barangay from the selected city or municipality.',
                    ];
                }
            }
        } elseif ($barangayName === null) {
            $errors['barangay'] = ['Enter a barangay.'];
        }

        if ($errors !== []) {
            throw new PsgcLocationSelectionException(
                'Choose a valid city or municipality and barangay.',
                $errors,
            );
        }

        return [
            'city_municipality_code' => $cityCode,
            'barangay_code' => $barangayCode,
            'city' => $city !== null ? (string) $city['name'] : (string) $cityName,
            'barangay' => $barangay !== null ? $barangay['name'] : (string) $barangayName,
        ];
    }

    /**
     * Resolve a fully verified PSGC selection for existing callers.
     *
     * @return array{city_municipality_code: string, barangay_code: string, city: string, barangay: string}
     */
    public function resolveSelection(?string $cityCode, ?string $barangayCode): array
    {
        $location = $this->resolveLocation($cityCode, $barangayCode, null, null);

        return [
            'city_municipality_code' => (string) $location['city_municipality_code'],
            'barangay_code' => (string) $location['barangay_code'],
            'city' => $location['city'],
            'barangay' => $location['barangay'],
        ];
    }

    /**
     * @return array<int, array<string, string|null>>
     */
    private function citiesDataset(): array
    {
        $version = $this->sourceVersion(self::CITIES_PATH);

        return Cache::remember(
            "psgc:cities:{$version}",
            now()->addDay(),
            fn (): array => $this->readCities(),
        );
    }

    /**
     * @return array<string, array<int, array{code: string, name: string}>>
     */
    private function barangaysByCity(): array
    {
        $version = $this->sourceVersion(self::BARANGAYS_PATH);

        return Cache::remember(
            "psgc:barangays:{$version}",
            now()->addDay(),
            function (): array {
                $grouped = [];

                foreach ($this->readJson(self::BARANGAYS_PATH, 'barangay') as $record) {
                    $cityCode = $this->requiredString($record, 'city_municipality_code', 'barangay city code');
                    $code = $this->requiredString($record, 'code', 'barangay code');
                    $name = $this->requiredString($record, 'name', 'barangay name');

                    $grouped[$cityCode][] = [
                        'code' => $code,
                        'name' => $name,
                    ];
                }

                foreach ($grouped as &$barangays) {
                    usort($barangays, static function (array $left, array $right): int {
                        return [$left['name'], $left['code']] <=> [$right['name'], $right['code']];
                    });
                }

                unset($barangays);

                return $grouped;
            },
        );
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function readCities(): array
    {
        $cities = [];

        foreach ($this->readJson(self::CITIES_PATH, 'city or municipality') as $record) {
            $cities[] = [
                'code' => $this->requiredString($record, 'code', 'city or municipality code'),
                'name' => $this->requiredString($record, 'name', 'city or municipality name'),
                'region_code' => $this->nullableString($record['region_code'] ?? null),
                'province_code' => $this->nullableString($record['province_code'] ?? null),
                'geographic_level' => $this->requiredString($record, 'geographic_level', 'geographic level'),
            ];
        }

        usort($cities, static function (array $left, array $right): int {
            return [$left['name'], $left['code']] <=> [$right['name'], $right['code']];
        });

        return $cities;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function readJson(string $path, string $recordType): array
    {
        $disk = $this->disk();

        if (! $disk->exists($path)) {
            throw new PsgcLocationDataUnavailable("The PSGC {$recordType} source is missing.");
        }

        try {
            $decoded = json_decode($disk->get($path), true, 512, JSON_THROW_ON_ERROR);
        } catch (JsonException $exception) {
            throw new PsgcLocationDataUnavailable("The PSGC {$recordType} source is invalid.", 0, $exception);
        }

        if (! is_array($decoded) || ! array_is_list($decoded)) {
            throw new PsgcLocationDataUnavailable("The PSGC {$recordType} source has an invalid shape.");
        }

        return $decoded;
    }

    private function sourceVersion(string $path): string
    {
        $disk = $this->disk();

        if (! $disk->exists($path)) {
            throw new PsgcLocationDataUnavailable('The PSGC source is missing.');
        }

        return (string) $disk->lastModified($path);
    }

    private function disk(): FilesystemAdapter
    {
        return Storage::disk('psgc');
    }

    /**
     * @param  array<string, mixed>  $record
     */
    private function requiredString(array $record, string $key, string $label): string
    {
        $value = $record[$key] ?? null;

        if (! is_string($value) || trim($value) === '') {
            throw new PsgcLocationDataUnavailable("The PSGC {$label} is invalid.");
        }

        return trim($value);
    }

    private function nullableString(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        return is_string($value) ? trim($value) : (string) $value;
    }

    private function normalizeCode(?string $code): ?string
    {
        $code = trim((string) $code);

        return $code === '' ? null : $code;
    }

    private function normalizeName(?string $name): ?string
    {
        $name = trim((string) $name);

        return $name === '' ? null : $name;
    }
}
