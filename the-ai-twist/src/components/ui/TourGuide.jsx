import React, { useState, useEffect } from 'react';
import { Joyride, STATUS } from 'react-joyride';

export default function TourGuide({ runTour, setRunTour }) {
  const [steps] = useState([
    {
      target: '[data-tour="step-1"]',
      content: 'Welcome to The Iconic Executive Dashboard! This button lets you restart this tour anytime.',
      disableBeacon: true,
    },
    {
      target: '[data-tour="step-2"]',
      content: 'Use this global filter to highlight a specific store across all macro and micro charts.',
    },
    {
      target: '[data-tour="step-3"]',
      content: 'Your macro KPIs and Top Stores at a glance. Notice the time filter applied here versus the unbounded trend charts.',
    },
    {
      target: '[data-tour="step-4"]',
      content: 'Identify critical flash sales and drops. 🟢 indicates a Spike, 🔴 indicates a Drop.',
    },
    {
      target: '[data-tour="step-5"]',
      content: 'Track the greatest Volatility events: Comeback Kings vs Fail Kings.',
    },
    {
      target: '[data-tour="step-6"]',
      content: 'Fuel Price Elasticity: Watch out for the 10% Vulnerability Threshold where all stores plunge into Pro-Cyclical vulnerability.',
    },
    {
      target: '[data-tour="step-7"]',
      content: 'Unemployment Resilience (The Lipstick Effect): Discover which stores successfully capture down-trading consumers during economic hardship.',
    }
  ]);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('hasSeenTour');
    if (!hasSeenTour) {
      setRunTour(true);
    }
  }, [setRunTour]);

  const handleJoyrideCallback = (data) => {
    const { status } = data;
    const finishedStatuses = [STATUS.FINISHED, STATUS.SKIPPED];
    
    if (finishedStatuses.includes(status)) {
      setRunTour(false);
      localStorage.setItem('hasSeenTour', 'true');
    }
  };

  return (
    <Joyride
      steps={steps}
      run={runTour}
      continuous={true}
      showSkipButton={true}
      showProgress={true}
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#10b981', // emerald-500
          textColor: '#0f172a', // slate-900
          backgroundColor: '#ffffff',
          overlayColor: 'rgba(0, 0, 0, 0.6)',
        },
        tooltip: {
          borderRadius: '8px',
          border: '1px solid #e2e8f0'
        }
      }}
    />
  );
}
