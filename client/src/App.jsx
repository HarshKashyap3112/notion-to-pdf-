import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { Dropzone } from './components/Dropzone';
import { AnalysisCard } from './components/AnalysisCard';
import { OptionsCard } from './components/OptionsCard';
import { ProgressCard } from './components/ProgressCard';
import { ResultCard } from './components/ResultCard';
import { ErrorBanner } from './components/ErrorBanner';
import { uploadZip, generatePdf, checkStatus, getDownloadUrl } from './services/api';

export function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [jobId, setJobId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [selectedMainPage, setSelectedMainPage] = useState('');
  const [options, setOptions] = useState({
    paperSize: 'A4',
    includeSubpages: true,
    preserveInternalLinks: true,
    preserveExternalLinks: true,
    generateBookmarks: true,
    generateToc: true,
    printBackground: true
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const pollingRef = useRef(null);

  // Stop polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  // Handle file selection and automatic initial upload/scan
  const handleFileSelect = async (file) => {
    setError(null);
    setSelectedFile(file);
    setIsUploading(true);
    setAnalysis(null);
    setResult(null);

    try {
      const uploadRes = await uploadZip(file);
      setJobId(uploadRes.jobId);
      setAnalysis(uploadRes);
      setSelectedMainPage(uploadRes.mainPage || '');
    } catch (err) {
      console.error('Upload failed:', err);
      setError(err.message || 'Failed to upload and scan archive.');
      setSelectedFile(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = () => {
    if (isGenerating) return;
    if (pollingRef.current) clearInterval(pollingRef.current);
    setSelectedFile(null);
    setJobId(null);
    setAnalysis(null);
    setProgress(null);
    setResult(null);
    setError(null);
  };

  const handleGenerate = async () => {
    if (!jobId) return;
    setError(null);
    setIsGenerating(true);
    setProgress({ percent: 10, message: 'Initiating conversion pipeline...', step: 'init' });

    try {
      await generatePdf(jobId, {
        ...options,
        mainPage: selectedMainPage
      });

      // Start polling status
      pollingRef.current = setInterval(async () => {
        try {
          const statusRes = await checkStatus(jobId);
          setProgress({
            percent: statusRes.percent,
            message: statusRes.message,
            step: statusRes.step
          });

          if (statusRes.status === 'completed') {
            clearInterval(pollingRef.current);
            setIsGenerating(false);
            setResult({
              pageCount: statusRes.pageCount,
              fileSize: statusRes.fileSize,
              downloadUrl: getDownloadUrl(jobId)
            });
          } else if (statusRes.status === 'failed') {
            clearInterval(pollingRef.current);
            setIsGenerating(false);
            setError(statusRes.error || 'PDF generation failed on server.');
          }
        } catch (pollErr) {
          console.error('Polling error:', pollErr);
        }
      }, 800);
    } catch (genErr) {
      setIsGenerating(false);
      setError(genErr.message || 'Failed to initiate PDF generation.');
    }
  };

  const handleReset = () => {
    handleRemoveFile();
  };

  return (
    <div className="app-container">
      <Header />

      <ErrorBanner error={error} onDismiss={() => setError(null)} />

      {!result ? (
        <>
          <div className="content-card">
            <Dropzone
              selectedFile={selectedFile}
              onFileSelect={handleFileSelect}
              onRemoveFile={handleRemoveFile}
              disabled={isUploading || isGenerating}
            />

            {isUploading && (
              <div style={{ textAlign: 'center', marginTop: '20px', color: 'var(--text-muted)' }}>
                <span className="spinner spinner-dark" style={{ marginRight: '8px' }}></span>
                Extracting archive and detecting Notion hierarchy...
              </div>
            )}
          </div>

          {analysis && !isGenerating && (
            <>
              <AnalysisCard
                analysis={analysis}
                selectedMainPage={selectedMainPage}
                onSelectMainPage={setSelectedMainPage}
                disabled={isGenerating}
              />

              <OptionsCard
                options={options}
                onOptionsChange={setOptions}
                onGenerate={handleGenerate}
                isGenerating={isGenerating}
                disabled={isUploading || isGenerating}
              />
            </>
          )}

          {isGenerating && (
            <ProgressCard progress={progress} />
          )}
        </>
      ) : (
        <ResultCard result={result} onReset={handleReset} />
      )}
    </div>
  );
}

export default App;
