import React from 'react';
import Header from './Header';
import TimeTracker from './TimeTracker';

interface LayoutProps {
  children: React.ReactNode;
  onSignOut: () => Promise<void>;
  totalTimeSaved: number;
}

const Layout = ({ children, onSignOut, totalTimeSaved }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-ninja-background p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="space-y-4">
          <Header onSignOut={onSignOut} />
          <TimeTracker totalTimeSaved={totalTimeSaved} />
        </div>
        {children}
      </div>
    </div>
  );
};

export default Layout;