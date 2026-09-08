import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PlatformProvider } from './context/PlatformContext';
import AppLayout from './components/layout/AppLayout';

import PrimaryLogin from './pages/onboarding/PrimaryLogin';
import SolutionSelection from './pages/onboarding/SolutionSelection';
import SecondaryLogin from './pages/onboarding/SecondaryLogin';
import MaterialSelection from './pages/onboarding/MaterialSelection';
import DataSourceConnections from './pages/onboarding/DataSourceConnections';

import Overview from './pages/app/Overview';
import DataFoundation from './pages/app/DataFoundation';
import Descriptive from './pages/app/Descriptive';
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
      <BrowserRouter>
        <Routes>
          {/* Onboarding flow */}
          <Route path="/" element={<PrimaryLogin />} />
          <Route path="/solutions" element={<SolutionSelection />} />
          <Route path="/workspace-login" element={<SecondaryLogin />} />
          <Route path="/material-selection" element={<MaterialSelection />} />
          <Route path="/data-sources" element={<DataSourceConnections />} />

          {/* Platform (persistent Rail + TopBar shell) */}
          <Route path="/app" element={<AppLayout />}>
            <Route index element={<Overview />} />
            <Route path="data-foundation" element={<DataFoundation />} />
            <Route path="descriptive" element={<Descriptive />} />
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
    </PlatformProvider>
  );
}
