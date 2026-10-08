import AdmZip from 'adm-zip';
import fs from 'fs-extra';
import path from 'path';
import { sanitizeAndResolvePath } from '../utils/sanitizePath.js';

const MAX_TOTAL_UNCOMPRESSED_BYTES = 250 * 1024 * 1024; // 250 MB
const MAX_ENTRY_COUNT = 5000;

/**
 * Extracts a ZIP file to an isolated destination folder with strict path traversal
 * and compression bomb protection.
 * 
 * @param {string} zipFilePath - Path to ZIP file
 * @param {string} destinationDir - Directory to extract contents to
 * @returns {Promise<{extractDir: string, htmlCount: number, imageCount: number, totalFiles: number}>}
 */
export async function extractZipSafely(zipFilePath, destinationDir) {
  await fs.ensureDir(destinationDir);

  const zip = new AdmZip(zipFilePath);
  const zipEntries = zip.getEntries();

  if (zipEntries.length > MAX_ENTRY_COUNT) {
    throw new Error(`Security Violation: ZIP contains too many entries (${zipEntries.length} > ${MAX_ENTRY_COUNT})`);
  }

  let totalUncompressedSize = 0;
  let htmlCount = 0;
  let imageCount = 0;
  let totalFiles = 0;

  for (const entry of zipEntries) {
    totalUncompressedSize += entry.header.size;
    if (totalUncompressedSize > MAX_TOTAL_UNCOMPRESSED_BYTES) {
      throw new Error(`Security Violation: Uncompressed ZIP size exceeds safe limit of ${MAX_TOTAL_UNCOMPRESSED_BYTES / (1024 * 1024)} MB`);
    }

    const safeDestPath = sanitizeAndResolvePath(destinationDir, entry.entryName);

    if (entry.isDirectory) {
      await fs.ensureDir(safeDestPath);
    } else {
      await fs.ensureDir(path.dirname(safeDestPath));
      await fs.writeFile(safeDestPath, entry.getData());
      totalFiles++;

      const ext = path.extname(entry.name).toLowerCase();
      if (['.html', '.htm'].includes(ext)) {
        htmlCount++;
      } else if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'].includes(ext)) {
        imageCount++;
      }
    }
  }

  return {
    extractDir: destinationDir,
    htmlCount,
    imageCount,
    totalFiles
  };
}
