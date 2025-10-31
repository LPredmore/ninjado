import { useState } from 'react';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { SupabaseClient } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import SignupForm from '@/components/SignupForm';
import logo from '@/assets/logo.png';

interface LoginProps {
  supabase: SupabaseClient;
}

const Login = ({ supabase }: LoginProps) => {
  const [isSignupMode, setIsSignupMode] = useState(false);

  const handleSignupSuccess = () => {
    setIsSignupMode(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ninja-sky via-white to-ninja-lavender flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-clay">
        <div className="text-center">
          <img 
            src={logo} 
            alt="NinjaDo Logo" 
            className="w-24 h-24 mx-auto mb-4"
          />
          <h1 className="text-4xl font-bold text-foreground">NinjaDo</h1>
          <p className="mt-2 text-muted-foreground">
            {isSignupMode ? 'Create your ninja account' : 'Sign in to manage your routines'}
          </p>
        </div>

        {/* Toggle between Login and Signup */}
        <div className="flex rounded-lg bg-muted p-1">
          <Button
            variant={!isSignupMode ? "default" : "ghost"}
            className="flex-1 rounded-md"
            onClick={() => setIsSignupMode(false)}
          >
            Sign In
          </Button>
          <Button
            variant={isSignupMode ? "default" : "ghost"}
            className="flex-1 rounded-md"
            onClick={() => setIsSignupMode(true)}
          >
            Sign Up
          </Button>
        </div>
        
        {isSignupMode ? (
          <SignupForm supabase={supabase} onSuccess={handleSignupSuccess} />
        ) : (
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: 'hsl(35 100% 55%)',
                    brandAccent: 'hsl(45 100% 55%)',
                  }
                }
              }
            }}
            theme="light"
            providers={[]}
            view="sign_in"
          />
        )}
      </div>
    </div>
  );
};

export default Login;