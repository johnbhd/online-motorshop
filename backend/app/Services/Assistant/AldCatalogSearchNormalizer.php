<?php

namespace App\Services\Assistant;

class AldCatalogSearchNormalizer
{
    /**
     * @var array<string, array<int, string>>
     */
    private const PRODUCT_ALIASES = [
        'gulong' => ['tire', 'tires', 'wheel', 'wheels'],
        'preno' => ['brake', 'brakes'],
        'baterya' => ['battery', 'batteries'],
        'bateria' => ['battery', 'batteries'],
        'langis' => ['oil', 'engine oil'],
        'kadena' => ['chain', 'drive chain'],
        'ilaw' => ['light', 'headlight', 'bulb'],
        'tambutso' => ['exhaust', 'muffler'],
        'makina' => ['engine'],
        'shock' => ['shock', 'shock absorber', 'suspension'],
        'suspension' => ['suspension'],
        'filter' => ['filter', 'air filter'],
        'belt' => ['belt', 'drive belt'],
        'tyre' => ['tire', 'tires'],
    ];

    /**
     * @var array<string, array<int, string>>
     */
    private const PHRASE_ALIASES = [
        'langis ng makina' => ['engine oil', 'oil'],
        'ilaw sa harap' => ['headlight', 'light'],
        'kadena ng motor' => ['drive chain', 'chain'],
        'spark plug' => ['spark plug'],
        'drive belt' => ['drive belt', 'belt'],
    ];

    /**
     * @var array<int, string>
     */
    private const STOP_WORDS = [
        'a', 'about', 'and', 'an', 'ang', 'are', 'at', 'ba', 'bang', 'can',
        'carry', 'could', 'current', 'currently', 'do', 'does', 'din', 'dito',
        'diyan', 'doon', 'for', 'from', 'give', 'gusto', 'have', 'here', 'how',
        'i', 'in', 'inyong', 'is', 'ka', 'kayo', 'ko', 'lang', 'looking', 'many',
        'may', 'me', 'meron', 'mga', 'mo', 'more', 'my', 'na', 'naman', 'nga',
        'niyo', 'ninyo', 'now', 'of', 'offer', 'on', 'opo', 'para', 'parts',
        'please', 'po', 'pala', 'pakita', 'pede', 'pwede', 'rin', 'sa', 'see',
        'sell', 'show', 'siya', 'some', 'tell', 'the', 'there', 'this', 'thing',
        'things', 'tingnan', 'to', 'what', 'which', 'with', 'your', 'you', 'yung',
        'iyong', 'ipakita', 'ako', 'nyo',
        'ano', 'anong', 'alin', 'available', 'benta', 'binebenta', 'buy', 'catalog',
        'find', 'here', 'inventory', 'item', 'items', 'kind', 'mga', 'product',
        'products', 'selection', 'sku', 'code', 'ng', 'tinda', 'tindang', 'today',
        'know', 'some', 'many',
    ];

    public function normalize(string $message): string
    {
        $normalized = mb_strtolower(trim($message), 'UTF-8');
        $normalized = preg_replace('/[^\p{L}\p{N}&]+/u', ' ', $normalized) ?? $normalized;

        return trim(preg_replace('/\s+/u', ' ', $normalized) ?? $normalized);
    }

    /**
     * Return canonical catalog terms without treating aliases as fitment data.
     *
     * @return array<int, string>
     */
    public function searchTerms(string $message): array
    {
        $normalized = $this->normalize($message);
        $terms = [];

        foreach (self::PHRASE_ALIASES as $phrase => $aliases) {
            if (! $this->containsPhrase($normalized, $phrase)) {
                continue;
            }

            $terms = $this->appendUnique($terms, $aliases);
            $normalized = $this->removePhrase($normalized, $phrase);
        }

        $tokens = preg_split('/\s+/u', $normalized, -1, PREG_SPLIT_NO_EMPTY) ?: [];

        foreach ($tokens as $token) {
            if (mb_strlen($token, 'UTF-8') < 3 || in_array($token, self::STOP_WORDS, true)) {
                continue;
            }

            $aliasKey = array_key_exists($token, self::PRODUCT_ALIASES)
                ? $token
                : $this->singularize($token);
            $terms = $this->appendUnique(
                $terms,
                self::PRODUCT_ALIASES[$aliasKey] ?? [$aliasKey],
            );
        }

        return array_slice($terms, 0, 6);
    }

    public function hasKnownProductConcept(string $message): bool
    {
        $normalized = $this->normalize($message);

        foreach (array_keys(self::PHRASE_ALIASES) as $phrase) {
            if ($this->containsPhrase($normalized, $phrase)) {
                return true;
            }
        }

        foreach (array_keys(self::PRODUCT_ALIASES) as $alias) {
            if ($this->containsPhrase($normalized, $alias)) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param  array<int, string>  $terms
     * @param  array<int, string>  $candidates
     * @return array<int, string>
     */
    private function appendUnique(array $terms, array $candidates): array
    {
        foreach ($candidates as $candidate) {
            $candidate = trim(mb_strtolower($candidate, 'UTF-8'));

            if ($candidate !== '' && ! in_array($candidate, $terms, true)) {
                $terms[] = $candidate;
            }
        }

        return $terms;
    }

    private function containsPhrase(string $normalized, string $phrase): bool
    {
        return preg_match($this->phrasePattern($phrase), $normalized) === 1;
    }

    private function removePhrase(string $normalized, string $phrase): string
    {
        $removed = preg_replace($this->phrasePattern($phrase), ' ', $normalized);

        return trim(preg_replace('/\s+/u', ' ', $removed ?? $normalized) ?? $normalized);
    }

    private function phrasePattern(string $phrase): string
    {
        return '/(?<!\p{L})'.preg_quote($phrase, '/').'(?!(?:\p{L}))/u';
    }

    private function singularize(string $token): string
    {
        return match (true) {
            str_ends_with($token, 'ies') && mb_strlen($token, 'UTF-8') > 4 => mb_substr($token, 0, -3, 'UTF-8').'y',
            str_ends_with($token, 's') && mb_strlen($token, 'UTF-8') > 4 => mb_substr($token, 0, -1, 'UTF-8'),
            default => $token,
        };
    }
}
