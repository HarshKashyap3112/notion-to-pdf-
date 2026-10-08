import path from 'path';

/**
 * Resolves and rewrites links across all crawled pages so that:
 * 1. Internal HTML file links -> point to unified PDF page fragment anchors (#notion-page-xxx)
 * 2. Cross-page and in-page anchor links -> point to unified fragment anchors (#notion-anchor-xxx)
 * 3. External URLs -> preserved with target="_blank"
 * 
 * @param {Array<object>} pages - List of crawled page objects with Cheerio instances ($)
 * @param {Map<string, object>} pageByPath - Map of normalized relative paths to page objects
 * @param {object} options - { preserveInternalLinks, preserveExternalLinks }
 */
export function resolveLinks(pages, pageByPath, options = {}) {
  const preserveInternalLinks = options.preserveInternalLinks !== false;
  const preserveExternalLinks = options.preserveExternalLinks !== false;

  // Step 1: Prefix/namespace all IDs inside each page to prevent collisions
  for (const page of pages) {
    const $ = page.$;

    // Namespace existing element IDs
    $('[id]').each((_, el) => {
      const origId = $(el).attr('id');
      if (origId && !origId.startsWith('notion-anchor-') && !origId.startsWith('notion-page-')) {
        $(el).attr('id', `notion-anchor-${page.id}-${origId}`);
      }
    });

    // Ensure headings have deterministic scoped IDs
    for (const h of page.headings) {
      // If heading element has an originalId, it's now notion-anchor-${page.id}-${origId}
      // If it didn't, attach the generated ID
      const matchingEl = $(`h1, h2, h3, h4`).filter((_, el) => {
        return $(el).text().trim() === h.text;
      }).first();

      if (matchingEl.length && !matchingEl.attr('id')) {
        matchingEl.attr('id', `notion-anchor-${page.id}-${h.originalId}`);
      }
    }
  }

  // Step 2: Rewrite all links
  for (const page of pages) {
    const $ = page.$;
    const currentDir = path.dirname(page.relativePath);

    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (!href) return;

      const trimmedHref = href.trim();

      // External link handling
      if (
        trimmedHref.startsWith('http://') ||
        trimmedHref.startsWith('https://') ||
        trimmedHref.startsWith('mailto:')
      ) {
        if (preserveExternalLinks) {
          $(el).attr('target', '_blank');
          $(el).attr('rel', 'noopener noreferrer');
        } else {
          $(el).removeAttr('href');
        }
        return;
      }

      // If preserving internal links is disabled
      if (!preserveInternalLinks) {
        if (!trimmedHref.startsWith('http')) {
          $(el).removeAttr('href');
        }
        return;
      }

      // In-page anchor link: #something
      if (trimmedHref.startsWith('#')) {
        const rawAnchor = trimmedHref.substring(1);
        $(el).attr('href', `#notion-anchor-${page.id}-${rawAnchor}`);
        return;
      }

      // Internal page link: page.html or subfolder/page.html or page.html#section
      if (!trimmedHref.startsWith('javascript:')) {
        const [filePathPart, hashPart] = trimmedHref.split('#');
        const decodedPart = decodeURIComponent(filePathPart);
        const resolvedTargetRelPath = path.join(currentDir, decodedPart).replace(/\\/g, '/');

        const targetPage = pageByPath.get(resolvedTargetRelPath);

        if (targetPage) {
          if (hashPart) {
            // Links to a specific anchor on target page
            $(el).attr('href', `#notion-anchor-${targetPage.id}-${hashPart}`);
          } else {
            // Links to target page itself
            $(el).attr('href', `#notion-page-${targetPage.id}`);
          }
        } else {
          // Check if resolved without extension or alternative extension
          let found = false;
          for (const [p, pObj] of pageByPath.entries()) {
            if (path.basename(p).toLowerCase() === path.basename(resolvedTargetRelPath).toLowerCase()) {
              if (hashPart) {
                $(el).attr('href', `#notion-anchor-${pObj.id}-${hashPart}`);
              } else {
                $(el).attr('href', `#notion-page-${pObj.id}`);
              }
              found = true;
              break;
            }
          }
          if (!found) {
            // Unresolved target, keep text visible, add data attribute
            $(el).attr('data-unresolved-href', href);
            $(el).addClass('notion-broken-link');
          }
        }
      }
    });
  }
}
