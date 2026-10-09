'use client';

import { useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { clearAuth, getToken, getUser, setAuthSession } from '@/features/auth/auth';
import { authRepository } from '@/shared/api/repositories';
import { refreshSession } from '@/shared/api/http';
import { authApi } from '@/src/lib/api/auth';
import { getAuthRedirectUrl } from '@/src/lib/auth-redirect';
import { X } from 'lucide-react';
import Loading from './loading';
import { useLandingDesignVariant } from '@/features/landing/hooks/useLandingDesignVariant';
import { AuthV2Shell } from '@/components/auth/auth-v2-shell';

function LoginContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get('next') ?? searchParams.get('returnTo');
  const signupQuery = nextParam ? `?next=${encodeURIComponent(nextParam)}` : '';
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const isAdminLoginFlow = pathname === '/admin/login';
  const variant = useLandingDesignVariant();
  // Every design but the classic v1 signs in inside the shell.
  const inShell = variant !== 'v1';

  useEffect(() => {
    let isCancelled = false;

    const redirectExistingSession = async () => {
      let token = getToken();
      let user = getUser();

      if (!token || !user) {
        const refreshResult = await refreshSession();
        if (!refreshResult.ok) return;
        token = refreshResult.session.accessToken;
        user = refreshResult.session.user;
      }

      try {
        if (user.role === 'ADMIN') {
          await authRepository.verifyAdminAccess();
        }

        if (isAdminLoginFlow && user.role !== 'ADMIN') {
          try {
            await authRepository.logout();
          } catch {
            // Continue clearing the local session if logout is unavailable.
          }
          clearAuth();
          if (!isCancelled) {
            setError('Access denied. This sign-in is for admin users only.');
          }
          return;
        }

        if (!isCancelled) {
          router.replace(isAdminLoginFlow ? '/admin' : getAuthRedirectUrl(nextParam, user.role));
        }
      } catch {
        clearAuth();
      }
    };

    void redirectExistingSession();

    return () => {
      isCancelled = true;
    };
  }, [isAdminLoginFlow, nextParam, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Call auth API with OpenAPI types
      const result = await authApi.login({
        email: formData.email,
        password: formData.password,
      });

      // The access token is held in memory. The Backend already set the
      // refresh token in its HttpOnly cookie.
      setAuthSession({
        accessToken: result.accessToken,
        user: result.user,
      });

      if (result.user.role === 'ADMIN') {
        await authRepository.verifyAdminAccess();
      }

      if (isAdminLoginFlow && result.user.role !== 'ADMIN') {
        try {
          await authRepository.logout();
        } catch {
          // Continue clearing the local session if logout is unavailable.
        }
        clearAuth();
        setError('Access denied. This sign-in is for admin users only.');
        setIsLoading(false);
        return;
      }

      // Calculate redirect URL
      const redirectUrl = isAdminLoginFlow ? '/admin' : getAuthRedirectUrl(nextParam, result.user.role);
      console.log('Login successful, redirecting to:', redirectUrl);
      
      // Use replace to avoid back button issues
      router.replace(redirectUrl);
    } catch (err: any) {
      clearAuth();
      setError(err.message || (isAdminLoginFlow ? 'Admin access denied.' : 'Invalid email or password'));
      setIsLoading(false);
    }
  };

  const form = (
    <>
      {!inShell && (
        <>
          {/* Close button to go back to landing page */}
          <Link 
            href="/"
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Back to home"
          >
            <X className="w-5 h-5" />
          </Link>

          <div className="text-center space-y-2">
            <h1 className="font-space-grotesk text-2xl font-bold">Welcome to AdCendy</h1>
            <p className="text-sm text-muted-foreground">
              {isAdminLoginFlow ? 'Sign in to the admin console' : 'Sign in to your account'}
            </p>
          </div>
        </>
      )}

      <form
        className="space-y-4"
        onSubmit={handleLogin}
      >
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-md">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email" 
            name="email"
            type="email" 
            placeholder="your@email.com" 
            value={formData.email}
            onChange={handleInputChange}
            className={inShell ? 'h-11 bg-white/[.04] border-white/14 text-white/90 placeholder:text-white/45 focus-visible:ring-white/35 focus-visible:border-white/50' : ''}
            required 
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link 
              href="/auth/forgot-password" 
              className={inShell ? 'text-xs text-white/70 hover:text-white/90 transition-colors' : 'text-xs text-primary hover:underline'}
            >
              Forgot password?
            </Link>
          </div>
          <Input 
            id="password" 
            name="password"
            type="password" 
            placeholder="••••••••" 
            value={formData.password}
            onChange={handleInputChange}
            className={inShell ? 'h-11 bg-white/[.04] border-white/14 text-white/90 placeholder:text-white/45 focus-visible:ring-white/35 focus-visible:border-white/50' : ''}
            required 
          />
        </div>

        <Button type="submit" className={inShell ? 'w-full h-11 bg-white text-[#1E1E1E] hover:bg-[#E9E9E6] font-medium' : 'w-full'} disabled={isLoading}>
          {isLoading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      {!isAdminLoginFlow && (
        <div className={inShell ? 'text-center text-sm text-white/60' : 'text-center text-sm text-muted-foreground'}>
          Don't have an account?{' '}
          <Link href={`/auth/signup${signupQuery}`} className={inShell ? 'text-white/90 hover:underline' : 'text-primary hover:underline'}>
            Sign up
          </Link>
        </div>
      )}
    </>
  );

  if (inShell) {
    return (
      <AuthV2Shell
        title={isAdminLoginFlow ? 'Admin sign in' : 'Sign in'}
        subtitle={isAdminLoginFlow ? 'Access the admin console' : 'Continue your intelligence journey'}
        modal
      >
        {form}
      </AuthV2Shell>
    );
  }

  return (
    <Card className="w-full max-w-md p-8 space-y-6 border border-border bg-card relative">
      {form}
    </Card>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen text-foreground">
      <Suspense fallback={<Loading />}>
        <LoginContent />
      </Suspense>
    </div>
  );
}


