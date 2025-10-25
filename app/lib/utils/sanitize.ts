/**
 * Simple HTML sanitization helpers.
 *
 * Goals:
 * - Strip obviously dangerous constructs (script tags, event handlers, javascript: URLs, inline styles).
 * - Allow a minimal, configurable set of tags and attributes for rich text rendering.
 * - Keep implementation lightweight with conservative defaults.
 *
 * IMPORTANT:
 * - Regex-based sanitization is not perfect. For untrusted arbitrary HTML in production,
 *   prefer a battle-tested sanitizer like DOMPurify. This module focuses on a pragmatic,
 *   dependency-free, defense-in-depth approach that covers common attack vectors.
 *
 * Suggested usage for news page rendering:
 *
 *   import { sanitizeHtmlSimple } from "@/app/lib/utils/sanitize";
 *
 *   // In the component:
 *   <div
 *     dangerouslySetInnerHTML={{
 *       __html: sanitizeHtmlSimple(article.content)
 *     }}
 *   />
 */

// Default allow lists for tags and attributes
export const defaultAllowedTags = [
  "b",
  "i",
  "em",
  "strong",
  "a",
  "p",
  "ul",
  "ol",
  "li",
  "br",
  "code",
  "pre",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "span",
] as const;

export const defaultAllowedAttrs = [
  "href",
  "target",
  "rel",
  "class",
  "title",
  "alt",
] as const;

export type SanitizeOptions = {
  allowedTags?: readonly string[];
  allowedAttrs?: readonly string[];
  // Replace newlines with <br/> after sanitization
  newlineToBr?: boolean;
};

// Regexes for quick removal of dangerous patterns
const SCRIPT_TAG_REGEX = /<\s*script\b[^>]*>[\s\S]*?<\s*\/\s*script\s*>/gi;
const EVENT_HANDLER_ATTR_REGEX = /\son[a-z]+\s*=\s*(['"]).*?\1/gi; // onload=, onclick=, etc.
const JS_URL_ATTR_REGEX =
  /(href|src)\s*=\s*(['"])\s*javascript:[^'"]*\2/gi; // javascript: URLs
const STYLE_ATTR_REGEX = /\sstyle\s*=\s*(['"]).*?\1/gi; // strip inline styles
const DANGEROUS_CONTAINER_TAGS =
  /<\s*(iframe|object|embed|link|meta|base)\b[^>]*>([\s\S]*?)<\s*\/\s*\1\s*>/gi;

// Attribute parser for allow-list filtering
const ATTR_PAIR_REGEX =
  /([a-z0-9:-]+)(\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'>]+))?/gi;

// Matches any tag opening/closing like <tag ...> or </tag>
const TAG_REGEX = /<\s*(\/)?\s*([a-z0-9]+)([^>]*)>/gi;

// Basic HTML escape for content fallback
export function escapeHtml(input: string): string {
  return (input || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Convert newlines to <br/>
export function newlineToBr(input: string): string {
  return (input || "").replace(/\n/g, "<br/>");
}

/**
 * Core sanitizer:
 * 1) Remove script tags, event handlers, javascript: URLs, and inline styles.
 * 2) Remove dangerous container tags (iframe/object/embed/link/meta/base).
 * 3) Allow only a minimal set of tags/attributes; escape everything else.
 * 4) Optionally convert newlines to <br/>.
 */
export function sanitizeHtmlSimple(
  html: string,
  opts: SanitizeOptions = {},
): string {
  if (!html) return "";

  const allowedTags = new Set(
    (opts.allowedTags || defaultAllowedTags).map((t) => t.toLowerCase()),
  );
  const allowedAttrs = new Set(
    (opts.allowedAttrs || defaultAllowedAttrs).map((a) => a.toLowerCase()),
  );

  // 1) Remove obviously dangerous constructs (broad strokes)
  let out = html;
  out = out.replace(SCRIPT_TAG_REGEX, "");
  out = out.replace(DANGEROUS_CONTAINER_TAGS, "");
  out = out.replace(EVENT_HANDLER_ATTR_REGEX, "");
  out = out.replace(JS_URL_ATTR_REGEX, '$1="#"');
  out = out.replace(STYLE_ATTR_REGEX, "");

  // 2) Tag-level allow listing with attribute filtering
  out = out.replace(TAG_REGEX, (_m, closingSlash, tagName, attrChunk) => {
    const name = String(tagName || "").toLowerCase();

    // If tag not allowed, escape the whole tag (show as text instead of rendering)
    if (!allowedTags.has(name)) {
      return escapeHtml(_m);
    }

    // Handle closing tags (e.g., </p>) for allowed tags
    if (closingSlash) {
      return `</${name}>`;
    }

    // Rebuild allowed attributes only
    let safeAttrs = "";
    if (attrChunk && attrChunk.trim()) {
      safeAttrs = buildAllowedAttributes(attrChunk, allowedAttrs);
    }

    // Self-closing if original looked like it or if tag is "br"
    const selfClosing = /\/\s*$/.test(attrChunk || "") || name === "br";
    return `<${name}${safeAttrs}${selfClosing ? " /" : ""}>`;
  });

  // 3) Optionally convert newlines to <br/>
  if (opts.newlineToBr) {
    out = newlineToBr(out);
  }

  return out;
}

/**
 * Filter attributes to the allowed set and normalize safe values.
 * - Keeps attribute names only if in allow list
 * - Strips javascript: URLs if they made it here (defense-in-depth)
 * - Normalizes target rel for anchors (noopener noreferrer)
 */
function buildAllowedAttributes(
  rawAttrs: string,
  allowedAttrs: Set<string>,
): string {
  let result = "";

  // Iterate attribute pairs
  rawAttrs.replace(ATTR_PAIR_REGEX, (m, rawName, rawValue) => {
    const name = String(rawName).toLowerCase();

    // Disallow any event handler attributes just in case
    if (name.startsWith("on")) {
      return "";
    }

    // Not allowed -> drop
    if (!allowedAttrs.has(name)) {
      return "";
    }

    // Extract normalized value (strip quotes for processing, then re-quote)
    let value = "";
    if (rawValue && rawValue.includes("=")) {
      const eqIdx = rawValue.indexOf("=");
      let v = rawValue.slice(eqIdx + 1).trim();
      // remove surrounding quotes if present
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }

      // Defense-in-depth: drop javascript: URLs
      if (name === "href" || name === "src") {
        const lower = v.trim().toLowerCase();
        if (lower.startsWith("javascript:")) {
          v = "#";
        }
      }

      // Normalize target/rel for anchors
      if (name === "target") {
        // Only allow common safe targets
        const lower = v.toLowerCase();
        if (!["_blank", "_self", "_parent", "_top"].includes(lower)) {
          v = "_self";
        }
      }

      if (name === "rel") {
        // Ensure noopener noreferrer when using _blank (best-effort; may not know current target)
        if (!/\bnoopener\b/i.test(v) || !/\bnoreferrer\b/i.test(v)) {
          const parts = new Set(
            v
              .split(/\s+/)
              .map((x) => x.trim())
              .filter(Boolean),
          );
          parts.add("noopener");
          parts.add("noreferrer");
          v = Array.from(parts).join(" ");
        }
      }

      // Re-quote sanitized value
      value = `="${escapeAttributeValue(v)}"`;
    }

    result += ` ${name}${value}`;
    return "";
  });

  return result;
}

/**
 * Escape characters in attribute values to reduce injection risks.
 */
function escapeAttributeValue(v: string): string {
  return (v || "")
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Convenience wrapper to produce a React-compatible object
 * for dangerouslySetInnerHTML. This runs sanitizeHtmlSimple
 * with sane defaults and optional newline conversion.
 */
export function toSafeHtmlForReact(
  html: string,
  opts?: SanitizeOptions,
): { __html: string } {
  return {
    __html: sanitizeHtmlSimple(html, opts),
  };
}
