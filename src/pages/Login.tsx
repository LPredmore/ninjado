import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { SupabaseClient } from '@supabase/supabase-js';

interface LoginProps {
  supabase: SupabaseClient;
}

const Login = ({ supabase }: LoginProps) => {
  return (
    <div className="min-h-screen bg-ninja-background flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-lg">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-ninja-text">Task Ninja</h1>
          <p className="mt-2 text-gray-600">Sign in to manage your routines</p>
        </div>
        
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#7C3AED',
                  brandAccent: '#6D28D9',
                }
              }
            }
          }}
          theme="light"
          providers={[]}
        />
      </div>
    </div>
  );
};

export default Login;