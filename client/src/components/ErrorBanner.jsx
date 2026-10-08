import React from 'react';
import { AlertIcon, CloseIcon } from './Icons';

export function ErrorBanner({ error, onDismiss }) {
  if (!error) return null;

  return (
    <div className="error-alert">
      <div className="error-icon">
        <AlertIcon size={18} />
      </div>
      <div style={{ flex: 1 }}>
        <strong>Error: </strong>
        <span>{error}</span>
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          style={{
            background: 'none',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            padding: '2px 4px',
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <CloseIcon size={16} />
        </button>
      )}
    </div>
  );
}
