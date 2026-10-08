import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMP_BASE_DIR = path.resolve(__dirname, '../../temp/jobs');
const OUTPUT_BASE_DIR = path.resolve(__dirname, '../../output');

// In-memory store for active jobs
const jobs = new Map();

export class JobManager {
  static async init() {
    await fs.ensureDir(TEMP_BASE_DIR);
    await fs.ensureDir(OUTPUT_BASE_DIR);
  }

  static createJob() {
    const jobId = uuidv4();
    const jobTempDir = path.join(TEMP_BASE_DIR, jobId);
    const jobOutputDir = path.join(OUTPUT_BASE_DIR, jobId);

    const job = {
      id: jobId,
      status: 'created', // created, uploaded, analyzing, analyzed, generating, completed, failed
      percent: 0,
      step: 'init',
      message: 'Job initialized',
      tempDir: jobTempDir,
      outputDir: jobOutputDir,
      pdfPath: null,
      fileSize: 0,
      pageCount: 0,
      analysis: null,
      error: null,
      createdAt: Date.now()
    };

    jobs.set(jobId, job);
    return job;
  }

  static getJob(jobId) {
    return jobs.get(jobId);
  }

  static updateProgress(jobId, { status, percent, step, message, result, error }) {
    const job = jobs.get(jobId);
    if (!job) return;

    if (status) job.status = status;
    if (typeof percent === 'number') job.percent = percent;
    if (step) job.step = step;
    if (message) job.message = message;
    if (error) {
      job.error = error;
      job.status = 'failed';
    }
    if (result) {
      if (result.pdfPath) job.pdfPath = result.pdfPath;
      if (result.fileSize) job.fileSize = result.fileSize;
      if (result.pageCount) job.pageCount = result.pageCount;
      if (result.analysis) job.analysis = result.analysis;
    }
  }

  static async cleanupJob(jobId) {
    const job = jobs.get(jobId);
    if (!job) return;

    try {
      if (await fs.pathExists(job.tempDir)) {
        await fs.remove(job.tempDir);
      }
    } catch (err) {
      console.warn(`[JobManager] Failed to cleanup tempDir for job ${jobId}: ${err.message}`);
    }
  }
}
