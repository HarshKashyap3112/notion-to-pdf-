import React from 'react';
import { CheckIcon, DownloadIcon, RefreshIcon } from './Icons';

export function ResultCard({ result, onReset }) {
  if (!result) return null;

  const { pageCount = 0, fileSize = 0, downloadUrl } = result;

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const handleDownload = () => {
    if (downloadUrl) {
      window.location.href = downloadUrl;
    }
  };

  return (
    <div className="content-card result-card">
      <div className="result-badge-icon">
        <CheckIcon size={28} />
      </div>
      <h2 className="result-title">PDF Generated Successfully</h2>
      <p className="result-subtitle">
        Your Notion export has been consolidated into a single document with preserved internal navigation links.
      </p>

      <div className="result-metrics">
        <div className="result-metric-item">
          <div className="metric-val">{pageCount}</div>
          <div className="metric-lbl">Total Pages</div>
        </div>
        <div className="result-metric-item">
          <div className="metric-val">{formatFileSize(fileSize)}</div>
          <div className="metric-lbl">File Size</div>
        </div>
      </div>

      <div className="result-actions">
        <button
          type="button"
          id="btn-download-pdf"
          className="btn-primary"
          style={{ width: 'auto', minWidth: '200px' }}
          onClick={handleDownload}
        >
          <DownloadIcon size={18} />
          Download PDF
        </button>

        <button
          type="button"
          id="btn-convert-another"
          className="btn-secondary"
          onClick={onReset}
        >
          <RefreshIcon size={16} />
          Convert Another File
        </button>
      </div>
    </div>
  );
}
