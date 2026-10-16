/**
 * Small helpers for reading real essay HTML on the client.
 * Everything here derives from the post's own content — nothing is invented.
 */

/** Strip tags and collapse whitespace. */
export function plainText(html = '') {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function wordCount(html = '') {
  const text = plainText(html);
  return text ? text.split(/\s+/).length : 0;
}

/** The opening line of a piece — used when an author left the summary empty. */
export function openingLine(html = '', maxLength = 150) {
  const text = plainText(html);
  if (!text) return '';
  const match = text.match(/^.*?[.!?](?=\s|$)/);
  const sentence = match ? match[0] : text;
  if (sentence.length <= maxLength) return sentence;
  return `${sentence.slice(0, maxLength).replace(/\s+\S*$/, '')}…`;
}

/**
 * The essay's own section headings, in order, with a slug we can scroll to.
 * Returns [] for pieces that are one unbroken run of prose, which is the
 * common case for short poems and letters.
 */
export function headingsFrom(html = '') {
  const found = [];
  const re = /<(h2|h3)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let match;
  let index = 0;
  while ((match = re.exec(html)) !== null) {
    const text = plainText(match[2]);
    if (!text) continue;
    found.push({
      id: `section-${index}`,
      level: match[1].toLowerCase() === 'h2' ? 2 : 3,
      text,
    });
    index += 1;
  }
  return found;
}

/**
 * Give every h2/h3 in the rendered HTML the same id that `headingsFrom`
 * generated, so the margin reading line can jump to it.
 */
export function withHeadingAnchors(html = '') {
  let index = 0;
  return html.replace(/<(h2|h3)(\b[^>]*)>/gi, (full, tag, attrs) => {
    if (/\bid\s*=/.test(attrs)) return full;
    const id = `section-${index}`;
    index += 1;
    return `<${tag}${attrs} id="${id}">`;
  });
}
