Build a complete local web application called **Notion HTML to PDF Converter**.

## 1. Goal

I have exported a Notion workspace/page as HTML. The export contains a main HTML page and multiple subpages, images, CSS, and other assets.

I want an application that takes this exported Notion HTML folder or ZIP file and generates **one professional PDF document** containing the complete documentation.

The most important requirement is that links between Notion pages must remain useful in the generated PDF.

For example:

```text
index.html
├── Docker.html
├── Kubernetes.html
├── Linux.html
└── DevOps.html
```

If `index.html` contains:

```html
<a href="Docker.html">Docker</a>
```

the generated PDF should contain a clickable "Docker" link that navigates to the Docker section/page inside the same PDF.

External URLs such as:

```text
https://github.com/...
```

should remain clickable and should open in the user's browser.

The application should work locally and should not require a paid Notion subscription or any external PDF conversion service.

---

# 2. Technology Stack

Use:

### Frontend
- React
- Vite
- Modern CSS
- Clean responsive UI

### Backend
- Node.js
- Express.js

### HTML processing
- Cheerio for parsing HTML
- Node.js `fs` and `path` for filesystem operations

### PDF generation
- Playwright
- Chromium

### File handling
- ZIP upload/extraction support
- Temporary working directories
- Automatic cleanup

Do NOT use an external paid API for PDF generation.

Do NOT use AI/LLMs inside the application. This is a deterministic document-processing application.

---

# 3. Application Workflow

The complete workflow should be:

```text
User
 │
 │ Upload Notion ZIP
 ▼
Frontend
 │
 ▼
Backend
 │
 ├── Extract ZIP
 │
 ├── Find main HTML file
 │
 ├── Crawl HTML pages
 │
 ├── Build page hierarchy
 │
 ├── Resolve internal links
 │
 ├── Resolve images/assets
 │
 ├── Prepare printable HTML
 │
 ▼
Playwright + Chromium
 │
 ▼
Generate PDF
 │
 ▼
Return PDF
 │
 ▼
User downloads PDF
```

---

# 4. User Interface

Create a simple but polished interface.

The main page should contain:

```text
┌──────────────────────────────────────────────┐
│                                              │
│          Notion HTML → PDF Converter         │
│                                              │
│   Convert your Notion HTML export into      │
│   a single navigable PDF.                   │
│                                              │
│   ┌──────────────────────────────────────┐   │
│   │                                      │   │
│   │       Drag & Drop ZIP / Folder       │   │
│   │                                      │   │
│   │       or                            │   │
│   │                                      │   │
│   │       Choose HTML export            │   │
│   │                                      │   │
│   └──────────────────────────────────────┘   │
│                                              │
│   Detected pages: 42                         │
│   Detected images: 137                       │
│                                              │
│   Options                                    │
│                                              │
│   ☑ Include subpages                         │
│   ☑ Preserve internal links                 │
│   ☑ Preserve external links                 │
│   ☑ Generate PDF bookmarks                  │
│   ☑ Generate table of contents              │
│   ☑ Preserve background graphics            │
│                                              │
│   Paper size: [ A4 ▼ ]                       │
│                                              │
│             [ Generate PDF ]                 │
│                                              │
│   Progress:                                  │
│   ███████████████░░░ 78%                    │
│                                              │
└──────────────────────────────────────────────┘
```

After generation:

```text
PDF generated successfully.

Pages: 87
File size: 14.2 MB

[ Download PDF ]

[ Convert another export ]
```

---

# 5. Upload Support

The application should accept:

1. ZIP containing the Notion HTML export
2. HTML files/folders where technically possible

For the MVP, prioritize ZIP support.

Example:

```text
notion-export.zip
```

After extraction:

```text
workspace/
├── index.html
├── Docker.html
├── Kubernetes.html
├── Linux.html
├── images/
├── assets/
└── ...
```

Never modify the user's original ZIP.

Use a temporary working directory.

Delete temporary files after the PDF has been generated and delivered.

---

# 6. Main HTML Detection

The application should intelligently identify the entry HTML page.

Possible strategies:

1. Look for `index.html`
2. If there is no `index.html`, inspect HTML files and identify the page with the highest number of incoming/outgoing references or the likely root page.
3. If multiple candidates exist, show them to the user.

Example:

```text
Select main page:

○ index.html
○ Home.html
○ Documentation.html

[ Continue ]
```

---

# 7. HTML Crawler

Implement a recursive HTML crawler.

Starting from:

```text
index.html
```

find:

```html
<a href="Docker.html">
<a href="Kubernetes.html">
<a href="Linux.html">
```

and recursively inspect those pages.

Maintain a visited set:

```javascript
const visited = new Set();
```

so circular links do not cause infinite recursion.

The crawler should detect:

- HTML pages
- internal page links
- anchors
- external URLs
- images
- CSS files
- other assets

Ignore irrelevant resources such as:

- JavaScript tracking URLs
- `mailto:`
- `javascript:`
- unsupported protocols

---

# 8. Page Model

Create an internal representation similar to:

```javascript
{
    id: "docker",
    title: "Docker",
    sourceFile: "/workspace/Docker.html",
    relativePath: "Docker.html",
    links: [],
    images: [],
    order: 5
}
```

The complete document should have a structure similar to:

```javascript
{
    root: {...},
    pages: [...],
    links: [...],
    assets: [...]
}
```

---

# 9. Internal Link Resolution

This is one of the most important features.

Suppose:

```html
<a href="Docker.html">Docker</a>
```

The application must identify that:

```text
Docker.html
```

corresponds to a specific page in the final PDF.

Do not leave it as a normal file URL.

Instead, convert it into an internal PDF destination.

Conceptually:

```text
Docker.html
      ↓
Docker page
      ↓
PDF destination
      ↓
Page/anchor inside final PDF
```

Internal links should work even when the generated PDF is moved to another computer.

---

# 10. External Link Handling

For:

```html
<a href="https://github.com/example">
```

preserve:

```text
https://github.com/example
```

as a clickable external PDF hyperlink.

Also support:

```text
http://
https://
mailto:
```

where appropriate.

---

# 11. Anchor Handling

Support HTML anchors such as:

```html
<a href="#docker">
```

and:

```html
<h1 id="docker">Docker</h1>
```

These should become internal PDF navigation.

Also handle:

```html
<a href="Docker.html#installation">
```

This should navigate to:

```text
Docker page
      +
installation anchor
```

inside the PDF.

---

# 12. Page Ordering

Preserve the logical Notion navigation order as much as possible.

If:

```text
index.html
 ├── Linux
 ├── Docker
 │    ├── Images
 │    └── Containers
 └── Kubernetes
```

the PDF should preferably follow:

```text
1. Home
2. Linux
3. Docker
4. Docker → Images
5. Docker → Containers
6. Kubernetes
```

Do not simply sort filenames alphabetically.

Use links and discovered hierarchy to determine ordering.

If a reliable hierarchy cannot be determined, provide a page-ordering fallback.

---

# 13. PDF Bookmarks

Generate PDF bookmarks/outlines from headings.

For example:

```text
Table of Contents
│
├── Introduction
├── Linux
│   ├── Commands
│   ├── Permissions
│   └── Networking
├── Docker
│   ├── Images
│   ├── Containers
│   └── Networks
└── Kubernetes
    ├── Pods
    ├── Deployments
    └── Services
```

Bookmarks should be clickable.

Use heading levels:

```html
<h1>
<h2>
<h3>
<h4>
```

to determine bookmark hierarchy.

---

# 14. Table of Contents

Provide an option:

```text
☑ Generate table of contents
```

If enabled, create a clickable TOC near the beginning of the PDF.

Example:

```text
TABLE OF CONTENTS

1. Introduction .................. 1
2. Linux ......................... 5
3. Docker ....................... 18
4. Kubernetes ................... 42
```

The TOC entries must link to the correct PDF locations.

Page numbers should be generated from the actual final PDF where possible.

If exact page-number generation requires a post-processing step, implement one rather than displaying incorrect page numbers.

---

# 15. Images

Preserve all images from the Notion export.

For example:

```html
<img src="images/docker.png">
```

must still render correctly.

Resolve paths relative to the source HTML file.

Support:

- PNG
- JPG/JPEG
- GIF where possible
- SVG
- WebP where Chromium supports it

Handle broken images gracefully.

Do not allow one missing image to crash the entire PDF generation process.

---

# 16. CSS

Preserve the original CSS where possible.

Support:

- fonts
- colors
- backgrounds
- borders
- spacing
- tables
- code blocks
- lists
- headings
- blockquotes
- images

The PDF should visually resemble the original Notion export as closely as possible.

Use Chromium's print rendering.

Enable:

```javascript
printBackground: true
```

---

# 17. Print CSS

Create an additional print stylesheet.

Use:

```css
@page {
    size: A4;
    margin: 20mm;
}
```

Prevent undesirable page breaks.

For example:

```css
h1,
h2,
h3 {
    break-after: avoid;
}

img,
table,
pre,
blockquote {
    break-inside: avoid;
}
```

Code blocks should not be unnecessarily split across pages where possible.

Large images should scale to fit the page.

Tables should be readable.

---

# 18. Code Blocks

Notion exports may contain code.

Preserve:

```text
code
bash
python
javascript
dockerfile
yaml
json
```

etc.

Use a readable monospace font.

Do not allow code to overflow horizontally without handling it.

Use:

```css
pre {
    white-space: pre-wrap;
    overflow-wrap: break-word;
}
```

where appropriate.

---

# 19. Notion-Specific Content

The application should attempt to preserve common Notion export structures:

- headings
- paragraphs
- bullet lists
- numbered lists
- checkboxes
- callouts
- tables
- images
- bookmarks
- code blocks
- quotes
- dividers
- nested pages
- links

Do not hardcode the DOM structure of only one export.

Create reasonably generic HTML processing logic.

---

# 20. Error Handling

Show useful errors.

Examples:

```text
No HTML files found.
```

```text
Could not identify the main page.
```

```text
Broken internal link:
Docker.html
```

```text
Image could not be loaded:
images/docker.png
```

```text
PDF generation failed.
```

Do not expose raw stack traces to the normal user interface.

Log detailed errors to the backend console.

---

# 21. Security

Since users upload ZIP files, implement basic security.

Protect against:

- ZIP path traversal (`../../file`)
- malicious filenames
- oversized uploads
- decompression bombs
- arbitrary filesystem access

Never extract files outside the application's temporary workspace.

Sanitize filenames.

Set reasonable upload limits.

Do not execute JavaScript from uploaded HTML unless absolutely necessary.

If JavaScript execution is enabled in Chromium, isolate the temporary environment appropriately.

---

# 22. API Design

Implement APIs similar to:

```http
POST /api/upload
```

Upload ZIP.

Response:

```json
{
    "jobId": "abc123",
    "pages": 42,
    "images": 137
}
```

Then:

```http
POST /api/analyze/:jobId
```

Response:

```json
{
    "pages": 42,
    "links": 86,
    "images": 137,
    "mainPage": "index.html"
}
```

Then:

```http
POST /api/generate/:jobId
```

Response:

```json
{
    "status": "completed",
    "downloadUrl": "/api/download/abc123"
}
```

And:

```http
GET /api/download/:jobId
```

returns the generated PDF.

---

# 23. Progress Reporting

PDF generation can take time.

Show progress such as:

```text
Uploading       ✓
Extracting      ✓
Scanning pages  ✓
Resolving links ✓
Processing CSS  ✓
Rendering PDF   ███████████░░ 82%
Finalizing      ...
```

Use polling initially.

For example:

```http
GET /api/status/:jobId
```

Later, WebSockets/SSE can be added if useful.

Do not over-engineer the first version.

---

# 24. Project Structure

Use a clean architecture:

```text
notion-pdf-converter/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── src/
│   │   ├── routes/
│   │   ├── services/
│   │   │   ├── crawler.js
│   │   │   ├── parser.js
│   │   │   ├── linkResolver.js
│   │   │   ├── assetResolver.js
│   │   │   ├── pdfGenerator.js
│   │   │   └── tocGenerator.js
│   │   ├── utils/
│   │   ├── app.js
│   │   └── server.js
│   ├── temp/
│   ├── output/
│   └── package.json
│
├── README.md
├── .gitignore
└── package.json
```

---

# 25. Configuration

Create a configuration system for:

```text
PDF format:
A4
Letter

Margins:
Top
Bottom
Left
Right

Include backgrounds:
true/false

Generate bookmarks:
true/false

Generate TOC:
true/false

Preserve internal links:
true/false

Preserve external links:
true/false
```

Do not hardcode these values throughout the application.

---

# 26. Testing

Create test fixtures.

Example:

```text
test-data/
└── sample-notion/
    ├── index.html
    ├── docker.html
    ├── kubernetes.html
    ├── images/
    │   └── test.png
    └── style.css
```

Include links such as:

```html
<a href="docker.html">Docker</a>
<a href="kubernetes.html">Kubernetes</a>
<a href="https://github.com">GitHub</a>
```

Test:

1. HTML detection
2. recursive crawling
3. circular links
4. internal link resolution
5. external links
6. anchor links
7. images
8. CSS
9. PDF generation
10. bookmarks
11. TOC
12. missing assets
13. invalid ZIP files
14. malicious ZIP paths
15. large documents

---

# 27. Important Requirement: Do Not Fake PDF Links

Do not simply generate a PDF and leave links pointing to local HTML files.

The generated PDF must contain real clickable PDF annotations/internal destinations.

The final PDF should work independently after the source ZIP/folder is removed.

---

# 28. Development Approach

Build the application incrementally.

### Step 1

Create a minimal Node.js script:

```text
index.html
    ↓
Playwright
    ↓
output.pdf
```

Verify PDF rendering first.

### Step 2

Add recursive HTML discovery.

### Step 3

Add multiple-page rendering.

### Step 4

Add internal link resolution.

### Step 5

Add external links.

### Step 6

Add bookmarks.

### Step 7

Add TOC.

### Step 8

Add ZIP upload.

### Step 9

Add React UI.

### Step 10

Add progress tracking and error handling.

Do not build everything in one huge untested implementation.

After each major step, run tests and verify functionality.

---

# 29. Docker Support

After the local application works, create:

```text
Dockerfile
docker-compose.yml
```

The application should run with:

```bash
docker compose up --build
```

Make sure Playwright/Chromium works correctly inside Docker.

Use an appropriate Playwright-compatible base image rather than installing Chromium manually in a fragile way.

---

# 30. README

Create a detailed README containing:

- project overview
- architecture
- prerequisites
- installation
- development commands
- production commands
- Docker setup
- project structure
- API documentation
- troubleshooting
- known limitations

Example:

```bash
git clone <repository>

cd notion-pdf-converter

npm install

npm run dev
```

Frontend:

```text
http://localhost:5173
```

Backend:

```text
http://localhost:3000
```

---

# 31. Code Quality

Follow these principles:

- modular code
- meaningful function names
- comments only where useful
- async/await
- proper error handling
- no unnecessary dependencies
- no hardcoded absolute paths
- environment variables for configuration
- clean separation between frontend and backend
- reusable services
- unit tests for core document-processing logic

Do not put the entire application into one `server.js` file.

---

# 32. MVP Acceptance Criteria

The application is considered successful when I can:

1. Export a Notion page as HTML.
2. ZIP the exported folder.
3. Upload the ZIP into the application.
4. Application discovers the main HTML page.
5. Application discovers linked subpages recursively.
6. Application preserves images and CSS.
7. Application combines the pages into one PDF.
8. Clicking an internal Notion page link navigates to the corresponding page in the PDF.
9. Clicking an external URL opens the external website.
10. PDF bookmarks work.
11. PDF looks reasonably similar to the original HTML.
12. Application works completely locally.
13. No Notion Pro subscription is required.
14. No paid third-party PDF API is required.

---

# 33. Important Engineering Constraint

Do not prematurely optimize.

First make this pipeline work:

```text
ZIP
 ↓
Extract
 ↓
Find HTML
 ↓
Discover pages
 ↓
Combine pages
 ↓
Generate PDF
```

Then make this work:

```text
Internal HTML link
 ↓
Correct PDF destination
```

Then add:

```text
Bookmarks
TOC
UI
Progress
Docker
```

The most technically important part of this project is **correct internal link mapping between separate HTML files and destinations inside the final PDF**. Prioritize this over visual polish.

Before writing large amounts of code, inspect the structure of a real Notion HTML export and design the crawler/link-resolution strategy around it.

Produce a working application, not just pseudocode or an architectural explanation.