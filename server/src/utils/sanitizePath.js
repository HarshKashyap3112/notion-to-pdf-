import path from 'path';

/**
 * Validates that an extracted or relative file path is strictly within the allowed root directory.
 * Throws an error if path traversal or escape is detected.
 * 
 * @param {string} rootDir - The base directory
 * @param {string} targetPath - The untrusted target path
 * @returns {string} The resolved safe absolute path
 */
export function sanitizeAndResolvePath(rootDir, targetPath) {
  const resolvedRoot = path.resolve(rootDir);
  const resolvedTarget = path.resolve(resolvedRoot, targetPath);

  // Normalize path separators for cross-platform comparison
  const normalizedRoot = resolvedRoot.replace(/\\/g, '/');
  const normalizedTarget = resolvedTarget.replace(/\\/g, '/');

  if (!normalizedTarget.startsWith(normalizedRoot + '/') && normalizedTarget !== normalizedRoot) {
    throw new Error(`Security Violation: Path traversal detected for "${targetPath}"`);
  }

  return resolvedTarget;
}
