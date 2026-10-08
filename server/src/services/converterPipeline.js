import path from 'path';
import fs from 'fs-extra';
import { detectMainPage } from './mainPageDetector.js';
import { crawlPages } from './crawler.js';
import { resolveLinks } from './linkResolver.js';
import { resolveAssetsAndStyles } from './assetResolver.js';
import { buildUnifiedHtml, generatePdf } from './pdfGenerator.js';

/**
 * Executes the full conversion pipeline from an extracted folder to final PDF.
 * 
 * @param {string} sourceDir - Folder containing Notion HTML export
 * @param {string} outputPdfPath - Target PDF destination path
 * @param {object} options - Conversion settings
 * @param {Function} [onProgress] - Callback for reporting progress updates
 * @returns {Promise<object>} Pipeline result metadata
 */
export async function runConversionPipeline(sourceDir, outputPdfPath, options = {}, onProgress = () => {}) {
  // Step 1: Detect main page
  onProgress({ step: 'detect_main', percent: 15, message: 'Detecting main entry page...' });
  const { mainPage, candidates } = await detectMainPage(sourceDir, options.mainPage);

  // Step 2: Crawl HTML pages and hierarchy
  onProgress({ step: 'crawling', percent: 35, message: `Crawling Notion pages from ${mainPage}...` });
  const { pages, pageByPath } = await crawlPages(sourceDir, mainPage, {
    includeSubpages: options.includeSubpages !== false
  });

  if (pages.length === 0) {
    throw new Error('No readable pages discovered during crawling.');
  }

  // Step 3: Resolve internal links and anchors
  onProgress({ step: 'resolving_links', percent: 55, message: `Resolving internal navigation links across ${pages.length} pages...` });
  resolveLinks(pages, pageByPath, {
    preserveInternalLinks: options.preserveInternalLinks !== false,
    preserveExternalLinks: options.preserveExternalLinks !== false
  });

  // Step 4: Resolve images and stylesheets
  onProgress({ step: 'processing_assets', percent: 70, message: 'Processing images and optimizing print stylesheets...' });
  const { masterStyles } = await resolveAssetsAndStyles(sourceDir, pages, {
    paperSize: options.paperSize || 'A4'
  });

  // Step 5: Build unified document
  onProgress({ step: 'compiling_html', percent: 80, message: 'Assembling unified document and Table of Contents...' });
  const unifiedHtml = buildUnifiedHtml(pages, masterStyles, {
    generateToc: options.generateToc !== false
  });

  // Optionally save intermediate HTML for debugging/inspection if requested
  if (options.saveIntermediateHtml) {
    const debugHtmlPath = outputPdfPath.replace(/\.pdf$/i, '.html');
    await fs.writeFile(debugHtmlPath, unifiedHtml, 'utf8');
  }

  // Step 6: Playwright Chromium PDF generation
  onProgress({ step: 'rendering_pdf', percent: 90, message: 'Rendering PDF with Playwright Chromium engine...' });
  const pdfResult = await generatePdf(unifiedHtml, outputPdfPath, {
    paperSize: options.paperSize || 'A4',
    margins: options.margins,
    printBackground: options.printBackground !== false,
    generateBookmarks: options.generateBookmarks !== false
  });

  onProgress({ step: 'completed', percent: 100, message: 'PDF generated successfully.' });

  return {
    ...pdfResult,
    totalPagesFound: pages.length,
    mainPage,
    pagesList: pages.map(p => ({ id: p.id, title: p.title, relativePath: p.relativePath }))
  };
}
