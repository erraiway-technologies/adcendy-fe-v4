'use client';

import { useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { clearAuth, getToken, getUser, setAuthSession } from '@/features/auth/auth';
import { authRepository } from '@/shared/api/repositories';
import { refreshSession } from '@/shared/api/http';
import { authApi } from '@/src/lib/api/auth';
import { getAuthRedirectUrl } from '@/src/lib/auth-redirect';
import Loading from './loading';
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
            className="h-11 bg-white/[.04] border-white/14 text-white/90 placeholder:text-white/45 focus-visible:ring-white/35 focus-visible:border-white/50"
            required 
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link 
              href="/auth/forgot-password" 
              className="text-xs text-white/70 hover:text-white/90 transition-colors"
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
            className="h-11 bg-white/[.04] border-white/14 text-white/90 placeholder:text-white/45 focus-visible:ring-white/35 focus-visible:border-white/50"
            required 
          />
        </div>

        <Button type="submit" className="w-full h-11 bg-white text-[#1E1E1E] hover:bg-[#E9E9E6] font-medium" disabled={isLoading}>
          {isLoading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      {!isAdminLoginFlow && (
        <div className="text-center text-sm text-white/60">
          Don't have an account?{' '}
          <Link href={`/auth/signup${signupQuery}`} className="text-white/90 hover:underline">
            Sign up
          </Link>
        </div>
      )}
    </>
  );

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

export default function LoginPage() {
  return (
    <div className="min-h-screen text-foreground">
      <Suspense fallback={<Loading />}>
        <LoginContent />
      </Suspense>
    </div>
  );
}


