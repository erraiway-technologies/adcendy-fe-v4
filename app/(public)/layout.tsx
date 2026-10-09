'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { SiteFooter } from '@/features/landing/components/home/SiteFooter';
import { SiteHeader } from '@/features/landing/components/home/SiteHeader';

// Every public page wears the homepage's header and palette; the sign-in
// screens are a form on their own, so they skip the footer.
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = pathname?.startsWith('/auth') || pathname?.startsWith('/admin/login');

  return (
    <div className="home-page min-h-screen">
      <SiteHeader />
      {children}
      {!isAuthRoute && <SiteFooter />}
    </div>
  );
}
