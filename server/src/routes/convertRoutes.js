import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import { JobManager } from '../services/jobManager.js';
import { extractZipSafely } from '../services/zipExtractor.js';
import { detectMainPage } from '../services/mainPageDetector.js';
import { crawlPages } from '../services/crawler.js';
import { runConversionPipeline } from '../services/converterPipeline.js';

const router = express.Router();

// Multer storage in temporary uploads directory
const upload = multer({
  dest: path.resolve('temp/uploads'),
  limits: {
    fileSize: 150 * 1024 * 1024 // 150 MB max ZIP file
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.zip' || file.mimetype === 'application/zip' || file.mimetype === 'application/x-zip-compressed') {
      cb(null, true);
    } else {
      cb(new Error('Only ZIP files are supported. Please upload a .zip export from Notion.'));
    }
  }
});

/**
 * POST /api/upload
 * Accepts a Notion export ZIP file, creates a job, extracts it safely,
 * and returns summary metrics.
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded. Please upload a ZIP file.' });
  }

  const job = JobManager.createJob();
  const uploadedZipPath = req.file.path;
  const extractDest = path.join(job.tempDir, 'extracted');

  try {
    JobManager.updateProgress(job.id, {
      status: 'uploaded',
      percent: 10,
      step: 'extracting',
      message: 'Extracting Notion archive...'
    });

    const extractResult = await extractZipSafely(uploadedZipPath, extractDest);

    // Initial detection of main page
    const { mainPage, candidates } = await detectMainPage(extractDest);

    job.analysis = {
      pagesCount: extractResult.htmlCount,
      imagesCount: extractResult.imageCount,
      totalFiles: extractResult.totalFiles,
      mainPage,
      candidates
    };

    JobManager.updateProgress(job.id, {
      status: 'ready',
      percent: 25,
      step: 'analyzed',
      message: 'Archive extracted and scanned successfully.'
    });

    // Remove raw uploaded zip file after extraction
    await fs.remove(uploadedZipPath).catch(() => {});

    return res.json({
      jobId: job.id,
      pages: extractResult.htmlCount,
      images: extractResult.imageCount,
      totalFiles: extractResult.totalFiles,
      mainPage,
      candidates
    });
  } catch (err) {
    console.error(`[Upload Error] Job ${job.id}:`, err);
    JobManager.updateProgress(job.id, {
      status: 'failed',
      error: err.message
    });
    await fs.remove(uploadedZipPath).catch(() => {});
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/analyze/:jobId
 * Detailed page analysis and link structure inspection.
 */
router.post('/analyze/:jobId', async (req, res) => {
  const { jobId } = req.params;
  const job = JobManager.getJob(jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found or expired.' });
  }

  try {
    const extractDir = path.join(job.tempDir, 'extracted');
    const { mainPage, candidates } = await detectMainPage(extractDir, req.body.mainPage);
    const { pages } = await crawlPages(extractDir, mainPage);

    let totalLinks = 0;
    let totalImages = 0;
    pages.forEach((p) => {
      totalLinks += p.links.length;
      totalImages += p.images.length;
    });

    return res.json({
      pages: pages.length,
      links: totalLinks,
      images: totalImages,
      mainPage,
      candidates
    });
  } catch (err) {
    console.error(`[Analyze Error] Job ${jobId}:`, err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/generate/:jobId
 * Initiates the asynchronous conversion pipeline with user options.
 */
router.post('/generate/:jobId', async (req, res) => {
  const { jobId } = req.params;
  const job = JobManager.getJob(jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found or expired.' });
  }

  const options = {
    paperSize: req.body.paperSize || 'A4',
    generateToc: req.body.generateToc !== false,
    generateBookmarks: req.body.generateBookmarks !== false,
    preserveInternalLinks: req.body.preserveInternalLinks !== false,
    preserveExternalLinks: req.body.preserveExternalLinks !== false,
    printBackground: req.body.printBackground !== false,
    includeSubpages: req.body.includeSubpages !== false,
    mainPage: req.body.mainPage || null
  };

  const extractDir = path.join(job.tempDir, 'extracted');
  const outputPdfPath = path.join(job.outputDir, 'notion-documentation.pdf');

  JobManager.updateProgress(job.id, {
    status: 'generating',
    percent: 15,
    step: 'starting',
    message: 'Starting conversion pipeline...'
  });

  // Run asynchronously without blocking HTTP response
  runConversionPipeline(
    extractDir,
    outputPdfPath,
    options,
    (progress) => {
      JobManager.updateProgress(job.id, {
        percent: progress.percent,
        step: progress.step,
        message: progress.message
      });
    }
  )
    .then((result) => {
      JobManager.updateProgress(job.id, {
        status: 'completed',
        percent: 100,
        step: 'done',
        message: 'PDF generated successfully.',
        result: {
          pdfPath: result.pdfPath,
          fileSize: result.fileSize,
          pageCount: result.pageCount
        }
      });
    })
    .catch((err) => {
      console.error(`[Generation Pipeline Error] Job ${jobId}:`, err);
      JobManager.updateProgress(job.id, {
        status: 'failed',
        error: err.message
      });
    });

  return res.json({
    status: 'generating',
    jobId: job.id,
    downloadUrl: `/api/download/${job.id}`
  });
});

/**
 * GET /api/status/:jobId
 * Returns current generation status and progress metrics.
 */
router.get('/status/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = JobManager.getJob(jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found or expired.' });
  }

  return res.json({
    id: job.id,
    status: job.status,
    percent: job.percent,
    step: job.step,
    message: job.message,
    error: job.error,
    fileSize: job.fileSize,
    pageCount: job.pageCount,
    downloadUrl: job.status === 'completed' ? `/api/download/${job.id}` : null
  });
});

/**
 * GET /api/download/:jobId
 * Streams the generated PDF file to the client.
 */
router.get('/download/:jobId', async (req, res) => {
  const { jobId } = req.params;
  const job = JobManager.getJob(jobId);

  if (!job || !job.pdfPath) {
    return res.status(404).json({ error: 'Generated PDF not found or expired.' });
  }

  if (!(await fs.pathExists(job.pdfPath))) {
    return res.status(404).json({ error: 'PDF file is missing on server.' });
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="notion-export.pdf"');

  const stream = fs.createReadStream(job.pdfPath);
  stream.pipe(res);

  // Trigger cleanup of temporary files 5 minutes after download
  setTimeout(() => {
    JobManager.cleanupJob(job.id).catch(() => {});
  }, 5 * 60 * 1000);
});

export default router;
