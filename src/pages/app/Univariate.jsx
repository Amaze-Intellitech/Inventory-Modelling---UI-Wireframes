import React from 'react';
import Descriptive from './Descriptive';

// Pipeline Stage 1 — stock analysed on its own, before any driver is introduced.
export default function Univariate() {
  return <Descriptive mode="uni" />;
}
