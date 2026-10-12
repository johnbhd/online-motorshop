<?php

namespace Tests\Unit;

use App\Services\Assistant\AldCatalogIntentResolver;
use PHPUnit\Framework\TestCase;

class AssistantCatalogIntentResolverTest extends TestCase
{
    private AldCatalogIntentResolver $resolver;

    protected function setUp(): void
    {
        parent::setUp();

        $this->resolver = new AldCatalogIntentResolver;
    }

    public function test_generic_catalog_questions_resolve_to_catalog_list_without_filler_terms(): void
    {
        $messages = [
            'What products do you have?',
            'Tell me about your products.',
            'Show me your products.',
            'Show me what you have.',
            'What do you sell?',
            'What items do you carry?',
            'Can I see your catalog?',
            'Do you know any products?',
            'Give me some products.',
            'What can I buy here?',
        ];

        foreach ($messages as $message) {
            $result = $this->resolver->resolve($message);

            $this->assertSame('catalog_list', $result['intent'], $message);
            $this->assertSame([], $result['search_terms'], $message);
        }
    }

    public function test_catalog_count_questions_resolve_to_catalog_count(): void
    {
        $messages = [
            'How many products do you have?',
            'How many products are there now?',
            "What's the current product count?",
            'How many items do you sell?',
            'How many parts are in your catalog?',
        ];

        foreach ($messages as $message) {
            $result = $this->resolver->resolve($message);

            $this->assertSame('catalog_count', $result['intent'], $message);
            $this->assertSame([], $result['search_terms'], $message);
        }
    }

    public function test_specific_product_questions_keep_meaningful_terms(): void
    {
        $messages = [
            'Do you have batteries?',
            'Show motorcycle batteries.',
            'Honda motorcycle battery.',
            'Do you sell brake pads?',
            'Show engine oil.',
        ];

        foreach ($messages as $message) {
            $result = $this->resolver->resolve($message);

            $this->assertSame('product_search', $result['intent'], $message);
            $this->assertNotSame([], $result['search_terms'], $message);
            $this->assertNotContains('show', $result['search_terms'], $message);
            $this->assertNotContains('have', $result['search_terms'], $message);
            $this->assertNotContains('sell', $result['search_terms'], $message);
        }
    }

    public function test_specific_terms_override_generic_catalog_wording(): void
    {
        $messages = [
            'Tell me about Honda batteries.',
            'Show me your brake pads.',
            'Can you show me Yamaha parts?',
            'What products do you have for Suzuki?',
        ];

        foreach ($messages as $message) {
            $result = $this->resolver->resolve($message);

            $this->assertSame('product_search', $result['intent'], $message);
            $this->assertNotSame([], $result['search_terms'], $message);
        }
    }

    public function test_unrecognized_product_request_with_meaningful_terms_does_not_become_a_catalog_list(): void
    {
        $result = $this->resolver->resolve('Do you have a quantum sprocket?');

        $this->assertSame('product_search', $result['intent']);
        $this->assertSame(['quantum', 'sprocket'], $result['search_terms']);
    }
}
