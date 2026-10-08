import React from 'react';
import { CheckIcon } from './Icons';

const MILESTONES = [
  { id: 'extracting', label: 'Extracting Notion archive' },
  { id: 'crawling', label: 'Scanning pages and hierarchy' },
  { id: 'resolving_links', label: 'Resolving internal navigation links' },
  { id: 'processing_assets', label: 'Inlining images and print stylesheets' },
  { id: 'rendering_pdf', label: 'Rendering PDF with Playwright Chromium' },
  { id: 'completed', label: 'Finalizing document' }
];

export function ProgressCard({ progress }) {
  if (!progress) return null;

  const { percent = 0, message = 'Processing...', step = '' } = progress;

  const getStepStatus = (index) => {
    const stepThreshold = (index + 1) * 16;
    if (percent >= 100) return 'completed';
    if (percent >= stepThreshold) return 'completed';
    if (percent >= stepThreshold - 16 && percent < stepThreshold) return 'active';
    return 'pending';
  };

  return (
    <div className="content-card progress-container">
      <div className="progress-header">
        <span className="progress-label">{message}</span>
        <span className="progress-percent">{Math.min(100, Math.max(0, percent))}%</span>
      </div>

      <div className="progress-bar-bg">
        <div
          className="progress-bar-fill"
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        ></div>
      </div>

      <div className="steps-list">
        {MILESTONES.map((m, idx) => {
          const status = getStepStatus(idx);
          return (
            <div key={m.id} className={`step-item ${status}`}>
              <span className="step-indicator">
                {status === 'completed' && <CheckIcon size={12} />}
              </span>
              <span>{m.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
