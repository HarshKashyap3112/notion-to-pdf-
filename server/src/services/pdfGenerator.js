import { chromium } from 'playwright';
import fs from 'fs-extra';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
import { generateTocHtml } from './tocGenerator.js';

/**
 * Compiles all processed pages, assets, and optional TOC into a single unified HTML document.
 */
export function buildUnifiedHtml(pages, masterStyles, options = {}) {
  const generateToc = options.generateToc !== false;

  let tocSection = '';
  if (generateToc) {
    tocSection = generateTocHtml(pages, { title: 'Table of Contents' });
  }

  const pagesHtml = pages.map((page, idx) => {
    // Extract inner content from body or article
    const $ = page.$;
    let contentHtml = '';
    if ($('article.page').length > 0) {
      contentHtml = $('article.page').html();
    } else if ($('body').length > 0) {
      contentHtml = $('body').html();
    } else {
      contentHtml = $.html();
    }

    return `
      <section class="notion-page-section" id="notion-page-${page.id}" data-page-index="${idx}">
        <div class="notion-page-content">
          ${contentHtml}
        </div>
      </section>
    `;
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Notion Document Export</title>
  <style>
    ${masterStyles}
  </style>
</head>
<body>
  <div class="notion-pdf-document">
    ${tocSection}
    ${pagesHtml}
  </div>
</body>
</html>`;
}

/**
 * Generates a professional PDF from unified HTML using Playwright Chromium.
 * 
 * @param {string} htmlContent - Unified document HTML
 * @param {string} outputPath - Destination file path for generated PDF
 * @param {object} options - Config options: paperSize, margins, printBackground, generateBookmarks
 * @returns {Promise<{pdfPath: string, fileSize: number, pageCount: number}>}
 */
export async function generatePdf(htmlContent, outputPath, options = {}) {
  await fs.ensureDir(path.dirname(outputPath));

  const paperSize = options.paperSize || 'A4';
  const printBackground = options.printBackground !== false;
  const generateBookmarks = options.generateBookmarks !== false;
  const margins = options.margins || {
    top: '18mm',
    bottom: '18mm',
    left: '16mm',
    right: '16mm'
  };

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Set HTML content and wait for full DOM and network idle
    await page.setContent(htmlContent, {
      waitUntil: 'networkidle',
      timeout: 60000
    });

    // Ensure all images are fully loaded
    await page.evaluate(async () => {
      const selectors = Array.from(document.querySelectorAll('img'));
      await Promise.all(
        selectors.map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        })
      );
    });

    // Generate PDF with bookmarks (outline)
    await page.pdf({
      path: outputPath,
      format: paperSize,
      printBackground,
      outline: generateBookmarks,
      margin: margins,
      preferCSSPageSize: true
    });

    // Inspect generated PDF for exact page count and file size
    const pdfBytes = await fs.readFile(outputPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pageCount = pdfDoc.getPageCount();
    const fileSize = pdfBytes.length;

    return {
      pdfPath: outputPath,
      fileSize,
      pageCount
    };
  } finally {
    await browser.close();
  }
}
