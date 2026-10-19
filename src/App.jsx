import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PlatformProvider } from './context/PlatformContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import AppLayout from './components/layout/AppLayout';
import { usePlatform } from './context/PlatformContext';
import { goToPortal } from './lib/portal';

import Launch from './pages/app/Launch';
import MaterialSelection from './pages/app/MaterialSelection';
import DataSourceConnections from './pages/app/DataSourceConnections';
import ParameterMapping from './pages/app/ParameterMapping';
import Ingestion from './pages/app/Ingestion';

import Overview from './pages/app/Overview';
import DataFoundation from './pages/app/DataFoundation';
import Univariate from './pages/app/Univariate';
import Bivariate from './pages/app/Bivariate';
import Liquidation from './pages/app/Liquidation';
import Prevention from './pages/app/Prevention';
import AbcClassification from './pages/app/AbcClassification';
import EoqCalibration from './pages/app/EoqCalibration';
import RmlcLifecycle from './pages/app/RmlcLifecycle';
import RawMaterialRequirements from './pages/app/RawMaterialRequirements';
import WhatIf from './pages/app/WhatIf';
import Optimization from './pages/app/Optimization';
import DecisionIntelligence from './pages/app/DecisionIntelligence';

// Sign-in lives in the AITEK portal. Without a session from its launch ticket, every page sends the user there.
function ToPortal({ path = '/' }) {
  React.useEffect(() => goToPortal(path), [path]);
  return null;
}

function RequireSession({ children }) {
  const { user } = usePlatform();
  return user ? children : <ToPortal />;
}

const guard = (el) => <RequireSession>{el}</RequireSession>;

export default function App() {
  return (
    <PlatformProvider>
      <TooltipProvider delayDuration={150}>
        <BrowserRouter>
          <Routes>
            {/* Entry from the AITEK portal (sign-in and the solution launcher live there) */}
            <Route path="/" element={<Navigate to="/launch" replace />} />
            <Route path="/launch" element={<Launch />} />
            {/* old entry links go back to the portal launcher */}
            <Route path="/solutions" element={<ToPortal path="/apps" />} />
            <Route path="/workspace-access" element={<ToPortal path="/apps" />} />
            <Route path="/workspace-login" element={<ToPortal path="/apps" />} />

            {/* One-time data setup */}
            <Route path="/material-selection" element={guard(<MaterialSelection />)} />
            <Route path="/data-sources" element={guard(<DataSourceConnections />)} />
            <Route path="/parameter-mapping" element={guard(<ParameterMapping />)} />
            <Route path="/ingestion" element={guard(<Ingestion />)} />

            {/* Platform (persistent Rail + TopBar shell) */}
            <Route path="/app" element={guard(<AppLayout />)}>
              <Route index element={<Overview />} />
              <Route path="data-foundation" element={<DataFoundation />} />
              <Route path="univariate" element={<Univariate />} />
              <Route path="bivariate" element={<Bivariate />} />
              <Route path="liquidation" element={<Liquidation />} />
              <Route path="prevention" element={<Prevention />} />
              {/* legacy path from before the Univariate / Bivariate split */}
              <Route path="descriptive" element={<Navigate to="/app/univariate" replace />} />
              <Route path="abc" element={<AbcClassification />} />
              <Route path="eoq" element={<EoqCalibration />} />
              <Route path="rmlc" element={<RmlcLifecycle />} />
              <Route path="raw-materials" element={<RawMaterialRequirements />} />
              <Route path="what-if" element={<WhatIf />} />
              <Route path="optimization" element={<Optimization />} />
              <Route path="decisions" element={<DecisionIntelligence />} />
            </Route>
          </Routes>
        </BrowserRouter>
        <Toaster position="top-right" closeButton />
      </TooltipProvider>
    </PlatformProvider>
  );
}
