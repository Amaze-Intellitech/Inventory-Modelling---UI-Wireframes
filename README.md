# AITEK Inventory Intelligence Platform

An enterprise-grade **Inventory Intelligence & Multi-Echelon Analytics** application built with React 18, Vite 5, and vanilla CSS design tokens. 

The platform models raw-material inventory dynamics, downstream multi-product demand propagation, empirical Pareto segmentation, stochastic lot-sizing calibration, lifecycle phase management, multivariate demand forecasting, and decision governance.

---

## Key Business & Inventory Modelling Principles

1. **One Raw Material → Many Downstream Products Demand Driver Model**:
   - Raw materials are modeled as **inventory and procurement objects**.
   - Downstream finished goods are **demand drivers** whose production schedules and BOM usage rates dictate aggregate raw-material demand:
     $$\text{Derived RM Demand} = \text{Product Annual Production Plan} \times \text{BOM Usage Rate}$$
2. **Modern ABC Classification & Segmentation Layer**:
   - Primary economic segmentation basis is **Annual Consumption Value** ($\text{Annual Demand} \times \text{Unit Purchase Cost}$) across a $43.86M enterprise catalog (1,420 SKUs).
   - Augmented with 5-dimensional contextual intelligence: Demand Volatility ($\text{CV}$), Downstream Product Dependency (fan-out and critical lines), Supply Latency (lead time & single-source exposure), and Assembly Criticality.
   - Strict separation of financial measures: Annual Consumption Value, Physical On-Hand Stock ($13.71M enterprise total), Working Capital, and Inventory Value at Risk.
3. **Multi-Persona Intelligence Engine**:
   - **Data Scientist (`ds`)**: Empirical distribution curves, Gini inequality ($0.81$), statistical outlier thresholds, forecast confidence intervals, and methodological rigor.
   - **Supply Chain Analyst (`analyst`)**: Operational review cadences (weekly/monthly/quarterly), cycle-count accuracy targets ($99\% / 95\% / 90\%$), downstream assembly line continuity, and replenishment priority queues.
   - **C-Suite Executive (`exec`)**: Portfolio economic concentration ($78.30\%$ of value in $10.00\%$ of SKUs), working-capital exposure, balance-sheet physical stock protection, and strategic vendor relationship governance.
4. **Canonical Workflow & Architectural Boundaries**:
   - **Data Foundation & Onboarding**: Multi-ERP / SQL warehouse connector interfaces and material master selection.
   - **Descriptive Analytics**: Univariate consumption velocities, bivariate supplier latency correlations, and statistical anomaly detection.
   - **ABC Classification**: Economic segmentation, governance cadences, and downstream product fan-out context.
   - **EOQ Calibration**: Total-cost minimizing lot-size calculations ($Q^*$), holding vs. ordering cost balance, and policy delta metrics.
   - **RMLC Lifecycle**: Active circulation, accumulation, at-risk stagnation timers, and liquidation stage governance.
   - **Multivariate Forecasting**: 16-week historical demand, 12-week probabilistic projection horizons, and lead-time buffer arrival markers.
   - **What-If Simulation**: Dynamic parametric stress-testing across lead times, holding rates, and demand surges.
   - **Production Optimization**: Multi-plant constraint solving and throughput optimization.
   - **Decision Intelligence**: Actionable approval queues, confidence intervals, and financial impact tracking.

---

## Tech Stack

- **Framework**: React 18.2 + React Router 6.23 (Client-side routing)
- **Bundler / Dev Server**: Vite 5.2
- **Icons**: Lucide React
- **Styling**: Clean Vanilla CSS with custom design tokens (`--ink`, `--navy-800`, `--accent`, `--success`, `--watch`, `--risk`)
- **Typography**: Inter (UI font) and IBM Plex Mono (tabular numeric data)
- **Charts**: Lightweight, responsive SVG vector graphics built directly in JSX

---

## Project Structure

```
├── .gitignore               # Standard git ignore patterns
├── package.json             # Project dependencies and npm scripts
├── vite.config.js           # Vite build configuration
├── index.html               # Single-page app HTML host
├── src/
│   ├── main.jsx             # React DOM root render
│   ├── App.jsx              # Application router table
│   ├── index.css            # Design tokens, utility classes, and layout rules
│   ├── context/
│   │   └── PlatformContext.jsx  # Persona (exec/analyst/ds), role, plant, & material state
│   ├── data/
│   │   └── mockData.js      # Canonical material intelligence and illustrative dataset
│   ├── components/
│   │   ├── CommonUI.jsx     # ViewHead, Badge, Card, KpiTile, WhyDisclosure, Insight
│   │   ├── Charts.jsx       # Custom SVG charts (Pareto, EOQ curve, Forecast, Scatter)
│   │   └── layout/
│   │       ├── AppLayout.jsx  # Main application shell
│   │       ├── Rail.jsx       # Left navigation sidebar
│   │       └── TopBar.jsx     # Plant scope, role selection, and persona switch
│   └── pages/
│       ├── onboarding/      # Login, Solution, Secondary Auth, Material Selector
│       └── app/             # 10 core analytics & modelling views
│           ├── Overview.jsx
│           ├── Descriptive.jsx
│           ├── AbcClassification.jsx
│           ├── EoqCalibration.jsx
│           ├── RmlcLifecycle.jsx
│           ├── RawMaterialRequirements.jsx
│           ├── WhatIf.jsx
│           ├── Optimization.jsx
│           ├── DecisionIntelligence.jsx
│           └── DataFoundation.jsx
```

---

## Getting Started

### Prerequisites
- Node.js 18.0 or higher
- npm 9.0 or higher

### Installation & Run

```bash
# 1. Install dependencies
npm install

# 2. Start local development server
npm run dev

# 3. Build for production
npm run build

# 4. Preview production build
npm run preview
```

---

## Design System & Styling Tokens

| Token | CSS Variable | Value / Purpose |
| :--- | :--- | :--- |
| **Ink** | `--ink` | `#0B1220` (Dark brand contrast) |
| **Navy 800** | `--navy-800` | `#132038` (Sidebar & deep containers) |
| **Accent** | `--accent` | `#0EA5E9` (Primary brand highlight) |
| **Success** | `--success` | `#0F9D6C` (Positive trends & optimal EOQ) |
| **Watch** | `--watch` | `#B7791F` (Threshold warnings & lead-time markers) |
| **Risk** | `--risk` | `#C0362C` (Anomalies, stockouts & Class A boundaries) |
| **Monospace** | `--font-mono` | `'IBM Plex Mono', monospace` (Tabular numerics) |
