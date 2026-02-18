<?php

namespace Tests\Unit\Services;

use App\Services\HtmlSanitizer;
use Tests\TestCase;

class HtmlSanitizerTest extends TestCase
{
    public function test_strips_script_tags(): void
    {
        $html = '<p>Hello</p><script>alert("xss")</script><strong>world</strong>';
        $result = HtmlSanitizer::sanitize($html);

        $this->assertStringNotContainsString('<script>', $result);
        $this->assertStringNotContainsString('alert', $result);
        $this->assertStringContainsString('<strong>world</strong>', $result);
    }

    public function test_strips_event_handler_attributes(): void
    {
        $html = '<p onclick="alert(1)">Click me</p>';
        $result = HtmlSanitizer::sanitize($html);

        $this->assertStringNotContainsString('onclick', $result);
        $this->assertStringContainsString('<p>Click me</p>', $result);
    }

    public function test_strips_javascript_href(): void
    {
        $html = '<a href="javascript:alert(1)">Click</a>';
        $result = HtmlSanitizer::sanitize($html);

        $this->assertStringNotContainsString('javascript:', $result);
        $this->assertStringContainsString('<a>Click</a>', $result);
    }

    public function test_allows_safe_href(): void
    {
        $html = '<a href="https://example.com">Link</a>';
        $result = HtmlSanitizer::sanitize($html);

        $this->assertStringContainsString('href="https://example.com"', $result);
    }

    public function test_allows_mailto_href(): void
    {
        $html = '<a href="mailto:test@example.com">Email</a>';
        $result = HtmlSanitizer::sanitize($html);

        $this->assertStringContainsString('href="mailto:test@example.com"', $result);
    }

    public function test_strips_style_attribute(): void
    {
        $html = '<p style="background:url(javascript:alert(1))">Text</p>';
        $result = HtmlSanitizer::sanitize($html);

        $this->assertStringNotContainsString('style', $result);
        $this->assertStringContainsString('<p>Text</p>', $result);
    }

    public function test_strips_onerror_from_img_tags(): void
    {
        // img is not in allowed tags, so it should be stripped entirely
        $html = '<p>Before</p><img src="x" onerror="alert(1)"><p>After</p>';
        $result = HtmlSanitizer::sanitize($html);

        $this->assertStringNotContainsString('<img', $result);
        $this->assertStringNotContainsString('onerror', $result);
    }

    public function test_preserves_allowed_formatting_tags(): void
    {
        $html = '<h1>Title</h1><p>A <strong>bold</strong> and <em>italic</em> text with <u>underline</u>.</p>';
        $result = HtmlSanitizer::sanitize($html);

        $this->assertStringContainsString('<h1>Title</h1>', $result);
        $this->assertStringContainsString('<strong>bold</strong>', $result);
        $this->assertStringContainsString('<em>italic</em>', $result);
        $this->assertStringContainsString('<u>underline</u>', $result);
    }

    public function test_preserves_lists(): void
    {
        $html = '<ul><li>Item 1</li><li>Item 2</li></ul>';
        $result = HtmlSanitizer::sanitize($html);

        $this->assertStringContainsString('<ul>', $result);
        $this->assertStringContainsString('<li>Item 1</li>', $result);
    }

    public function test_strips_disallowed_attributes_from_allowed_tags(): void
    {
        $html = '<p class="evil" id="inject">Text</p>';
        $result = HtmlSanitizer::sanitize($html);

        $this->assertStringNotContainsString('class', $result);
        $this->assertStringNotContainsString('id=', $result);
        $this->assertStringContainsString('<p>Text</p>', $result);
    }

    public function test_word_count(): void
    {
        $html = '<p>Hello world. This is a <strong>test</strong>.</p>';
        $count = HtmlSanitizer::wordCount($html);

        $this->assertEquals(6, $count);
    }

    public function test_empty_string(): void
    {
        $this->assertEquals('', HtmlSanitizer::sanitize(''));
        $this->assertEquals(0, HtmlSanitizer::wordCount(''));
    }

    public function test_strips_data_uri_href(): void
    {
        $html = '<a href="data:text/html,<script>alert(1)</script>">Click</a>';
        $result = HtmlSanitizer::sanitize($html);

        $this->assertStringNotContainsString('data:', $result);
    }
}
