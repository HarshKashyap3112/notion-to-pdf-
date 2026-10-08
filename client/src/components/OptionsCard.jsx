import React from 'react';

export function OptionsCard({ options, onOptionsChange, onGenerate, isGenerating, disabled }) {
  const handleToggle = (key) => {
    if (disabled) return;
    onOptionsChange({
      ...options,
      [key]: !options[key]
    });
  };

  const handleSelectChange = (key, value) => {
    if (disabled) return;
    onOptionsChange({
      ...options,
      [key]: value
    });
  };

  return (
    <div className="content-card">
      <div className="form-group">
        <label className="form-label" htmlFor="paper-size-select">
          Paper Format
        </label>
        <select
          id="paper-size-select"
          className="custom-select"
          value={options.paperSize}
          onChange={(e) => handleSelectChange('paperSize', e.target.value)}
          disabled={disabled}
        >
          <option value="A4">A4 (210 × 297 mm)</option>
          <option value="Letter">Letter (8.5 × 11 in)</option>
          <option value="Legal">Legal (8.5 × 14 in)</option>
        </select>
      </div>

      <div className="options-grid">
        <label className={`checkbox-card ${options.includeSubpages ? 'checked' : ''}`}>
          <input
            type="checkbox"
            checked={options.includeSubpages}
            onChange={() => handleToggle('includeSubpages')}
            disabled={disabled}
          />
          <div className="checkbox-content">
            <div className="checkbox-title">Include Subpages</div>
            <div className="checkbox-desc">Recursively discovers and combines linked subpages</div>
          </div>
        </label>

        <label className={`checkbox-card ${options.preserveInternalLinks ? 'checked' : ''}`}>
          <input
            type="checkbox"
            checked={options.preserveInternalLinks}
            onChange={() => handleToggle('preserveInternalLinks')}
            disabled={disabled}
          />
          <div className="checkbox-content">
            <div className="checkbox-title">Preserve Internal Links</div>
            <div className="checkbox-desc">Converts page links into clickable PDF destinations</div>
          </div>
        </label>

        <label className={`checkbox-card ${options.preserveExternalLinks ? 'checked' : ''}`}>
          <input
            type="checkbox"
            checked={options.preserveExternalLinks}
            onChange={() => handleToggle('preserveExternalLinks')}
            disabled={disabled}
          />
          <div className="checkbox-content">
            <div className="checkbox-title">Preserve External Links</div>
            <div className="checkbox-desc">Keeps web URLs (GitHub, external links) clickable</div>
          </div>
        </label>

        <label className={`checkbox-card ${options.generateBookmarks ? 'checked' : ''}`}>
          <input
            type="checkbox"
            checked={options.generateBookmarks}
            onChange={() => handleToggle('generateBookmarks')}
            disabled={disabled}
          />
          <div className="checkbox-content">
            <div className="checkbox-title">Generate PDF Bookmarks</div>
            <div className="checkbox-desc">Creates clickable navigation outline from headings</div>
          </div>
        </label>

        <label className={`checkbox-card ${options.generateToc ? 'checked' : ''}`}>
          <input
            type="checkbox"
            checked={options.generateToc}
            onChange={() => handleToggle('generateToc')}
            disabled={disabled}
          />
          <div className="checkbox-content">
            <div className="checkbox-title">Generate Table of Contents</div>
            <div className="checkbox-desc">Adds a structured, clickable TOC section upfront</div>
          </div>
        </label>

        <label className={`checkbox-card ${options.printBackground ? 'checked' : ''}`}>
          <input
            type="checkbox"
            checked={options.printBackground}
            onChange={() => handleToggle('printBackground')}
            disabled={disabled}
          />
          <div className="checkbox-content">
            <div className="checkbox-title">Preserve Background Colors</div>
            <div className="checkbox-desc">Retains callout boxes, code blocks and table shading</div>
          </div>
        </label>
      </div>

      <button
        type="button"
        id="btn-generate-pdf"
        className="btn-primary"
        onClick={onGenerate}
        disabled={isGenerating || disabled}
      >
        {isGenerating ? (
          <>
            <span className="spinner"></span>
            Generating PDF...
          </>
        ) : (
          'Generate PDF Document'
        )}
      </button>
    </div>
  );
}
