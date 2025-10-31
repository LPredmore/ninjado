import React from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import TimeTracker from './TimeTracker';
import { useIsMobile } from '@/hooks/use-mobile';
import LazyEfficiencyBadge from './LazyEfficiencyBadge';

interface SidebarLayoutProps {
  children: React.ReactNode;
  onSignOut: () => Promise<void>;
  totalTimeSaved: number;
  userId?: string;
}

const SidebarLayout = ({ children, onSignOut, totalTimeSaved, userId }: SidebarLayoutProps) => {
  const isMobile = useIsMobile();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background overflow-x-hidden">
        <AppSidebar onSignOut={onSignOut} />
        <SidebarInset className="flex-1 max-w-full overflow-x-hidden">
          <div className="flex flex-col min-h-screen">
            <header 
              className="sticky top-0 z-10 flex h-14 md:h-16 shrink-0 items-center justify-between gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4"
              style={{ paddingTop: 'max(1rem, var(--safe-area-inset-top))' }}
            >
              {isMobile && (
                <SidebarTrigger className="clay-element rounded-xl p-3 text-foreground hover:bg-accent/20 min-w-[44px] min-h-[44px] flex items-center justify-center" />
              )}
              <div className="flex-1 flex justify-end items-center gap-3">
                {userId && !isMobile && <LazyEfficiencyBadge userId={userId} variant="compact" />}
                <TimeTracker totalTimeSaved={totalTimeSaved} />
              </div>
            </header>
            <main 
              className="flex-1 overflow-auto"
              style={{ paddingBottom: 'max(0px, var(--safe-area-inset-bottom))' }}
            >
              {children}
            </main>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default SidebarLayout;