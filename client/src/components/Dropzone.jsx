import React, { useRef, useState } from 'react';
import { UploadIcon, FileIcon, CloseIcon } from './Icons';

export function Dropzone({ selectedFile, onFileSelect, onRemoveFile, disabled }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndSetFile(file);
    }
  };

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file) => {
    if (!file.name.toLowerCase().endsWith('.zip')) {
      alert('Please upload a ZIP archive containing your exported Notion HTML files.');
      return;
    }
    onFileSelect(file);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <div className="dropzone-container">
      <input
        type="file"
        ref={inputRef}
        onChange={handleInputChange}
        accept=".zip,application/zip"
        style={{ display: 'none' }}
        disabled={disabled}
      />

      <div
        className={`dropzone ${isDragOver ? 'active' : ''} ${selectedFile ? 'file-selected' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !selectedFile && !disabled && inputRef.current?.click()}
      >
        <div className="dropzone-icon-box">
          {selectedFile ? <FileIcon size={24} /> : <UploadIcon size={24} />}
        </div>
        <div className="dropzone-title">
          {selectedFile ? 'ZIP Archive Loaded' : 'Upload Notion Export ZIP'}
        </div>
        <div className="dropzone-subtitle">
          {selectedFile
            ? 'Archive inspected. Ready to configure and generate PDF.'
            : 'Drag and drop your exported Notion ZIP file here, or browse files.'}
        </div>

        {!selectedFile && (
          <button
            type="button"
            className="btn-browse"
            disabled={disabled}
            onClick={(e) => {
              e.stopPropagation();
              inputRef.current?.click();
            }}
          >
            Select file
          </button>
        )}
      </div>

      {selectedFile && (
        <div className="selected-file-details">
          <div className="file-info">
            <div className="file-icon-box">
              <FileIcon size={20} />
            </div>
            <div>
              <div className="file-name">{selectedFile.name}</div>
              <div className="file-size">{formatFileSize(selectedFile.size)}</div>
            </div>
          </div>
          {!disabled && (
            <button
              type="button"
              className="btn-remove"
              title="Remove file"
              onClick={onRemoveFile}
            >
              <CloseIcon size={16} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
