<?php

namespace App\Services;

class HtmlSanitizer
{
    /**
     * Tags allowed in document content.
     */
    private const ALLOWED_TAGS = [
        'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'strong', 'em', 'u', 's',
        'ul', 'ol', 'li',
        'blockquote', 'code', 'pre',
        'a', 'br',
    ];

    /**
     * Attributes allowed per tag. Tags not listed here get all attributes stripped.
     */
    private const ALLOWED_ATTRIBUTES = [
        'a' => ['href', 'title', 'target', 'rel'],
    ];

    /**
     * URL schemes allowed in href attributes.
     */
    private const ALLOWED_PROTOCOLS = ['http', 'https', 'mailto'];

    /**
     * Sanitize HTML content by stripping disallowed tags, attributes, and dangerous URLs.
     */
    public static function sanitize(string $html): string
    {
        if (trim($html) === '') {
            return '';
        }

        // First pass: strip disallowed tags
        $allowedTagString = '<' . implode('><', self::ALLOWED_TAGS) . '>';
        $html = strip_tags($html, $allowedTagString);

        // Second pass: parse with DOMDocument to strip dangerous attributes
        $dom = new \DOMDocument();
        // Suppress warnings from malformed HTML; wrap in UTF-8 envelope
        @$dom->loadHTML(
            '<?xml encoding="UTF-8"><body>' . $html . '</body>',
            LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD
        );

        self::sanitizeNode($dom->documentElement);

        // Extract the sanitized inner HTML of <body>
        $body = $dom->getElementsByTagName('body')->item(0);
        if (!$body) {
            return '';
        }

        $output = '';
        foreach ($body->childNodes as $child) {
            $output .= $dom->saveHTML($child);
        }

        return $output;
    }

    /**
     * Count words from HTML content.
     */
    public static function wordCount(string $html): int
    {
        $plainText = strip_tags($html);
        return str_word_count($plainText);
    }

    /**
     * Recursively sanitize a DOM node — remove disallowed attributes and dangerous URLs.
     */
    private static function sanitizeNode(\DOMNode $node): void
    {
        if ($node instanceof \DOMElement) {
            $tagName = strtolower($node->tagName);
            $allowedAttrs = self::ALLOWED_ATTRIBUTES[$tagName] ?? [];

            // Collect attributes to remove (can't modify while iterating)
            $toRemove = [];
            foreach ($node->attributes as $attr) {
                $attrName = strtolower($attr->name);

                // Remove event handlers unconditionally
                if (str_starts_with($attrName, 'on')) {
                    $toRemove[] = $attr->name;
                    continue;
                }

                // Remove style attribute (prevents CSS-based attacks)
                if ($attrName === 'style') {
                    $toRemove[] = $attr->name;
                    continue;
                }

                // Remove any attribute not in the allowed list
                if (!in_array($attrName, $allowedAttrs, true)) {
                    $toRemove[] = $attr->name;
                    continue;
                }

                // Sanitize URL attributes
                if ($attrName === 'href') {
                    $url = trim($attr->value);
                    $scheme = parse_url($url, PHP_URL_SCHEME);
                    if ($scheme !== null && !in_array(strtolower($scheme), self::ALLOWED_PROTOCOLS, true)) {
                        $toRemove[] = $attr->name;
                    }
                }
            }

            foreach ($toRemove as $attrName) {
                $node->removeAttribute($attrName);
            }
        }

        // Recurse into children
        if ($node->hasChildNodes()) {
            // Iterate over a static list since the DOM may change
            $children = [];
            foreach ($node->childNodes as $child) {
                $children[] = $child;
            }
            foreach ($children as $child) {
                self::sanitizeNode($child);
            }
        }
    }
}
