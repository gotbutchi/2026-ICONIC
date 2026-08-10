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
      target: '[data-tour="step-3b"]',
      content: 'Which weeks actually move the estate? Black Friday spikes hardest, but the pre-Christmas week moves 40 of 45 stores — and repeats the next year. Amber bars are weeks the source holiday flag misses entirely.',
    },
    {
      target: '[data-tour="step-4"]',
      content: 'Individual flash sales and drops, scored against a trailing 52-week baseline that excludes the week being tested. Hover any point to see how many weeks built its baseline.',
    },
    {
      target: '[data-tour="step-5"]',
      content: 'Track the greatest Volatility events: Comeback Kings vs Fail Kings.',
    },
    {
      target: '[data-tour="step-6"]',
      content: 'Fuel Price Elasticity. Every store-week where fuel rose above 5% is here, not just the favourable ones. Note the threshold line: only 3 store-weeks in the whole dataset sit beyond +10%, so treat that as a hypothesis rather than a funded rule.',
    },
    {
      target: '[data-tour="step-7"]',
      content: 'Unemployment Resilience. Switch the baseline dropdown to see why the measure matters: Store 35 reads 126% against its all-period average but 99.4% against a trailing 52-week one.',
    },
    {
      target: '[data-tour="step-8"]',
      content: 'Finally, full disclosure: every row the pipeline excluded or repaired, and why. Three rows out of 6,435.',
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
