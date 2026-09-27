'use client';

import React, { useEffect, useState } from 'react';
import { ThemeProvider } from 'next-themes';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { SWRConfig } from 'swr';
import { Toaster } from '@/components/ui/toaster';
import { initializeAuthSync } from '@/features/auth/auth';
import { refreshSession } from '@/shared/api/http';
import { useRuntimeConfigReady } from '@/shared/runtime-config/features';
import { getBrowserRuntimeConfig } from '@/shared/runtime-config/types';
import { initErrorReporting } from '@/shared/monitoring/error-reporting';

// One client per render tree: on the server that is one per request, so public
// pages rendered there can never share cached data between visitors.
const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
        retry: false,
      },
    },
  });

function AuthSessionBootstrap() {
  useEffect(() => {
    const bootstrap = () => {
      void refreshSession();
    };
    const disconnectAuthSync = initializeAuthSync();

    bootstrap();
    window.addEventListener('auth-bootstrap-requested', bootstrap);

    return () => {
      window.removeEventListener('auth-bootstrap-requested', bootstrap);
      disconnectAuthSync();
    };
  }, []);

  return null;
}

/** Error reporting starts once runtime config says where reports go. */
function ErrorReportingBootstrap() {
  useEffect(() => {
    const config = getBrowserRuntimeConfig();
    if (config) initErrorReporting(config);
  }, []);

  return null;
}

const LOADING_RUNTIME_CONFIG = (
  <main className="flex min-h-screen items-center justify-center" role="status">
    Loading application configuration…
  </main>
);

/**
 * Renders its children only once the browser has the runtime configuration
 * (/runtime-config.js). The server never has it, so anything behind this gate
 * is drawn in the browser only. The signed-in app sits behind it; public pages
 * do not, so the server renders them in full.
 */
export function RuntimeConfigGate({
  children,
  fallback = LOADING_RUNTIME_CONFIG,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const runtimeConfigReady = useRuntimeConfigReady();
  return runtimeConfigReady ? children : fallback;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(createQueryClient);

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      {/* Both need the runtime configuration, so they start once it is there -
          invisibly, without holding back the page. */}
      <RuntimeConfigGate fallback={null}>
        <ErrorReportingBootstrap />
        <AuthSessionBootstrap />
      </RuntimeConfigGate>
      <SWRConfig
        value={{
          shouldRetryOnError: false,
          errorRetryCount: 0,
        }}
      >
        <QueryClientProvider client={queryClient}>
          {children}
          <Toaster />
        </QueryClientProvider>
      </SWRConfig>
    </ThemeProvider>
  );
}
