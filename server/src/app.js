import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import convertRoutes from './routes/convertRoutes.js';
import { JobManager } from './services/jobManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.resolve(__dirname, '../../client/dist');

const app = express();

// Initialize job workspace folders
JobManager.init().catch(console.error);

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Notion HTML to PDF Converter' });
});

// API Routes
app.use('/api', convertRoutes);

// Static frontend serving if built
app.use(express.static(clientDistPath));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  const indexPath = path.join(clientDistPath, 'index.html');
  res.sendFile(indexPath, (err) => {
    if (err) next();
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]:', err);
  res.status(err.status || 500).json({
    error: err.message || 'An unexpected error occurred processing your request.'
  });
});

export default app;
