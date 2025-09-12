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
import HowToUse from "./pages/HowToUse";
import Profile from "./pages/Profile";
import Contact from "./pages/Contact";
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
    return <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-lg">Loading...</div>
    </div>;
  }

  // Check if Supabase is configured
  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
    return <div className="min-h-screen bg-red-100 flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-xl font-bold text-red-800 mb-2">Configuration Error</h1>
        <p className="text-red-700">Supabase environment variables are not configured.</p>
        <p className="text-sm text-red-600 mt-2">Please set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY</p>
      </div>
    </div>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          {user ? (
            <TimeTrackingProvider user={user}>
              <Toaster />
              <Sonner />
              <Routes>
                <Route path="/" element={<Index user={user} supabase={supabase} />} />
                <Route path="/routines" element={<Routines user={user} supabase={supabase} />} />
                <Route path="/rewards" element={<Rewards user={user} supabase={supabase} />} />
                <Route path="/how-to-use" element={<HowToUse />} />
                <Route path="/profile" element={<Profile user={user} supabase={supabase} />} />
                <Route path="/contact" element={<Contact user={user} supabase={supabase} />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </TimeTrackingProvider>
          ) : (
            <>
              <Toaster />
              <Sonner />
              <Routes>
                <Route path="/login" element={<Login supabase={supabase} />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </>
          )}
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;