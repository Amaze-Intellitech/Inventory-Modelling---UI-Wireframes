import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import Rail from './Rail';
import TopBar from './TopBar';

// Shell for every screen inside the platform (post-onboarding).
// Rail + TopBar are persistent; <Outlet/> swaps the active page.
export default function AppLayout() {
  const location = useLocation();
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="app">
      <Rail />
      <TopBar />
      <main className="main">
        <motion.div
          key={location.pathname}
          initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="w-full"
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}
