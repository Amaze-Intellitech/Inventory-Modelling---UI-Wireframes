import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import Rail from './Rail';
import TopBar from './TopBar';
import PipelineStrip from './PipelineStrip';

// Shell for every screen inside the platform (post-onboarding).
// Rail + TopBar are persistent; <Outlet/> swaps the active page.
export default function AppLayout() {
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();
  const [railOpen, setRailOpen] = useState(false);

  // Close the mobile navigation after every route change.
  useEffect(() => { setRailOpen(false); }, [location.pathname]);

  return (
    <div className="app">
      <Rail open={railOpen} />
      <div className={`rail-backdrop${railOpen ? ' open' : ''}`} onClick={() => setRailOpen(false)} aria-hidden="true" />
      <TopBar onMenu={() => setRailOpen((o) => !o)} />
      <main className="main">
        <motion.div
          key={location.pathname}
          initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="w-full"
        >
          <PipelineStrip />
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}
