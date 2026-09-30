import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PlatformProvider } from './context/PlatformContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import AppLayout from './components/layout/AppLayout';

import PrimaryLogin from './pages/app/PrimaryLogin';
import SolutionSelection from './pages/app/SolutionSelection';
import MaterialSelection from './pages/app/MaterialSelection';
import DataSourceConnections from './pages/app/DataSourceConnections';
import ParameterMapping from './pages/app/ParameterMapping';
import Ingestion from './pages/app/Ingestion';

import Overview from './pages/app/Overview';
import DataFoundation from './pages/app/DataFoundation';
import Univariate from './pages/app/Univariate';
import Bivariate from './pages/app/Bivariate';
import Descriptive from './pages/app/Descriptive';
import Liquidation from './pages/app/Liquidation';
import Prevention from './pages/app/Prevention';
import AbcClassification from './pages/app/AbcClassification';
import EoqCalibration from './pages/app/EoqCalibration';
import RmlcLifecycle from './pages/app/RmlcLifecycle';
import RawMaterialRequirements from './pages/app/RawMaterialRequirements';
import WhatIf from './pages/app/WhatIf';
import Optimization from './pages/app/Optimization';
import DecisionIntelligence from './pages/app/DecisionIntelligence';

export default function App() {
  return (
    <PlatformProvider>
      <TooltipProvider delayDuration={150}>
        <BrowserRouter>
          <Routes>
            {/* Onboarding flow */}
            <Route path="/" element={<PrimaryLogin />} />
            <Route path="/solutions" element={<SolutionSelection />} />
            {/* the access check is a modal on /solutions now; old links land there */}
            <Route path="/workspace-access" element={<Navigate to="/solutions" replace />} />
            <Route path="/workspace-login" element={<Navigate to="/solutions" replace />} />
            <Route path="/material-selection" element={<MaterialSelection />} />
            <Route path="/data-sources" element={<DataSourceConnections />} />
            <Route path="/parameter-mapping" element={<ParameterMapping />} />
            <Route path="/ingestion" element={<Ingestion />} />

            {/* Platform (persistent Rail + TopBar shell) */}
            <Route path="/app" element={<AppLayout />}>
              <Route index element={<Overview />} />
              <Route path="data-foundation" element={<DataFoundation />} />
              <Route path="descriptive" element={<Descriptive />} />
              <Route path="univariate" element={<Univariate />} />
              <Route path="bivariate" element={<Bivariate />} />
              <Route path="abc" element={<AbcClassification />} />
              <Route path="eoq" element={<EoqCalibration />} />
              <Route path="rmlc" element={<RmlcLifecycle />} />
              <Route path="raw-materials" element={<RawMaterialRequirements />} />
              <Route path="what-if" element={<WhatIf />} />
              <Route path="liquidation" element={<Liquidation />} />
              <Route path="prevention" element={<Prevention />} />
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
