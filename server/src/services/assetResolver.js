import fs from 'fs-extra';
import path from 'path';

/**
 * MIME types lookup for image extensions.
 */
const MIME_TYPES = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon'
};

/**
 * Creates a graceful fallback placeholder data URI for missing images.
 */
function createFallbackImageUri(filename) {
  const safeName = (filename || 'Image').replace(/[<>&"]/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="100" viewBox="0 0 300 100">
    <rect width="300" height="100" fill="#f8f9fa" stroke="#e2e8f0" stroke-width="2" rx="4"/>
    <text x="150" y="45" font-family="sans-serif" font-size="12" fill="#64748b" text-anchor="middle">🖼️ [Image Not Found]</text>
    <text x="150" y="65" font-family="sans-serif" font-size="10" fill="#94a3b8" text-anchor="middle">${safeName}</text>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

/**
 * Resolves images and stylesheets across all pages and embeds them safely.
 * 
 * @param {string} rootDir - Base folder of the extracted Notion export
 * @param {Array<object>} pages - List of crawled page objects
 * @param {object} options - Options including paperSize, margins
 * @returns {Promise<{masterStyles: string}>}
 */
export async function resolveAssetsAndStyles(rootDir, pages, options = {}) {
  const paperSize = options.paperSize || 'A4';
  const customCssSet = new Set();
  const collectedStyles = [];

  // 1. Resolve and embed images as Data URIs for complete offline portability in PDF
  for (const page of pages) {
    const $ = page.$;
    const pageDir = path.dirname(path.join(rootDir, page.relativePath));

    const imgPromises = [];
    $('img').each((_, el) => {
      const src = $(el).attr('src');
      if (!src) return;

      const trimmedSrc = src.trim();
      // Skip already inlined data URLs or external web images
      if (trimmedSrc.startsWith('data:') || trimmedSrc.startsWith('http://') || trimmedSrc.startsWith('https://')) {
        return;
      }

      const decodedSrc = decodeURIComponent(trimmedSrc.split('?')[0]);
      const imgPath = path.resolve(pageDir, decodedSrc);

      imgPromises.push((async () => {
        try {
          if (await fs.pathExists(imgPath)) {
            const ext = path.extname(imgPath).toLowerCase();
            const mimeType = MIME_TYPES[ext] || 'image/png';
            const imgBuffer = await fs.readFile(imgPath);
            const base64 = imgBuffer.toString('base64');
            $(el).attr('src', `data:${mimeType};base64,${base64}`);
          } else {
            console.warn(`[AssetResolver] Image missing: "${trimmedSrc}" in page "${page.relativePath}"`);
            $(el).attr('src', createFallbackImageUri(path.basename(decodedSrc)));
            $(el).addClass('notion-missing-image');
          }
        } catch (err) {
          console.warn(`[AssetResolver] Error processing image "${trimmedSrc}": ${err.message}`);
          $(el).attr('src', createFallbackImageUri(path.basename(decodedSrc)));
        }
      })());
    });

    await Promise.all(imgPromises);

    // 2. Collect stylesheets from this page
    for (const cssRelPath of page.stylesheets) {
      if (!customCssSet.has(cssRelPath)) {
        customCssSet.add(cssRelPath);
        const cssFullPath = path.join(rootDir, cssRelPath);
        if (await fs.pathExists(cssFullPath)) {
          const cssContent = await fs.readFile(cssFullPath, 'utf8');
          collectedStyles.push(cssContent);
        }
      }
    }
  }

  // 3. Build comprehensive Print CSS complying with BRD Section 16, 17, 18
  const printCss = `
    /* Print & Pagination Optimization */
    @page {
      size: ${paperSize};
      margin: 18mm 16mm 18mm 16mm;
    }

    @media print {
      body {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      .notion-page-section {
        page-break-before: always !important;
        break-before: page !important;
      }

      .notion-page-section:first-of-type {
        page-break-before: auto !important;
        break-before: auto !important;
      }

      h1, h2, h3, h4, h5, h6 {
        page-break-after: avoid !important;
        break-after: avoid !important;
      }

      img, figure, table, pre, blockquote, .callout {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }

      pre {
        white-space: pre-wrap !important;
        word-break: break-word !important;
        overflow-wrap: break-word !important;
      }

      a {
        text-decoration: underline;
      }
    }

    /* Core Notion Layout Styles */
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
      color: #37352f;
      line-height: 1.6;
      background: #ffffff;
      padding: 0;
      margin: 0;
    }

    .notion-pdf-document {
      max-width: 100%;
      margin: 0 auto;
    }

    .notion-page-section {
      padding: 20px 0;
      margin-bottom: 30px;
    }

    .notion-page-section:not(:first-child) {
      border-top: 1px solid #f0f0f0;
      padding-top: 30px;
    }

    .notion-page-title-banner {
      font-size: 2rem;
      font-weight: 700;
      margin-bottom: 1.2rem;
      color: #111827;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 8px;
    }

    img {
      max-width: 100% !important;
      height: auto !important;
      border-radius: 4px;
    }

    pre {
      background: #f7f6f3 !important;
      border: 1px solid #e5e7eb !important;
      border-radius: 6px !important;
      padding: 14px !important;
      font-family: "SFMono-Regular", Consolas, Menlo, monospace !important;
      font-size: 0.88rem !important;
      line-height: 1.45 !important;
      white-space: pre-wrap !important;
      word-break: break-word !important;
    }

    code {
      font-family: "SFMono-Regular", Consolas, Menlo, monospace !important;
      background: rgba(135, 131, 120, 0.15) !important;
      border-radius: 3px !important;
      padding: 2px 4px !important;
    }

    pre code {
      background: none !important;
      padding: 0 !important;
    }

    .callout {
      display: flex !important;
      background: #f1f1ef !important;
      border-radius: 6px !important;
      padding: 14px 18px !important;
      margin: 14px 0 !important;
      border-left: 4px solid #94a3b8 !important;
    }

    table {
      width: 100% !important;
      border-collapse: collapse !important;
      margin: 16px 0 !important;
      font-size: 0.95rem !important;
    }

    th, td {
      border: 1px solid #e5e7eb !important;
      padding: 8px 12px !important;
      text-align: left !important;
    }

    th {
      background: #f9fafb !important;
      font-weight: 600 !important;
    }

    .notion-broken-link {
      color: #94a3b8 !important;
      text-decoration: underline dotted !important;
    }
  `;

  const masterStyles = collectedStyles.join('\n\n') + '\n\n' + printCss;

  return {
    masterStyles
  };
}
