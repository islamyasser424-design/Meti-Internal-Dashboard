# MEEG Productivity Workspace · METI Company

<div align="center">

![MEEG Productivity Workspace Preview](assets/dashboard-preview.svg)

[![Status](https://img.shields.io/badge/Status-Production%20Internal%20Platform-00e5d4?style=for-the-badge&logo=statuspage&logoColor=white)](https://github.com/islamyasser424-design/Meti-Internal-Dashboard)
[![Architecture](https://img.shields.io/badge/Architecture-Pure%20Vanilla%20ES6%2B-1f6feb?style=for-the-badge&logo=javascript&logoColor=white)](https://github.com/islamyasser424-design/Meti-Internal-Dashboard)
[![Engine](https://img.shields.io/badge/Data%20Engine-Google%20Sheets%20GViz%20API-34a853?style=for-the-badge&logo=googlesheets&logoColor=white)](https://github.com/islamyasser424-design/Meti-Internal-Dashboard)
[![Theme](https://img.shields.io/badge/UI%20System-Cyber--Glass%20Dual%20Mode-a855f7?style=for-the-badge&logo=css3&logoColor=white)](https://github.com/islamyasser424-design/Meti-Internal-Dashboard)

<p align="center">
  <strong>Enterprise Workforce Telemetry, Operational Queue Intelligence, and Quality Control Platform for High-Throughput Autonomous Vehicle (ADAS) Multimodal Data Annotation Pipelines.</strong>
</p>

</div>

---

## 📌 Executive Summary & Business Context

**Micro Engineering Egypt (MEEG) — A METI Company** operates high-volume production pipelines for artificial intelligence and autonomous driving training data. These operations involve hundreds of technical annotation specialists working across multiple physical facility floors and 24/7 rotating shifts to process high-complexity multimodal datasets:
- **3D Lidar Point Clouds**: 3D bounding cuboids, sensor fusion, spatial tracking, and obstacle segmentation.
- **2D Camera Vision**: Lane line detection, free-space driveable area polygon segmentation, and semantic categorization.
- **Multi-Stage QA & QTC Auditing**: First-pass (FP) labeling, second-pass verification, and Quality Control Technician (QTC) error-pattern logging.

### The Operational Challenge
Before the implementation of this dashboard, operational management faced significant visibility bottlenecks:
1. **Data Fragmentation**: Daily shifts logged work across disparate spreadsheet tabs, delaying cross-shift reporting by 12–24 hours.
2. **Shift Imbalance**: Lack of real-time queue telemetry led to sudden throughput drops during shift handovers.
3. **Quality Blind Spots**: Defect classification was audited reactively rather than proactively flagging recurring annotator error patterns.
4. **Historical Disconnect**: Searching for past task records required opening dozens of archived sheets, straining client memory.

### The Engineered Solution
The **MEEG Productivity Workspace** is a high-performance, client-side operational dashboard engineered from the ground up using modern vanilla web technologies. It directly interfaces with Google Sheets via the Google Visualization API (GViz) and CSV streaming endpoints, processing **15,000+ granular task transactions in real time** with sub-16ms client-side filter execution.

---

## ⚡ Key Technical Innovations

### 1. Zero-Dependency Vanilla Architecture
- Built purely with **HTML5, Modern CSS Variables (Custom Properties), and Vanilla ES6+ JavaScript**.
- **0ms Bundle/Build Time**: No Node.js build step, webpack, or external framework runtime overhead.
- **Instant Boot & High Portability**: Can be hosted on any static edge server, GitHub Pages, or run directly from a local browser instance.

### 2. Dual Ingestion Engine & Offline Cache Hydration
- **Primary Transport (GViz SQL API)**: Executes structured SQL-like projection queries (`select * where ...`) against live Google Sheets endpoints without requiring expensive backend server infrastructure.
- **Resilient Fallback**: Automatic failover to direct CSV export streaming when network throttling occurs.
- **Instant Cache Hydration**: On launch, the workspace instantly populates from `localStorage` cache while asynchronously re-validating live telemetry in the background.

### 3. Multi-Shift Operational Routing
Full operational awareness supporting **8 distinct operational shift configurations**:
- `Over Night` (Standard 8-hour overnight rotation)
- `O.Night 12H` (Extended 12-hour overnight surge)
- `Morning 12H` (Extended 12-hour morning surge)
- `Night` (Evening operational window)
- `Morning` (Standard morning operational window)
- `O.Shift(M)`, `O.Shift(N)`, `O.Shift(ON)` (Overtime shifts for backlog clearance)

### 4. Dynamic Role-Based Access Control (RBAC)
- Integrated authentication gate reading authorized personnel directly from the live Google Sheet `Users` directory (`Display Name`, `Role`, `Email`).
- Granular credential verification, local token caching, and automatic forced session refresh tied to the `<meta name="app-version">` release tag.

### 5. Enterprise Historical Archive Search Engine
- An asynchronous modal query engine (`arcs-ov`) that scans historical archive spreadsheets across multiple years.
- Streams matching task records with real-time percentage progress indicators without requiring the client to load millions of historical cells into memory.

### 6. Comparative Analytics Engine (A vs B Benchmarking)
- Side-by-side comparative analysis bar allowing supervisors to select two discrete periods, shifts, or teams.
- Computes mathematical delta values, percentage variances, and visual progress comparisons across throughput, quality, and velocity metrics.

---

## 🗂️ Six Dedicated Analytical Workspaces

The platform features an integrated single-page application (SPA) hash-router (`#dashboard`, `#analysis-overview`, `#queues-analysis`, `#performance-labelers`, `#performance-qtc-floor`, `#daily-report`) driving six specialized operational views:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        MEEG PRODUCTIVITY WORKSPACE                     │
├──────────────┬─────────────────────────────────────────────────────────┤
│ ▦ Dashboard  │ Real-Time Submissions · Active Workforce · Shift State  │
├──────────────┼─────────────────────────────────────────────────────────┤
│ ◈ Analysis   │ Modality Distribution (3D Lidar vs 2D Lane Line) · Units│
├──────────────┼─────────────────────────────────────────────────────────┤
│ ☷ Queues     │ Stage Pipeline Monitoring · Queue Bottleneck Mitigation │
├──────────────┼─────────────────────────────────────────────────────────┤
│ ▤ Labelers   │ Individual Velocity · Personal Quota · Quality Rate     │
├──────────────┼─────────────────────────────────────────────────────────┤
│ 🏢 QTC/Floor │ Multi-Floor Capacity Utilization · QTC Error Patterns   │
├──────────────┼─────────────────────────────────────────────────────────┤
│ ▦ Daily Rep. │ End-of-Day Aggregations · Sparkline Trajectories · PNG  │
└──────────────┴─────────────────────────────────────────────────────────┘
```

### 1. ▦ Executive Dashboard
- High-level executive KPI indicators: **Total Submissions**, **Active Workforce Count**, **Audit Quality Rate (QA %)**, and **Queue Velocity (Tasks/Hour)**.
- Hourly submission trend curves with dynamic peak velocity detection.
- Live telemetry indicator with visual traffic-light status dots (`tl-red`, `tl-yellow`, `tl-green`).

### 2. ◈ Analysis Overview
- Comprehensive breakdown between 3D Lidar point clouds and 2D Lane Line annotation streams.
- Unique labeler count per modality, unit throughput averages, and category distribution.

### 3. ☷ Queues Analysis
- Granular visibility into active project queues and operational stages.
- Filterable by shift, facility floor, QTC auditor, and task category.
- One-click CSV export for offline operational briefings.

### 4. ▤ Performance per Labelers
- Transparent productivity matrix benchmarking individual annotators against daily and weekly quotas.
- Customizable personal target simulator saved to local browser storage.
- Defect frequency tracking and first-pass accuracy scoring.

### 5. 🏢 Performance per QTC & Floor
- Facility floor capacity utilization tracking across **Floor 01**, **Floor 02**, and **Floor 03**.
- Quality Control Technician (QTC) review throughput and escalation resolution rates.

### 6. ▦ Daily Report & Executive Screenshot Export
- Longitudinal submission trajectory tracking with lightweight mathematical SVG sparklines.
- Built-in `html2canvas` high-definition rendering pipeline: generates formatted, branded PNG summaries copied directly to the supervisor's system clipboard for instant messaging to stakeholders.

---

## 🎨 Design System: Cyber-Glass Dual Theme

The platform incorporates a bespoke design system optimized for high-density analytical legibility during both day and night operational shifts:
- **Dark Mode (Default)**: Deep midnight obsidian base (`#050a10`), cyber-neon cyan (`#00e5d4`), electric blue (`#1f6feb`), and subtle glowing blurred backdrops.
- **Light Mode**: Clean executive crisp chrome background (`#eef3f9`), slate blue structural framing, and soft glass cards.
- **Typography**: Dual-font pairing utilizing **Space Grotesk** for modern geometric UI headings and **JetBrains Mono** for numerical precision, timestamps, and metric alignment.

---

## 📁 Repository Structure

```
Meti-Internal-Dashboard/
│
├── assets/
│   └── dashboard-preview.svg      # Vector architectural UI mockup for documentation
│
├── .gitignore                     # Standard exclusion rules (OS, IDE, cache files)
├── .nojekyll                      # Disables Jekyll processing on GitHub Pages
├── dashboard-ui.css               # Modular presentation stylesheet & design tokens
├── dashboard-ui.js                # Router, workspace renderers, and analytics engine
├── index.html                     # Core application entrypoint, auth gate & ingestion logic
└── README.md                      # Comprehensive project documentation & architecture guide
```

---

## 🚀 Deployment & Configuration

### Prerequisites
- Any modern web browser (Google Chrome, Microsoft Edge, Safari, Firefox).
- A Google Sheet configured with the expected data schema (`Export`, `Teams`, and `Users` tabs).

### Configuration Variables (`index.html`)
The application can be linked to your own Google Sheets backend by updating the configuration constants near the top of the script in `index.html`:

```javascript
// Primary live Google Sheet ID (contains 'Export', 'Teams', and 'Users' tabs)
const SHEET_ID = 'YOUR_GOOGLE_SHEET_ID_HERE';

// Historical Archive Google Sheet ID (queried asynchronously)
const ARCHIVE_SHEET_ID = 'YOUR_ARCHIVE_SHEET_ID_HERE';

// Versioning tag for cache-busting & forced session logout
const AUTH_VER = 'v7';
```

### Running Locally
Because this project uses pure vanilla web standards with no build step, you can run it immediately with any local HTTP server:

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js npx
npx serve .
```
Then navigate to `http://localhost:8000` in your browser.

### Hosting on GitHub Pages
1. Go to repository **Settings** → **Pages**.
2. Select `main` branch as the deployment source and root `/` as folder.
3. The `.nojekyll` file included in this repository ensures all CSS, JS, and asset files are served cleanly without Jekyll intervention.

---

## 🔒 Security & Data Governance Notice

> [!IMPORTANT]
> This repository contains the public open-source frontend client code. All production customer proprietary datasets, internal employee PII, and Google Workspace security credentials are appropriately protected via Google Workspace organizational access policies, read-only API scopes, and client-side credential verification.

---

## 👨‍💻 Engineering & Authorship

Designed, engineered, and maintained by:

**Islam Yasser**  
*Workforce Management & Data Analytics Specialist*  
*Micro Engineering Egypt (MEEG) — METI Company*  

- **GitHub Profile**: [@islamyasser424-design](https://github.com/islamyasser424-design)
- **LinkedIn**: [Islam Yasser](https://www.linkedin.com/in/islam-yasser-55048b378/)
- **Specialization**: Power BI, SQL, Python, WFM Operational Telemetry, Data Annotation QA & Relational Modeling.
