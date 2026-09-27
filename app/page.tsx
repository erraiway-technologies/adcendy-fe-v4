import { LandingPage } from '@/features/landing/components/LandingPage';

// Rendered on the server, so the front page arrives as finished HTML - readable
// before any JavaScript runs, and by search engines and link previews.
export default function Home() {
  return <LandingPage />;
}
