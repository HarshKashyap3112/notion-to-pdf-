import fs from 'fs-extra';
import path from 'path';
import * as cheerio from 'cheerio';

/**
 * Normalizes a relative POSIX-style path.
 */
function normalizeRelPath(p) {
  return p.replace(/\\/g, '/').replace(/^\.\//, '');
}

/**
 * Creates a URL-safe, deterministic identifier slug for a page.
 */
function createPageId(index, relativePath) {
  const base = path.basename(relativePath, path.extname(relativePath))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return `p${index}-${base || 'page'}`;
}

/**
 * Recursively crawls HTML pages starting from mainPage.
 * 
 * @param {string} rootDir - Base folder containing files
 * @param {string} mainPageRelPath - Relative path to starting page
 * @param {object} options - { includeSubpages: boolean }
 * @returns {Promise<{pages: Array<object>, pageByPath: Map<string, object>}>}
 */
export async function crawlPages(rootDir, mainPageRelPath, options = {}) {
  const includeSubpages = options.includeSubpages !== false;
  const normalizedMainPage = normalizeRelPath(mainPageRelPath);

  const visited = new Set();
  const pages = [];
  const pageByPath = new Map();

  let pageIndexCounter = 0;

  /**
   * Reads and parses a single HTML page.
   */
  async function processPage(relPath) {
    const normPath = normalizeRelPath(relPath);
    if (visited.has(normPath)) return null;
    visited.add(normPath);

    const fullPath = path.join(rootDir, normPath);
    if (!(await fs.pathExists(fullPath))) {
      return null;
    }

    const htmlContent = await fs.readFile(fullPath, 'utf8');
    const $ = cheerio.load(htmlContent);

    const title = $('h1.page-title').first().text().trim() ||
      $('title').text().trim() ||
      $('h1').first().text().trim() ||
      path.basename(normPath, path.extname(normPath));

    const pageId = createPageId(pageIndexCounter++, normPath);

    const headings = [];
    $('h1, h2, h3, h4').each((idx, el) => {
      const $el = $(el);
      const level = parseInt(el.tagName.substring(1), 10);
      const text = $el.text().trim();
      const origId = $el.attr('id') || `heading-${idx}`;
      headings.push({
        level,
        text,
        originalId: origId,
        id: `h-${pageId}-${idx}`
      });
    });

    const links = [];
    const childPagesToVisit = [];

    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (!href) return;

      const trimmedHref = href.trim();
      if (
        trimmedHref.startsWith('http://') ||
        trimmedHref.startsWith('https://') ||
        trimmedHref.startsWith('mailto:')
      ) {
        links.push({
          type: 'external',
          url: trimmedHref,
          text: $(el).text().trim()
        });
      } else if (trimmedHref.startsWith('#')) {
        // In-page anchor
        links.push({
          type: 'anchor',
          anchor: trimmedHref.substring(1),
          targetPage: normPath
        });
      } else if (!trimmedHref.startsWith('javascript:')) {
        // Internal page link (might have hash #anchor)
        const [filePathPart, hashPart] = trimmedHref.split('#');
        const decodedPart = decodeURIComponent(filePathPart);
        
        // Resolve relative to current page's directory
        const currentDir = path.dirname(normPath);
        const resolvedTarget = normalizeRelPath(path.join(currentDir, decodedPart));

        const ext = path.extname(resolvedTarget).toLowerCase();
        if (ext === '.html' || ext === '.htm') {
          links.push({
            type: 'internal',
            targetPath: resolvedTarget,
            anchor: hashPart || null,
            originalHref: href,
            text: $(el).text().trim()
          });

          if (!visited.has(resolvedTarget)) {
            childPagesToVisit.push(resolvedTarget);
          }
        }
      }
    });

    const images = [];
    $('img[src]').each((_, el) => {
      const src = $(el).attr('src');
      if (src && !src.startsWith('data:') && !src.startsWith('http://') && !src.startsWith('https://')) {
        const decodedSrc = decodeURIComponent(src);
        const currentDir = path.dirname(normPath);
        const resolvedSrc = normalizeRelPath(path.join(currentDir, decodedSrc));
        images.push({
          originalSrc: src,
          resolvedRelPath: resolvedSrc,
          alt: $(el).attr('alt') || ''
        });
      }
    });

    const stylesheets = [];
    $('link[rel="stylesheet"]').each((_, el) => {
      const href = $(el).attr('href');
      if (href && !href.startsWith('http://') && !href.startsWith('https://')) {
        const decodedHref = decodeURIComponent(href);
        const currentDir = path.dirname(normPath);
        stylesheets.push(normalizeRelPath(path.join(currentDir, decodedHref)));
      }
    });

    const pageObj = {
      id: pageId,
      order: pageIndexCounter,
      title,
      relativePath: normPath,
      fullPath,
      headings,
      links,
      images,
      stylesheets,
      $,
      childPagesToVisit
    };

    return pageObj;
  }

  // Recursive DFS traversal
  async function crawlDfs(relPath) {
    const pageObj = await processPage(relPath);
    if (!pageObj) return;

    pages.push(pageObj);
    pageByPath.set(pageObj.relativePath, pageObj);

    for (const childPath of pageObj.childPagesToVisit) {
      if (!visited.has(childPath)) {
        await crawlDfs(childPath);
      }
    }
  }

  // Start with main page
  await crawlDfs(normalizedMainPage);

  // If includeSubpages is enabled, find any unvisited orphaned HTML files
  if (includeSubpages) {
    async function scanAllHtml(dir) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      const found = [];
      for (const entry of entries) {
        const p = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          found.push(...(await scanAllHtml(p)));
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (ext === '.html' || ext === '.htm') {
            found.push(normalizeRelPath(path.relative(rootDir, p)));
          }
        }
      }
      return found;
    }

    const allHtml = await scanAllHtml(rootDir);
    for (const file of allHtml) {
      if (!visited.has(file)) {
        await crawlDfs(file);
      }
    }
  }

  return {
    pages,
    pageByPath
  };
}
