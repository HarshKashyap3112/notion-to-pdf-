/**
 * Client API service for communicating with the backend server.
 */

export async function uploadZip(file) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to upload and extract ZIP file');
  }

  return await res.json();
}

export async function analyzeJob(jobId, mainPage = null) {
  const res = await fetch(`/api/analyze/${jobId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mainPage })
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to analyze documents');
  }

  return await res.json();
}

export async function generatePdf(jobId, options) {
  const res = await fetch(`/api/generate/${jobId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options)
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to start PDF generation');
  }

  return await res.json();
}

export async function checkStatus(jobId) {
  const res = await fetch(`/api/status/${jobId}`);

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to query job status');
  }

  return await res.json();
}

export function getDownloadUrl(jobId) {
  return `/api/download/${jobId}`;
}
