import React from 'react';
import { Outlet } from 'react-router-dom';
import Rail from './Rail';
import TopBar from './TopBar';

// Shell for every screen inside the platform (post-onboarding).
// Rail + TopBar are persistent; <Outlet/> swaps the active page.
export default function AppLayout() {
  return (
    <div className="app">
      <Rail />
      <TopBar />
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
