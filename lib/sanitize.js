/**
 * Allowlist-based HTML Sanitizer for Essay Content.
 * Prevents Stored XSS by stripping dangerous tags, event handlers, and malicious URIs.
 */

const ALLOWED_TAGS = new Set([
  'p', 'br', 'b', 'i', 'strong', 'em', 'u', 's', 'strike',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'blockquote', 'code', 'pre',
  'ul', 'ol', 'li',
  'a', 'img', 'hr', 'span', 'div', 'sub', 'sup',
  'table', 'thead', 'tbody', 'tr', 'th', 'td'
]);

const DANGEROUS_TAGS_WITH_CONTENT = new Set([
  'script', 'style', 'iframe', 'object', 'embed',
  'applet', 'frame', 'frameset', 'meta', 'link',
  'form', 'input', 'button', 'svg', 'math', 'base', 'noscript'
]);

const ALLOWED_ATTRS = {
  a: new Set(['href', 'title', 'target', 'rel']),
  img: new Set(['src', 'alt', 'title', 'width', 'height']),
  '*': new Set(['class'])
};

const DANGEROUS_PROTOCOLS = /^\s*(javascript|vbscript|data:text\/html):/i;

export function sanitizeHtml(input) {
  if (typeof input !== 'string') return '';
  if (!input.trim()) return '';

  let sanitized = input;

  // 1. Remove dangerous tags along with their inner content
  for (const tag of DANGEROUS_TAGS_WITH_CONTENT) {
    const reg = new RegExp(`<${tag}[^>]*>[\\s\\S]*?<\\/${tag}>`, 'gi');
    sanitized = sanitized.replace(reg, '');
    const selfClosingReg = new RegExp(`<${tag}[^>]*\\/?>`, 'gi');
    sanitized = sanitized.replace(selfClosingReg, '');
  }

  // 2. Process all remaining HTML tags using regex parser/traverser
  sanitized = sanitized.replace(/<(\/?)([a-z0-9-]+)([^>]*)>/gi, (fullMatch, isClosing, tagName, attrStr) => {
    const tag = tagName.toLowerCase();

    // If tag is not in allowlist, strip the tag
    if (!ALLOWED_TAGS.has(tag)) {
      return '';
    }

    if (isClosing) {
      return `</${tag}>`;
    }

    // Parse attributes safely
    const cleanAttrs = [];
    const attrRegex = /([a-z0-9-:]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/gi;
    let match;

    while ((match = attrRegex.exec(attrStr)) !== null) {
      const attrName = match[1].toLowerCase();
      const attrValue = match[2] ?? match[3] ?? match[4] ?? '';

      // Block any inline event handler (e.g. onload, onerror, onclick)
      if (attrName.startsWith('on')) {
        continue;
      }

      // Check allowed attributes for this tag
      const allowedForTag = ALLOWED_ATTRS[tag] || new Set();
      const allowedGlobal = ALLOWED_ATTRS['*'] || new Set();

      if (!allowedForTag.has(attrName) && !allowedGlobal.has(attrName)) {
        continue;
      }

      // Validate URI attributes (href, src)
      if (attrName === 'href' || attrName === 'src') {
        if (DANGEROUS_PROTOCOLS.test(attrValue)) {
          continue;
        }
      }

      cleanAttrs.push(`${attrName}="${escapeAttr(attrValue)}"`);
    }

    const attrFormatted = cleanAttrs.length > 0 ? ' ' + cleanAttrs.join(' ') : '';
    const isSelfClosing = (tag === 'br' || tag === 'hr' || tag === 'img');
    return `<${tag}${attrFormatted}${isSelfClosing ? ' />' : '>'}`;
  });

  return sanitized;
}

function escapeAttr(val) {
  return String(val)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
