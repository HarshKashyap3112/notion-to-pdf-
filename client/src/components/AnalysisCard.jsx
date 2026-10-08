import React from 'react';
import { DocumentIcon, ImageIcon, ArchiveIcon } from './Icons';

export function AnalysisCard({ analysis, selectedMainPage, onSelectMainPage, disabled }) {
  if (!analysis) return null;

  const { pages, images, totalFiles, candidates } = analysis;

  return (
    <div className="content-card">
      <div className="stats-grid">
        <div className="stat-item">
          <div className="stat-icon">
            <DocumentIcon size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-val">{pages || 0}</div>
            <div className="stat-lbl">Discovered Pages</div>
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-icon">
            <ImageIcon size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-val">{images || 0}</div>
            <div className="stat-lbl">Images</div>
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-icon">
            <ArchiveIcon size={20} />
          </div>
          <div className="stat-content">
            <div className="stat-val">{totalFiles || 0}</div>
            <div className="stat-lbl">Archive Files</div>
          </div>
        </div>
      </div>

      {candidates && candidates.length > 0 && (
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" htmlFor="main-page-select">
            Root Document Page
          </label>
          <select
            id="main-page-select"
            className="custom-select"
            value={selectedMainPage || ''}
            onChange={(e) => onSelectMainPage(e.target.value)}
            disabled={disabled}
          >
            {candidates.map((cand) => (
              <option key={cand.path} value={cand.path}>
                {cand.title} ({cand.path})
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
