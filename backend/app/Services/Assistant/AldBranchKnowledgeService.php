<?php

namespace App\Services\Assistant;

use App\Models\Branch;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Log;
use Throwable;

class AldBranchKnowledgeService
{
    /**
     * @param  array{intent?: string, search_terms?: array<int, string>}  $intent
     */
    public function contextFor(array $intent): string
    {
        $startedAt = microtime(true);

        try {
            $query = Branch::query()
                ->where('status', 'active')
                ->orderBy('name');

            if (($intent['intent'] ?? '') === 'branch_details') {
                $terms = array_values(array_filter($intent['search_terms'] ?? [], function (string $term): bool {
                    return ! in_array($term, ['branch', 'location', 'address', 'contact', 'phone'], true);
                }));

                if ($terms !== []) {
                    $operator = $query->getModel()->getConnection()->getDriverName() === 'pgsql'
                        ? 'ilike'
                        : 'like';
                    $query->where(function (Builder $branchQuery) use ($terms, $operator): void {
                        foreach ($terms as $index => $term) {
                            $pattern = '%'.$term.'%';
                            $method = $index === 0 ? 'where' : 'orWhere';

                            $branchQuery->{$method}('name', $operator, $pattern)
                                ->{$method}('address', $operator, $pattern);
                        }
                    });
                }
            }

            $matchCount = (clone $query)->count();
            $maxBranches = max(1, (int) config('assistant.catalog_max_branches', 10));
            $branches = $query->limit($maxBranches)
                ->get([
                    'name',
                    'address',
                    'contact_number',
                    'pickup_available',
                ])
                ->map(fn (Branch $branch): array => [
                    'name' => (string) $branch->name,
                    'address' => (string) $branch->address,
                    'contact_number' => (string) $branch->contact_number,
                    'pickup_available' => (bool) $branch->pickup_available,
                ])
                ->values()
                ->all();

            Log::info('ALD Assistant live branch context retrieved.', [
                'intent' => $intent['intent'] ?? 'branch_details',
                'match_count' => $matchCount,
                'duration_ms' => (int) round((microtime(true) - $startedAt) * 1000),
            ]);

            return $this->encodeContext([
                'match_count' => $matchCount,
                'branches' => $branches,
                'no_match_message' => $matchCount === 0
                    ? 'No matching active ALD branch was found.'
                    : null,
            ]);
        } catch (AssistantUnavailableException $exception) {
            throw $exception;
        } catch (Throwable $exception) {
            Log::error('ALD Assistant live branch retrieval failed.', [
                'exception' => $exception::class,
                'duration_ms' => (int) round((microtime(true) - $startedAt) * 1000),
            ]);

            throw AssistantUnavailableException::unavailable('catalog_unavailable');
        }
    }

    /**
     * @param  array<string, mixed>  $context
     */
    private function encodeContext(array $context): string
    {
        $encoded = json_encode(
            [
                'source' => 'CURRENT_BRANCH_DATA',
                'data' => $context,
            ],
            JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE,
        );

        if (! is_string($encoded)) {
            throw AssistantUnavailableException::unavailable('catalog_unavailable');
        }

        return $encoded;
    }
}
