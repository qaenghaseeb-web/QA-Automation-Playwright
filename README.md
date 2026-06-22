# 🎭 Enterprise QA Automation Framework
### Playwright-Based Test Suite for [OCUS Website](https://www.ocus.com)

<p align="center">
  <img src="https://playwright.dev/img/playwright-logo.svg" width="80" alt="Playwright" />
</p>

<p align="center">
  <img alt="Playwright" src="https://img.shields.io/badge/Playwright-1.49+-45ba4b?logo=playwright" />
  <img alt="Node.js" src="https://img.shields.io/badge/Node.js-LTS-339933?logo=nodedotjs" />
  <img alt="Browsers" src="https://img.shields.io/badge/Browsers-Chromium%20%7C%20Firefox%20%7C%20WebKit-blue" />
  <img alt="License" src="https://img.shields.io/badge/License-MIT-yellow" />
</p>

---

## 📋 Overview

A production-grade, 8-layer QA automation framework built with Playwright for the OCUS website. Covers smoke testing, regression, API validation, accessibility (WCAG), visual regression, performance, responsive, and SEO checks — across 3 browsers and 3 mobile devices.

**Target:** `https://www.ocus.com`  
**Contact Form:** `https://help.ocus.com/hc/en-us/requests/new` (Zendesk-hosted)

---

## 📁 Project Structure

```
QA-Automation-Playwright/
│
├── .github/workflows/
│   └── playwright.yml              # CI/CD gate-based pipeline
│
├── tests/
│   ├── smoke/                      # 🔥 Layer 1 — Critical path (runs first)
│   ├── regression/                 # 🧪 Layer 2 — Full feature regression
│   ├── api/                        # 🔌 Layer 3 — Network & API validation
│   ├── visual/                     # 📸 Layer 4 — Screenshot comparison
│   ├── accessibility/              # ♿ Layer 5 — WCAG axe-core scans
│   ├── performance/                # 📊 Layer 6 — Load time & page weight
│   ├── responsive/                 # 📱 Layer 7 — Device emulation
│   └── seo/                        # 🔍 Layer 8 — Meta, headings, OG tags
│
├── pages/                          # Page Object Model (POM)
│   ├── BasePage.js                 # Shared methods (navigate, cookies, SEO)
│   ├── HomePage.js                 # Homepage locators + actions
│   ├── ContactPage.js              # Zendesk form interactions
│   ├── NavigationComponent.js      # Top nav + dropdowns
│   └── FooterComponent.js          # Footer links + social
│
├── fixtures/
│   └── testFixtures.js             # Custom test fixtures (cookie consent, page objects)
│
├── test-data/
│   ├── navigation.json             # Real OCUS nav structure (dropdowns + URLs)
│   ├── contactForm.json            # Valid / invalid / edge-case form data
│   ├── devices.json                # Device viewport configs
│   └── seoExpectations.json        # Expected meta values per page
│
├── utils/
│   ├── helpers.js                  # Generic utility functions
│   ├── logger.js                   # Structured timestamped logging
│   ├── linkCrawler.js              # Recursive broken link checker
│   └── performanceMetrics.js       # Web Vitals + resource collection
│
├── .env.example                    # ← Copy this to .env
├── playwright.config.js            # Browser projects, timeouts, reporters
├── package.json
└── README.md
```

---

## ⚡ Quick Start

### Prerequisites

- Node.js `18+` (LTS recommended)
- Git

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/QA-Automation-Playwright.git
cd QA-Automation-Playwright

# 2. Install dependencies
npm ci

# 3. Install Playwright browsers
npx playwright install --with-deps

# 4. Set up environment
cp .env.example .env
```

### Run Tests

```bash
# Run all tests
npm test

# Run by layer
npm run test:smoke        # Smoke tests (fastest, run first)
npm run test:regression   # Regression tests
npm run test:api          # API validation
npm run test:visual       # Visual regression
npm run test:a11y         # Accessibility (WCAG)
npm run test:performance  # Performance budgets
npm run test:responsive   # Mobile + tablet devices
npm run test:seo          # SEO meta checks

# Run by browser
npm run test:chromium
npm run test:firefox
npm run test:webkit

# Run mobile devices only
npm run test:mobile

# View HTML report after run
npm run report
```

---

## 🏗️ Architecture

### Test Execution Pipeline

```
Push → Smoke Tests → [GATE]
                        ├── Regression + API Tests  ─┐
                        ├── Quality (A11y+Perf+SEO) ─┤── Full Suite (main branch only)
                        └── Visual + Responsive     ─┘
```

Smoke tests act as a **gate**: if they fail, all downstream jobs are skipped (saving CI minutes). Regression, Quality, and Visual jobs run **in parallel** after smoke passes.

### Page Object Model

All test files interact with the app through Page Objects — never directly. This means:
- Locators are defined once (in Page Objects)
- Tests read as plain English
- Selector changes require only one fix

```javascript
// ❌ Direct locator in test (brittle)
await page.click('.css-abc123-button');

// ✅ Through Page Object (resilient)
await homePage.clickContactSales();
```

### Custom Fixtures

Import from `fixtures/testFixtures.js` — not from `@playwright/test` directly:

```javascript
const { test, expect } = require('../../fixtures/testFixtures');

test('my test', async ({ homePage, navigation, consoleErrors }) => {
  // homePage, navigation, footer — auto-injected
  // consoleErrors — auto-collected during test
  // Cookie consent — auto-dismissed
});
```

---

## 🧪 Test Layers

| Layer | Folder | Browser(s) | Purpose |
|-------|--------|-----------|---------|
| 1 — Smoke | `tests/smoke/` | Chromium | Verify site is up, nav works |
| 2 — Regression | `tests/regression/` | Chrome + Firefox | Full feature coverage |
| 3 — API | `tests/api/` | Chromium | Network requests, status codes |
| 4 — Visual | `tests/visual/` | Chrome + WebKit | Screenshot comparison |
| 5 — Accessibility | `tests/accessibility/` | Chromium | axe-core WCAG AA scan |
| 6 — Performance | `tests/performance/` | Chromium | Load time, page weight |
| 7 — Responsive | `tests/responsive/` | All 3 + mobile | Device emulation |
| 8 — SEO | `tests/seo/` | Chromium | Meta, canonical, OG tags |

---

## 🌐 Browser & Device Matrix

**Desktop Browsers:**
- Chromium (Chrome/Edge)
- Firefox
- WebKit (Safari)

**Mobile Devices:**
- iPhone 13 (390×844)
- Pixel 7 (412×915)
- iPad Pro 11 (834×1194)

---

## ⚙️ Configuration

### `playwright.config.js` Key Settings

| Setting | Local | CI |
|---------|-------|-----|
| `retries` | 0 | 2 |
| `workers` | max CPU | 2 |
| `timeout` | 60s | 60s |
| `trace` | off | on-first-retry |
| `video` | off | on-first-retry |
| `screenshot` | on-failure | on-failure |

### `.env` Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `BASE_URL` | `https://www.ocus.com` | Target website |
| `CONTACT_URL` | `https://help.ocus.com/hc/en-us/requests/new` | Contact form URL |
| `MAX_PAGE_LOAD_TIME` | `5000` | Performance budget (ms) |
| `VISUAL_DIFF_THRESHOLD` | `0.05` | Visual diff tolerance (5%) |

---

## 📸 Visual Regression

Visual baselines are stored in `tests/visual/*.spec.js-snapshots/`. First run generates them:

```bash
# Generate baselines (first time only)
npm run update:snapshots

# Subsequent runs compare against baselines
npm run test:visual
```

> **Note:** Baselines are committed to the repo. Intentional UI changes require updating snapshots and committing the new baseline.

---

## 📋 CI/CD Pipeline (GitHub Actions)

The pipeline runs on:
- Push to `main` or `develop`
- Pull Requests to `main`
- Scheduled: Mon–Fri at 6:00 AM UTC (11:00 AM PKT)
- Manual trigger from GitHub UI

**Artifacts retained per run:**
- HTML reports (14 days)
- Screenshots (30 days)
- Trace files (14 days)

---

## 🔍 Known Limitations

| Limitation | Reason | Strategy |
|------------|--------|----------|
| Contact form not submitted | Zendesk anti-spam + CAPTCHA | Validate client-side only |
| Visual tests may fail on first run | No baseline exists yet | Run `update:snapshots` first |
| Broken link checker is slow | Network I/O per link | Runs in regression layer (not smoke) |
| Authenticated pages not tested | No test credentials | Out of scope for this framework |

---

## 🛠️ Development

```bash
# Lint code
npm run lint

# Auto-fix lint issues
npm run lint:fix

# Format with Prettier
npm run format

# Run a single test file
npx playwright test tests/smoke/homepage.spec.js

# Run with headed browser (see the browser)
npx playwright test tests/smoke/ --headed

# Debug a specific test
npx playwright test tests/smoke/homepage.spec.js --debug

# Open Playwright trace viewer
npx playwright show-trace test-results/<trace-file>/trace.zip
```

---

## 📊 Test Data

All test data is in `test-data/` as JSON files — no hardcoded values in test files:

- **`navigation.json`** — Real OCUS nav structure: Products (4), Solutions (3), Industries (4), static pages
- **`contactForm.json`** — Valid data, invalid emails, XSS strings, SQL injection strings
- **`devices.json`** — Viewport configurations for responsive tests
- **`seoExpectations.json`** — Expected meta titles, descriptions, H1 tags

---

## 👨‍💻 Author

**Muhammad Haseeb**  
QA Automation Engineer | Playwright Specialist

---

## 📄 License

MIT — free to use, modify, and distribute.
