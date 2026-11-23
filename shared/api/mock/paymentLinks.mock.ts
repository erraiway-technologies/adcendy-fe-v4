import {
  type AdminPaymentLink,
  type AdminPaymentLinkPage,
  type IssuedPaymentLink,
  type PaymentLinkOptions,
  type PaymentLinkPayment,
  type PaymentLinkPreview,
  type PaymentLinkRequest,
  type PaymentLinkState,
  type PublicPaymentLink,
} from '../../types/paymentLinks.ts';

// Local stand-in for the payment links service: India prices with 18% GST on
// top, one key per link, the client's email to open it.

const PACKAGES = [{ sku: 'Launch', credits: 1, amountMinor: 1_990_000, currency: 'INR' }];
const CLIENT = { email: 'client@example.com', name: 'Example Client' };

type MockLink = AdminPaymentLink & { key: string; preview: PaymentLinkPreview };
const links: MockLink[] = [];

async function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function price(request: PaymentLinkRequest): PaymentLinkPreview {
  const lines = request.lines.map((line) => {
    const bundle = PACKAGES.find((item) => item.sku === line.sku);
    if (!bundle) throw new Error('One of the packages is not sold in this market.');
    return {
      sku: bundle.sku,
      label: `${bundle.sku} (1 credit each)`,
      quantity: line.quantity,
      unitAmountMinor: bundle.amountMinor,
      amountMinor: bundle.amountMinor * line.quantity,
    };
  });
  const subtotalMinor = lines.reduce((sum, line) => sum + line.amountMinor, 0);
  const discountMinor = request.discountMinor ?? 0;
  if (discountMinor >= subtotalMinor) throw new Error('The discount must be less than the price.');
  const taxableMinor = subtotalMinor - discountMinor;
  const taxMinor = Math.round((taxableMinor * 1800) / 10_000);
  return {
    client: CLIENT,
    pricingCountryCode: 'IN',
    currency: 'INR',
    lines,
    subtotalMinor,
    discountMinor,
    taxableMinor,
    taxMinor,
    totalMinor: taxableMinor + taxMinor,
    tax: { label: 'GST', rateBasisPoints: 1800 },
    credits: lines.reduce((sum, line) => sum + line.quantity, 0),
    billingProblem: request.billingDetails?.stateCode && request.billingDetails.postalCode ? null : 'Choose your state.',
  };
}

const newKey = () =>
  Array.from({ length: 43 }, () => 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_'[Math.floor(Math.random() * 64)]).join('');

function find(key: string): MockLink {
  const link = links.find((item) => item.key === key);
  if (!link) throw new Error('This payment link is not valid.');
  return link;
}

function strip(link: MockLink): AdminPaymentLink {
  const copy: Partial<MockLink> = { ...link };
  delete copy.key;
  delete copy.preview;
  return copy as AdminPaymentLink;
}
const url = (key: string) => `${typeof window === 'undefined' ? '' : window.location.origin}/pay/${key}`;

export const paymentLinksMockAdapter = {
  async options(): Promise<PaymentLinkOptions> {
    await delay(50);
    return {
      markets: [
        { countryCode: 'IN', currency: 'INR', taxed: true },
        { countryCode: 'US', currency: 'USD', taxed: true },
      ],
      packages: PACKAGES,
      billingDetails: {
        required: true,
        states: [
          { code: '27', name: 'Maharashtra' },
          { code: '08', name: 'Rajasthan' },
        ],
        fullAddressFromMinor: 5_000_000,
      },
      client: { ...CLIENT, saved: null },
      limits: { maxLines: 10, maxQuantity: 50, defaultExpiryDays: 7, minExpiryDays: 1, maxExpiryDays: 30 },
    };
  },

  async preview(request: PaymentLinkRequest): Promise<PaymentLinkPreview> {
    await delay(50);
    return price(request);
  },

  async create(request: PaymentLinkRequest): Promise<IssuedPaymentLink> {
    await delay(50);
    const preview = price(request);
    if (preview.billingProblem) throw new Error(preview.billingProblem);
    const key = newKey();
    const link: MockLink = {
      id: `link_${links.length + 1}`,
      state: 'open',
      locked: false,
      client: CLIENT,
      orderId: `order_link_${links.length + 1}`,
      currency: preview.currency,
      totalMinor: preview.totalMinor,
      taxMinor: preview.taxMinor,
      credits: preview.credits,
      lines: preview.lines,
      discountMinor: preview.discountMinor,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + (request.expiresInDays ?? 7) * 86_400_000).toISOString(),
      paidAt: null,
      emailedAt: new Date().toISOString(),
      emailError: null,
      key,
      preview,
    };
    links.unshift(link);
    return { link: strip(link), url: url(key) };
  },

  async list(): Promise<AdminPaymentLinkPage> {
    await delay(50);
    return { items: links.map(strip), page: 1, pageSize: 20, total: links.length };
  },

  async cancel(id: string): Promise<AdminPaymentLink> {
    const link = links.find((item) => item.id === id);
    if (!link || link.state !== 'open') throw new Error('Only an unpaid link can be cancelled.');
    link.state = 'cancelled';
    return strip(link);
  },

  async renew(id: string): Promise<IssuedPaymentLink> {
    const link = links.find((item) => item.id === id);
    if (!link || link.state !== 'open') throw new Error('Only an unpaid link can be sent again.');
    link.key = newKey();
    return { link: strip(link), url: url(link.key) };
  },

  async publicState(key: string): Promise<{ state: PaymentLinkState }> {
    return { state: find(key).state };
  },

  async open(key: string, email: string): Promise<PublicPaymentLink> {
    const link = find(key);
    if (email.trim().toLowerCase() !== link.client.email) throw new Error("That email doesn't match this payment link.");
    const { preview } = link;
    return {
      state: link.state,
      client: { name: CLIENT.name, email: CLIENT.email },
      currency: preview.currency,
      lines: preview.lines,
      subtotalMinor: preview.subtotalMinor,
      discountMinor: preview.discountMinor,
      taxableMinor: preview.taxableMinor,
      taxMinor: preview.taxMinor,
      tax: preview.tax,
      totalMinor: preview.totalMinor,
      credits: preview.credits,
      expiresAt: link.expiresAt,
      billingDetails: { stateName: 'Maharashtra', postalCode: '411001', gstin: null, businessName: null },
      requirements: {
        documents: [{ id: 'doc-terms', documentType: 'TERMS_OF_SERVICE', version: '1', title: 'Terms of Service', publicUrl: '/terms' }],
        consents: [],
      },
    };
  },

  async pay(key: string): Promise<PaymentLinkPayment> {
    const link = find(key);
    return {
      providerOrderId: `order_mock_${link.id}`,
      amountMinor: link.totalMinor,
      currency: link.currency,
      prefillEmail: link.client.email,
      description: `${link.credits} credits`,
    };
  },

  async verify(key: string): Promise<{ state: PaymentLinkState }> {
    const link = find(key);
    link.state = 'paid';
    link.paidAt = new Date().toISOString();
    return { state: 'paid' };
  },
};
