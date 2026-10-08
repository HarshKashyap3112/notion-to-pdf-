import fs from 'fs-extra';
import path from 'path';
import * as cheerio from 'cheerio';

/**
 * Finds all HTML files in a directory recursively.
 */
async function findHtmlFiles(dir, baseDir = dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const htmlFiles = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = await findHtmlFiles(fullPath, baseDir);
      htmlFiles.push(...nested);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (ext === '.html' || ext === '.htm') {
        const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
        htmlFiles.push({ fullPath, relativePath });
      }
    }
  }

  return htmlFiles;
}

/**
 * Detects the most probable main entry HTML page in the directory.
 * 
 * @param {string} rootDir - Base directory where HTML files reside
 * @param {string} [preferredMainPage] - Optional user override
 * @returns {Promise<{mainPage: string, candidates: Array<{path: string, title: string, score: number}>}>}
 */
export async function detectMainPage(rootDir, preferredMainPage = null) {
  const htmlFiles = await findHtmlFiles(rootDir);

  if (htmlFiles.length === 0) {
    throw new Error('No HTML files found in the provided folder/archive.');
  }

  // If user provided a preferred main page that exists, use it
  if (preferredMainPage) {
    const userChoice = htmlFiles.find(f => f.relativePath === preferredMainPage || f.relativePath === preferredMainPage.replace(/\\/g, '/'));
    if (userChoice) {
      return {
        mainPage: userChoice.relativePath,
        candidates: htmlFiles.map(f => ({ path: f.relativePath, title: path.basename(f.relativePath), score: 0 }))
      };
    }
  }

  // Check direct index.html at root
  const rootIndex = htmlFiles.find(f => f.relativePath.toLowerCase() === 'index.html');

  const candidates = [];

  for (const file of htmlFiles) {
    let score = 0;
    const content = await fs.readFile(file.fullPath, 'utf8');
    const $ = cheerio.load(content);

    const title = $('title').text().trim() ||
      $('h1.page-title').text().trim() ||
      $('h1').first().text().trim() ||
      path.basename(file.relativePath, path.extname(file.relativePath));

    const basename = path.basename(file.relativePath).toLowerCase();
    const depth = file.relativePath.split('/').length - 1;

    // Shallow depth bonus
    score += Math.max(0, 10 - depth * 3);

    // Exact index name bonus
    if (basename === 'index.html' || basename === 'index.htm') {
      score += 100;
    }

    // Home / Readme bonus
    if (basename.includes('home') || basename.includes('overview') || basename.includes('readme')) {
      score += 30;
    }

    // Count local outgoing HTML links
    let outgoingLinksCount = 0;
    $('a[href]').each((_, el) => {
      const href = $(el).attr('href');
      if (href && !href.startsWith('http://') && !href.startsWith('https://') && !href.startsWith('mailto:') && !href.startsWith('#')) {
        const decodedHref = decodeURIComponent(href.split('#')[0]);
        if (decodedHref.endsWith('.html') || decodedHref.endsWith('.htm')) {
          outgoingLinksCount++;
        }
      }
    });

    score += outgoingLinksCount * 3;

    candidates.push({
      path: file.relativePath,
      title,
      score,
      outgoingLinksCount
    });
  }

  // Sort candidates by score descending
  candidates.sort((a, b) => b.score - a.score);

  const mainPage = rootIndex ? rootIndex.relativePath : candidates[0].path;

  return {
    mainPage,
    candidates: candidates.map(({ path, title, score }) => ({ path, title, score }))
  };
}
