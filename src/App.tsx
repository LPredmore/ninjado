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
import Reports from "./pages/Reports";
import HowToUse from "./pages/HowToUse";
import Profile from "./pages/Profile";
import Contact from "./pages/Contact";
import Parent from "./pages/Parent";
import ProtectedRoute from "./components/ProtectedRoute";
import UpdatePrompt from "./components/UpdatePrompt";
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

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <UpdatePrompt />
          {user ? (
            <TimeTrackingProvider user={user}>
              <Toaster />
              <Sonner />
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