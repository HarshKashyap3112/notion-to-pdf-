/**
 * Generates an HTML Table of Contents section with clickable links
 * to each page and major subheadings.
 * 
 * @param {Array<object>} pages - List of crawled pages
 * @param {object} options - Options { title: string }
 * @returns {string} HTML string representing the TOC section
 */
export function generateTocHtml(pages, options = {}) {
  const title = options.title || 'Table of Contents';

  let itemsHtml = '';

  pages.forEach((page, pageIdx) => {
    const pageNum = pageIdx + 1;
    itemsHtml += `
      <div class="toc-item toc-page-item">
        <a href="#notion-page-${page.id}" class="toc-link">
          <span class="toc-item-number">${pageNum}.</span>
          <span class="toc-item-title">${escapeHtml(page.title)}</span>
          <span class="toc-dots"></span>
        </a>
      </div>
    `;

    // Include level 1 and level 2 headings if present
    const subHeadings = page.headings.filter(h => h.level <= 2 && h.text && h.text.toLowerCase() !== page.title.toLowerCase());
    if (subHeadings.length > 0) {
      itemsHtml += `<div class="toc-subheadings">`;
      subHeadings.forEach((h) => {
        itemsHtml += `
          <div class="toc-item toc-subheading-item">
            <a href="#notion-anchor-${page.id}-${h.originalId}" class="toc-link">
              <span class="toc-item-title">${escapeHtml(h.text)}</span>
              <span class="toc-dots"></span>
            </a>
          </div>
        `;
      });
      itemsHtml += `</div>`;
    }
  });

  return `
    <section class="notion-page-section notion-toc-section" id="notion-toc">
      <div class="toc-container">
        <h1 class="toc-main-title">${escapeHtml(title)}</h1>
        <div class="toc-list">
          ${itemsHtml}
        </div>
      </div>
      <style>
        .notion-toc-section {
          padding-bottom: 2rem;
        }
        .toc-main-title {
          font-size: 1.8rem;
          font-weight: 700;
          color: #1e293b;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 2px solid #cbd5e1;
          padding-bottom: 12px;
          margin-bottom: 20px;
        }
        .toc-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .toc-item {
          display: flex;
          align-items: center;
        }
        .toc-link {
          display: flex;
          align-items: baseline;
          width: 100%;
          color: #334155;
          text-decoration: none;
          font-size: 1rem;
        }
        .toc-link:hover {
          color: #2563eb;
        }
        .toc-item-number {
          font-weight: 600;
          margin-right: 8px;
          min-width: 24px;
        }
        .toc-page-item {
          font-weight: 600;
          margin-top: 6px;
        }
        .toc-subheadings {
          margin-left: 28px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-bottom: 8px;
        }
        .toc-subheading-item .toc-link {
          font-size: 0.92rem;
          font-weight: normal;
          color: #64748b;
        }
        .toc-dots {
          flex: 1;
          border-bottom: 1px dotted #cbd5e1;
          margin: 0 10px;
          min-width: 30px;
          height: 1px;
        }
      </style>
    </section>
  `;
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
