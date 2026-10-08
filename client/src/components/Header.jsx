import React from 'react';

export function Header() {
  return (
    <header className="app-header">
      <div className="badge-tag">
        <span className="badge-dot"></span> Document Engine
      </div>
      <h1 className="app-title">Notion to PDF Converter</h1>
      <p className="app-subtitle">
        Transform your exported Notion workspace or page into a single professional, navigable PDF with preserved links and bookmarks.
      </p>
    </header>
  );
}
