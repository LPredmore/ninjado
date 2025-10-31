import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { getQueryClient } from "@/lib/queryClientConfig";
import { createQueryPrefetchManager } from "@/lib/queryPrefetching";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState, Suspense, lazy } from 'react';
import ProtectedRoute from "./components/ProtectedRoute";
import UpdatePrompt from "./components/UpdatePrompt";
import LoadingSpinner from "./components/LoadingSpinner";
import { User } from '@supabase/supabase-js';
import { supabase } from "@/integrations/supabase/client";
import { TimeTrackingProvider } from "./contexts/TimeTrackingContext";
import { initializePerformanceIntegration } from "@/lib/performanceIntegration";

// Lazy load page components for better code splitting
const Index = lazy(() => import("./pages/Index"));
const Login = lazy(() => import("./pages/Login"));
const Routines = lazy(() => import("./pages/Routines"));
const Rewards = lazy(() => import("./pages/Rewards"));
const Reports = lazy(() => import("./pages/Reports"));
const HowToUse = lazy(() => import("./pages/HowToUse"));
const Profile = lazy(() => import("./pages/Profile"));
const Contact = lazy(() => import("./pages/Contact"));
const Parent = lazy(() => import("./pages/Parent"));

const queryClient = getQueryClient();

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize performance monitoring
    const cleanupPerformanceMonitoring = initializePerformanceIntegration();
    
    // Cleanup on unmount
    return cleanupPerformanceMonitoring;
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user ?? null;
      setUser(user);
      setLoading(false);
      
      // Prefetch user data when user logs in
      if (user) {
        const prefetchManager = createQueryPrefetchManager(queryClient, supabase);
        prefetchManager.prefetchUserData(user.id).catch(console.error);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      setUser(user);
      
      // Prefetch user data when user logs in
      if (user) {
        const prefetchManager = createQueryPrefetchManager(queryClient, supabase);
        prefetchManager.prefetchUserData(user.id).catch(console.error);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Initializing app..." />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <UpdatePrompt />
          {user ? (
            <TimeTrackingProvider user={user}>
              <Toaster />
              <Sonner />
              <Suspense fallback={<LoadingSpinner message="Loading page..." />}>
                <Routes>
                  <Route path="/" element={<Index user={user} supabase={supabase} />} />
                  <Route 
                    path="/routines" 
                    element={
                      <ProtectedRoute userId={user.id}>
                        <Routines user={user} supabase={supabase} />
                      </ProtectedRoute>
                    } 
                  />
                  <Route path="/rewards" element={<Rewards user={user} supabase={supabase} />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route 
                    path="/parent" 
                    element={
                      <ProtectedRoute userId={user.id}>
                        <Parent user={user} supabase={supabase} />
                      </ProtectedRoute>
                    } 
                  />
                  <Route path="/how-to-use" element={<HowToUse />} />
                  <Route path="/profile" element={<Profile user={user} supabase={supabase} />} />
                  <Route path="/contact" element={<Contact user={user} supabase={supabase} />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </TimeTrackingProvider>
          ) : (
            <>
              <Toaster />
              <Sonner />
              <Suspense fallback={<LoadingSpinner message="Loading..." />}>
                <Routes>
                  <Route path="/login" element={<Login supabase={supabase} />} />
                  <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
              </Suspense>
            </>
          )}
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;