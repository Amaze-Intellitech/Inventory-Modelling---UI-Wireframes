# AITEK Inventory Intelligence Platform

An interactive **Inventory Intelligence and Multi-Echelon Analytics** UI prototype built with React 18 and Vite. It demonstrates how supply-chain teams can move from raw-material data preparation to inventory analysis, scenario modelling, optimization, and decision governance in one workspace.

The application is currently a front-end wireframe with illustrative data. It is intended to validate workflows, information architecture, and interaction patterns before production data integrations are connected.

## What This Is

The platform models raw-material inventory as the starting point for downstream production and replenishment decisions. It follows the nine-stage **Inventory Intelligence pipeline** defined in the solution design, and brings together:

- Sign-in is **always single sign-on** (Microsoft Entra ID, or the organisation's own SAML / OIDC provider). There is no password form. After sign-in, an access check resolves which plants and solutions the user may open.
- One-time onboarding for first-time users: material selection, then **parameters** (choose the drivers and declare a source system for each), then **data sources** (connect only the sources those parameters need), then ingestion and data-quality status. Returning users go straight to the dashboard and can change their parameters or data sources later from Data Foundation.
- Nine analytical stages in a fixed order: Univariate, Bivariate, ABC, EOQ, RMLC, Multivariate (with model validation), Optimization, What-if, and the Inventory Agent
- "Get to Green, Stay Green" screens for Liquidation and Prevention (wireframe proposals, pending SME review)
- A business-first layout on every stage page: an AI insight in plain language first, then the chart, then collapsed technical detail

The interface supports executive, supply-chain analyst, and data-science perspectives through persona-aware views and shared platform context.

## Prototype Scope

- Screens use mock data from `src/data/mockData.js`.
- Routes and interactions are implemented for UI exploration.
- ERP, SQL warehouse, authentication, and production optimization services are not connected yet.
- Charts are rendered as responsive React/SVG components for the wireframe experience.

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
4. **Canonical Workflow (nine stages, fixed order)**:
   - **Entry**: SSO sign-in → solution → access-check modal. A returning user then opens `/app` directly; a first-time user continues to onboarding. The "loaded" flag is stored in `localStorage` (`aitek-onboarded`), set when ingestion completes.
   - **Onboarding (first time only)**: Material selection with ABC tier → ~40-parameter checklist with a source per parameter and a data range (one default range per material, as in the design bible; each parameter can override it) → data sources (the page lists the connectors the chosen parameters need, and continuing is blocked until each is connected) → ingestion and data-quality status. Master-data gaps block the run; warnings do not.
   - **1 Univariate** and **2 Bivariate**: Stock on its own, then against one driver at a time. Bivariate ends in a ranked driver shortlist for the Multivariate stage.
   - **3 ABC**: Value tiers (A, B, C) that decide which materials get full modelling.
   - **4 EOQ**: Economic order quantity as a time series, with the drivers of its change (demand, ordering cost, carrying cost).
   - **5 RMLC**: The cash cycle from supplier PO to customer payment, split by leg, with the bottleneck leg called out. The earlier stock-lifecycle stages sit below it.
   - **6 Multivariate**: Expected stock with the drivers that matter most. Residuals, error metrics and diagnostics (multicollinearity, heteroskedasticity, ANOVA) are in a collapsed *Model validation* panel.
   - **7 Optimization**: Confirm the objective and constraints, choose Static, Dynamic or On-the-fly mode, then read expected vs optimal.
   - **8 What-if**: Single or multi-variable scenarios with projected inventory, inventory coverage ratio and turnover, each with an AI interpretation.
   - **9 Inventory Agent**: Free-text questions, an always-visible trace of the stages it invoked (each links back to its page), and the three canonical prompts.
   - **Liquidation** and **Prevention**: Clear existing excess, ageing and duplicate stock ("Get to Green"), then warn early before it builds up again ("Stay Green").

---

## Tech Stack

- **Framework**: React 18.2 + React Router 6.23 (client-side routing)
- **Bundler / Dev Server**: Vite 5.2
- **Styling**: Tailwind CSS 3.4 with shadcn-style Radix components in `src/components/ui/`, driven by CSS variables (`src/index.css`)
- **Icons**: Lucide React
- **Typography**: Urbanist (display headings only), Inter (UI, labels, tables and numerals, with tabular figures) and JetBrains Mono (IDs and code)
- **Charts**: Responsive SVG built directly in JSX (`src/components/Charts.jsx`), each with a legend and a "View as table" view
- **Theme**: Light and dark, toggled from the header of every screen (`src/components/ThemeToggle.jsx`) and stored in `localStorage` (`src/lib/theme.js`)
- **Persona lens**: the top-bar switch (Data Scientist / Analyst / C-Suite) changes the Overview insight, KPIs, table columns and sort, and the insight and detail sections on Data Foundation, Liquidation, Prevention and What-if, as well as the stage pages that already had lens content
- **Screen density**: Page and card descriptions sit behind an ⓘ popover (`InfoTip`), and AI insights clamp to two lines with a "Show more" toggle

---

## Project Structure

```
├── package.json             # Project dependencies and npm scripts
├── vite.config.js           # Vite build configuration (`@` aliases `src`)
├── tailwind.config.js       # Maps Tailwind colours, radii and fonts to the CSS variables
├── index.html               # SPA host; loads fonts and sets the theme before first paint
├── src/
│   ├── main.jsx             # React DOM root render
│   ├── App.jsx              # Route table (onboarding flow + /app shell)
│   ├── index.css            # Brand tokens (light and dark), shared classes, layout rules
│   ├── lib/
│   │   ├── utils.js         # `cn` class-name helper
│   │   └── theme.js         # `useTheme` hook (light / dark)
│   ├── context/
│   │   └── PlatformContext.jsx  # Persona (exec/analyst/ds), role, plant, & material state
│   ├── data/
│   │   ├── mockData.js      # Canonical material intelligence and illustrative dataset
│   │   └── parameterCatalog.js  # ~40 candidate parameters and source options
│   ├── components/
│   │   ├── CommonUI.jsx     # ViewHead, Badge, Card, KpiTile, Insight (AI), DrillDown, AlertBar, Stepper
│   │   ├── Charts.jsx       # SVG charts + ChartFrame (legend, "View as table")
│   │   ├── Lifecycle.jsx    # "Get to Green → Stay Green" five-phase strip
│   │   ├── DriverHeatmap.jsx    # Bivariate correlation heatmap + Multivariate shortlist
│   │   ├── EoqTimeSeries.jsx    # EOQ over time and its drivers
│   │   ├── RmlcLegs.jsx         # Cash-cycle legs and bottleneck
│   │   ├── ModelValidation.jsx  # Multivariate headline + collapsed validation panel
│   │   ├── OptimizationSetup.jsx  # Objective, constraints and mode
│   │   ├── IngestionStatus.jsx  # Ingestion and data-quality status
│   │   ├── ThemeToggle.jsx      # Light / dark switch used in every header
│   │   ├── SsoSignIn.jsx        # Single sign-on card (no password field)
│   │   ├── AccessCheckDialog.jsx  # Access-check modal shown when a solution is picked
│   │   ├── ui/              # Radix-based primitives (button, badge, select, table, …)
│   │   └── layout/
│   │       ├── AppLayout.jsx      # Application shell (top bar, stage tabs, small-screen drawer)
│   │       ├── PrimaryNav.jsx     # Header navigation: Overview, Data Foundation, Analysis, Liquidation, Prevention
│   │       ├── Rail.jsx           # Small-screen navigation drawer, in pipeline order with stage numbers
│   │       ├── TopBar.jsx         # Brand, primary navigation, persona switch, theme toggle, sign out
│   │       ├── PipelineStrip.jsx  # Nine-stage tab bar (grouped by lifecycle step) shown on the stage pages
│   │       └── OnboardingShell.jsx  # Frame for the parameter and ingestion steps
│   └── pages/
│       └── app/
│           ├── PrimaryLogin.jsx, SolutionSelection.jsx, AccessCheckDialog (modal)  # SSO sign-in, solution, access check
│           ├── MaterialSelection.jsx, DataSourceConnections.jsx              # Onboarding steps 1–2
│           ├── ParameterMapping.jsx, Ingestion.jsx                           # Onboarding steps 3–4
│           ├── Overview.jsx, DataFoundation.jsx
│           ├── Univariate.jsx, Bivariate.jsx      # Stages 1–2 (both render Descriptive.jsx)
│           ├── AbcClassification.jsx, EoqCalibration.jsx, RmlcLifecycle.jsx   # Stages 3–5
│           ├── RawMaterialRequirements.jsx        # Stage 6, Multivariate
│           ├── Optimization.jsx, WhatIf.jsx       # Stages 7–8
│           ├── DecisionIntelligence.jsx           # Stage 9, Inventory Agent
│           └── Liquidation.jsx, Prevention.jsx    # Get to Green / Stay Green
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

Tokens follow the **AITEK Style Guide v1.2**. Dark theme values are applied under `:root[data-theme="dark"]`.

| Role | CSS variable | Light value / purpose |
| :--- | :--- | :--- |
| **Ink** | `--ink` | `#0F172B`, headings, labels and values |
| **Primary** | `--primary` / `--primary-solid` | `#155DFC`, text, links and focus / fills that carry white text |
| **Body / Subtle** | `--body-c` / `--subtle` | `#45556C` paragraphs / `#5B6B84` captions and table headers |
| **Border** | `--border` / `--border-strong` | `#E2E8F0` hairlines / `#8493AA` inputs and outline buttons |
| **Page / Card** | `--bg` / `--surface` | `#F8FAFC` canvas / `#FFFFFF` cards |
| **Status** | `--success`, `--warning`, `--error`, `--info` (+ `-bg`, `-tx`) | Always paired with a shape and a label: circle, triangle, diamond, square |
| **AI** | `--ai`, `--ai-bg`, `--ai-tx` | Violet, marks only what an AI produced. Always paired with the word "AI" or "Agent". |
| **Series** | `--s1` … `--s5` | Categorical chart series, fixed order, five at most |
| **Ordinal (ABC)** | `--ord-a`, `--ord-b`, `--ord-c` | Tier ramp, strongest step is the most important tier |
| **Sequential** | `--q1` … `--q5` | Magnitude ramp for the correlation heatmap |
| **Diverging** | `--dv-u1…3`, `--dv-o1…3` | Under-stock (blue) and over-stock (orange) arms |
| **Fonts** | `--font-display`, `--font-ui`, `--font-mono` | Urbanist, Inter, JetBrains Mono |

Rules of thumb: labels are never below 12px; numerals use Inter with tabular figures; one y-axis per chart; every chart has a legend and a table view; status is never colour alone.
