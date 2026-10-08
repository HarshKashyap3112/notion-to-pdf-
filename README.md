# Notion HTML to PDF Converter

> A high-performance, privacy-first local application that converts exported Notion HTML workspaces and pages into a single, professional, fully navigable PDF document with preserved internal links, anchors, bookmarks, and images.

---

## 🌟 Key Features

- 🔗 **Preserved Internal Links & Anchors**: Relative links between exported Notion subpages (e.g. `docker.html`, `kubernetes.html#pods`) are automatically mapped to internal PDF destinations and element anchors.
- 🌐 **External Hyperlinks Preserved**: Web URLs (e.g. GitHub, documentation sites) remain clickable in the final PDF document.
- 📑 **Hierarchical Table of Contents**: Automatically generates a structured Table of Contents upfront with clickable entries.
- 🔖 **PDF Outline Bookmarks**: Builds native PDF bookmarks from document headings (`h1` - `h4`) for easy reader navigation.
- 🖼️ **Asset & Image Resolution**: Resolves and inlines images (PNG, JPG, SVG, WebP) with graceful fallbacks for missing assets.
- 🖨️ **Print & Pagination Optimization**: Injects print CSS with orphan heading prevention (`break-after: avoid`), code block wrapping, and clean page breaks between chapters.
- 🛡️ **Zero External Paid APIs & 100% Offline**: Runs locally using Node.js and Playwright Chromium. No Notion Pro subscription or paid conversion services required.
- 🔒 **Security-First Architecture**: Path-traversal protection, compression bomb limits, and isolated temporary workspaces.

---

## 📐 Architecture & Workflow

```text
User / UI
   │
   ▼ [Upload ZIP]
Backend (Express)
   ├── 1. Safe ZIP Extraction & File Sanitization
   ├── 2. Entry HTML Detection (index.html / Root Scoring)
   ├── 3. Recursive Page Crawler (BFS/DFS with circular reference protection)
   ├── 4. Internal Link & Anchor Resolver
   ├── 5. Asset Inliner & Print CSS Injector
   ├── 6. Unified Document & Table of Contents Builder
   │
   ▼
Playwright + Chromium
   ├── Headless Print Rendering (printBackground: true, outline: true)
   ├── PDF Metadata & Page Count Verification
   │
   ▼
User downloads final unified PDF
```

---

## 📁 Project Structure

```text
notion-pdf-converter/
├── client/                     # Frontend (React + Vite + Modern CSS)
│   ├── src/
│   │   ├── components/         # Dropzone, OptionsCard, ProgressCard, ResultCard, etc.
│   │   ├── services/api.js     # API communication layer
│   │   ├── App.jsx             # Main interactive application flow
│   │   ├── index.css           # Design system & dark theme styles
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── server/                     # Backend (Node.js + Express + Playwright)
│   ├── src/
│   │   ├── routes/
│   │   │   └── convertRoutes.js # REST API endpoints
│   │   ├── services/
│   │   │   ├── zipExtractor.js  # Safe decompression & security checks
│   │   │   ├── mainPageDetector.js # Intelligent root page discovery
│   │   │   ├── crawler.js       # Recursive HTML page crawler
│   │   │   ├── linkResolver.js  # Resolves HTML links to PDF anchors
│   │   │   ├── assetResolver.js # Inlines images & print CSS
│   │   │   ├── tocGenerator.js  # Generates Table of Contents
│   │   │   ├── pdfGenerator.js  # Playwright Chromium PDF generator
│   │   │   ├── converterPipeline.js # Master orchestrator
│   │   │   └── jobManager.js    # Job status & cleanup manager
│   │   ├── utils/
│   │   │   └── sanitizePath.js  # Path traversal protection
│   │   ├── app.js               # Express application
│   │   └── server.js            # Server entrypoint (Port 3000)
│   ├── test-data/               # Realistic Notion export test fixtures
│   ├── tests/                   # Automated unit & integration tests
│   └── package.json
│
├── Dockerfile                  # Container definition based on Playwright image
├── docker-compose.yml          # Docker Compose orchestration
└── package.json                # Root workspace orchestration
```

---

## 🛠️ Prerequisites

- **Node.js**: v18.0.0 or later (v20+ recommended)
- **npm**: v9.0.0 or later
- **Playwright Chromium**: Automatically installed via npm scripts

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies

From the project root:

```bash
# Install root, server, and client dependencies
npm run install:all

# Ensure Playwright browser is downloaded
cd server && npx playwright install chromium
```

### 2. Run in Development Mode

Run the backend server:

```bash
cd server
npm run dev
# Server running at http://localhost:3000
```

In a separate terminal, run the Vite React client:

```bash
cd client
npm run dev
# Client running at http://localhost:5173
```

Open `http://localhost:5173` in your browser.

---

## 🧪 Testing

The test suite covers:
- **Phase 1**: Unit tests for security sanitization, ZIP extraction, root page detection, recursive crawling, link resolution, asset handling, TOC, and Playwright Chromium PDF rendering.
- **Phase 2**: End-to-end HTTP integration tests for uploading, analyzing, generating, status polling, and downloading.

```bash
cd server

# Run core engine tests (Phase 1)
npm test

# Run API integration tests (Phase 2)
npm run test:api

# Run all test suites
npm run test:all
```

---

## 🐳 Docker Deployment

The application includes an official Microsoft Playwright container configuration:

```bash
docker compose up --build
```

Then access the application at `http://localhost:3000`.

---

## 📡 REST API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Health check endpoint |
| `POST` | `/api/upload` | Upload Notion export ZIP (`multipart/form-data`) |
| `POST` | `/api/analyze/:jobId` | Inspect discovered pages and link hierarchy |
| `POST` | `/api/generate/:jobId` | Kick off PDF generation with conversion options |
| `GET` | `/api/status/:jobId` | Poll progress percentage, milestones, and status |
| `GET` | `/api/download/:jobId` | Download final generated PDF |

---

## ⚙️ Configuration Options

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `paperSize` | `string` | `'A4'` | Paper format: `A4`, `Letter`, or `Legal` |
| `includeSubpages` | `boolean` | `true` | Crawls and includes linked subpages recursively |
| `preserveInternalLinks` | `boolean` | `true` | Translates relative HTML links into internal PDF anchors |
| `preserveExternalLinks` | `boolean` | `true` | Keeps web URLs clickable (`target="_blank"`) |
| `generateBookmarks` | `boolean` | `true` | Generates PDF outline tree from headings |
| `generateToc` | `boolean` | `true` | Generates a clickable Table of Contents upfront |
| `printBackground` | `boolean` | `true` | Prints background colors and callout borders |

---

## 📄 License

MIT
