import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { SupabaseClient } from '@supabase/supabase-js';
import logo from '@/assets/logo.png';

interface LoginProps {
  supabase: SupabaseClient;
}

const Login = ({ supabase }: LoginProps) => {
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
          <p className="mt-2 text-muted-foreground">Sign in to manage your routines</p>
        </div>
        
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
        />
      </div>
    </div>
  );
};

export default Login;