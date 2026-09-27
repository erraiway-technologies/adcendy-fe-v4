import type { Metadata } from 'next';
import type { ReactNode } from 'react';

// Sign-in forms: reachable from every page, but never a search result.
export const metadata: Metadata = { robots: { index: false, follow: true } };

export default function SignInLayout({ children }: { children: ReactNode }) {
  return children;
}
