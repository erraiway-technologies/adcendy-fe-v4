import type { Metadata } from 'next';
import { PaymentLinkView } from './PaymentLinkView';

type Params = { params: Promise<{ key: string }> };

// R-14b: the page a payment link opens. Never indexed, and the address (which
// carries the link's key) is never sent on as a referrer to Razorpay or the
// policy pages.
export const metadata: Metadata = {
  title: 'Pay your AdCendy order',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
};

export default async function PaymentLinkPage({ params }: Params) {
  return <PaymentLinkView linkKey={(await params).key} />;
}
