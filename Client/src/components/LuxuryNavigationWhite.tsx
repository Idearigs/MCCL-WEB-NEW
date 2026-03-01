import React from 'react';
import LuxuryNavigation from './LuxuryNavigation';

/**
 * LuxuryNavigationWhite — thin wrapper around LuxuryNavigation with forceWhite=true.
 * Used on all non-hero pages so the nav starts opaque/white instead of transparent.
 */
const LuxuryNavigationWhite = (): JSX.Element => {
  return <LuxuryNavigation forceWhite />;
};

export default LuxuryNavigationWhite;
