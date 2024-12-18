import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from 'react';
import Index from "./pages/Index";
import Login from "./pages/Login";
import Routines from "./pages/Routines";
import Rewards from "./pages/Rewards";
import { User } from '@supabase/supabase-js';
import { supabase } from "@/integrations/supabase/client";
import { TimeTrackingProvider } from "./contexts/TimeTrackingContext";

const queryClient = new QueryClient();

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {user && (
          <TimeTrackingProvider user={user}>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route
                  path="/"
                  element={
                    user ? (
                      <Index user={user} supabase={supabase} />
                    ) : (
                      <Navigate to="/login" replace />
                    )
                  }
                />
                <Route
                  path="/routines"
                  element={
                    user ? (
                      <Routines user={user} supabase={supabase} />
                    ) : (
                      <Navigate to="/login" replace />
                    )
                  }
                />
                <Route
                  path="/rewards"
                  element={
                    user ? (
                      <Rewards user={user} supabase={supabase} />
                    ) : (
                      <Navigate to="/login" replace />
                    )
                  }
                />
                <Route
                  path="/login"
                  element={
                    !user ? (
                      <Login supabase={supabase} />
                    ) : (
                      <Navigate to="/" replace />
                    )
                  }
                />
              </Routes>
            </BrowserRouter>
          </TimeTrackingProvider>
        )}
        {!user && (
          <>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route
                  path="/login"
                  element={
                    !user ? (
                      <Login supabase={supabase} />
                    ) : (
                      <Navigate to="/" replace />
                    )
                  }
                />
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </BrowserRouter>
          </>
        )}
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;